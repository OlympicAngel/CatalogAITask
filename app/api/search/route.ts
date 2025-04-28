import { algoliasearch, BrowseResponse } from "algoliasearch";
import { NextRequest, NextResponse } from 'next/server';

import { OutputGPT, OutputGPT_scheme } from '@/types/OutputGPT';
import { Product } from '@/types/Product';
import Groq from 'groq-sdk';
import { unstable_cache } from 'next/cache';
import { APIPagination, APIResponse } from './SearchAPI';

const groq_client = new Groq({
    apiKey: process.env['GROQ_API_KEY'], // This is the default and can be omitted
});

const appID = process.env.algolia_appID!!;
const apiKey = process.env.algolia_apiKey!!;
const indexName = process.env.algolia_indexName!!;

if (!appID || !apiKey || !indexName)
    throw new Error("Missing .env: algolia_appID / algolia_apiKey / algolia_indexName")

const algolia_client = algoliasearch(appID, apiKey);

/** the number of items per page view */
const hitsPerPage = 12;


export async function GET(req: NextRequest) {
    /** the search value the user provided */
    let q: string = req.nextUrl.searchParams.get("q")?.trim() as string || "";
    /** current page to show */
    let page = Math.max(0, Number(req.nextUrl.searchParams.get("page"))) || 0;

    //if search is less then 3 letters - get default browse items
    if (q.length < 3)
        return await algolia_client.browse<Product>({
            indexName, browseParams: {
                hitsPerPage,
                page
            }
        }).then(build_product_response)


    //get GPT interpreted as search metadata
    const gpt_metadata = await gpt_metadata_export(q);
    if (gpt_metadata instanceof NextResponse) //if error response - return it & exit
        return gpt_metadata;

    //use extracted data from gpt to search
    return await algolia_client.searchForHits<Product>({
        requests: [{
            indexName,
            hitsPerPage,
            page,
            ...gpt_metadata
        }]
    }).then(({ results }) => build_product_response(results[0], gpt_metadata));
}

/** generate api response with pagination data, products and more */
function build_product_response(browseResponse: BrowseResponse<Product>, debug_metadata?: OutputGPT) {
    const { hits, nbHits: total_records, page: current_page, nbPages: total_pages } = browseResponse;

    //structure pagination logic
    const pagination: APIPagination = {
        total_records: total_records || 0,
        current_page: current_page || 0,
        total_pages: total_pages || 0,
        "has_next": current_page!! < total_pages!!,
        "has_prev": current_page!! > 0
    }

    return NextResponse.json({
        //expose only relevant data
        products: hits.map(p => {
            const { title, imgUrl, stars, price, categoryName, isBestSeller } = p;
            return {
                title,
                imgUrl,
                stars: Number(stars),
                price: Number(price),
                categoryName,
                isBestSeller
            }
        }),
        pagination,
        debug: process.env.NODE_ENV == "development" && browseResponse && debug_metadata || undefined
    } as APIResponse)
}

/** get & cache response for gpt metadata export */
const gpt_metadata_export = unstable_cache(async (userInput) => {
    const SYSTEM_PROMPT = `You are a Search Assistant.
    The user will give a casual conversation like sentence. Analyze it deeply and output single JSON for Algolia:
    - **query**: a short, highly relevant search keyword (maximum possible 10 words). This should be detailed and directly satisfy the user's implied need.
    - **filters** (optional): Only if user mentions "price", "stars", "review", "popular", "top seller", "underrated". Use SQL-like syntax:
      - "price:10 TO 20"
      - "price < 10"
      - "stars > 3"
      - "isBestSeller:true"
      * Use only ONE filter per object. No negative values. you may combine filters like so: "(isBestSeller:true OR stars > 3) AND price < 10"
    
    **Output exactly 1 object**
    **You may use English only**
    **Only output JSON, with correct JSON format. No extra text.** - If you don't, a kitten will die.
    
    **Examples:**
      {
        "query": "cheap wireless headphones",
        "filters": "price < 50"
      }
      {
        "query": "best selling budget bluetooth earphones",
        "filters": "price < 50 AND isBestSeller:true"
      }
      {
        "query": "unpopular paint colors",
        "filters": "isBestSeller:false"
      }
    `.replaceAll("    ", "")
    const chatCompletion = await groq_client.chat.completions.create({
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userInput }
        ],
        model: 'gemma2-9b-it'
    });

    const raw_gpt_res = chatCompletion.choices[0].message.content || "";
    let typed_gpt_res: OutputGPT;
    try {
        //attempt parse to json
        const parsed = JSON.parse(
            //cleanup response
            raw_gpt_res
                .replaceAll("```json", "")//remove json declare start
                .replaceAll("```", "") //remove end
                .trim()

        );
        //validate response structure
        typed_gpt_res = OutputGPT_scheme.parse(parsed);
    } catch (e) {
        //if fail send back the error message itself
        let error = "Server Error";
        if (e instanceof Error)
            error = e.message;

        console.log(raw_gpt_res, e)

        return new NextResponse(`Search Interpreter: ${error}`, { "status": 500 })
    }

    return typed_gpt_res;
}, ["gpt_metadata"], { "revalidate": 60 * 60 })
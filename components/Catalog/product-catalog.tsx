"use client";;
import { APIResponse } from "@/app/api/search/SearchAPI";
import { Button } from "@/components/ui/button";
import { SetStateAction, useEffect, useState } from "react";
import useSWR from 'swr';
import { useDebounce } from 'use-debounce';
import { Input } from "../ui/input";
import { ProductView } from "./ProductView";

const fetcher = async (url: string): Promise<APIResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('פעולה נכשלה');
  return res.json();
};

/** main wrapper for catalog */
export function ProductCatalog() {
  const [rawSearch, setRawSearch] = useState("") //hold raw data of user input
  const [search] = useDebounce(rawSearch, 1000); //debounce that updates after X sec of no input
  const [page, setPage] = useState(0)

  /** reset page value whenever search(debounced) changed */
  useEffect(() => {
    setPage(0);
  }, [search])

  const { data: api_data, error, isLoading } = useSWR<APIResponse>(`/api/search?q=${search.trim()}&page=${page}`, fetcher, {
    keepPreviousData: true, //keep products while loading

    //prevent revalidate
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  })

  const products = api_data?.products;
  const pagination = api_data?.pagination

  return (<>
    <div className="space-y-10">
      <Input onChange={ (e) => setRawSearch(e.target.value) } placeholder="תאר לנו מה תרצה לחפש?" />

      { !products?.length && <p className="text-red-500 text-center text-2xl font-bold">לא נמצאו מוצרים להציג</p> }

      { products &&
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          { products.map((product, index) => <ProductView key={ index } product={ product } />) }
        </div>
      }
      <Pagination cfg={ pagination } setPage={ setPage } />
    </div>
  </>
  )
}

function Pagination({ cfg, setPage }: { cfg?: APIResponse["pagination"], setPage: (value: SetStateAction<number>) => void }) {
  return (
    <div className="flex flex-row-reverse items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm mt-8">
      { cfg?.has_next &&
        <Button variant="outline" size="sm" onClick={ () => setPage((pre) => pre + 1) }>
          הבא
        </Button>
      }

      <p className="text-sm text-gray-700">
        דף מספר { (cfg?.current_page!! + 1) || 0 } מתוך { cfg?.total_pages || 0 }
      </p>

      { cfg?.has_prev &&
        <Button variant="outline" size="sm" onClick={ () => setPage((pre) => pre - 1) }>
          הקודם
        </Button>
      }
    </div>
  )
}
import { Product } from "@/types/Product";

/** pagination structure used by api route */
export type APIPagination = {
    /** total amount of records found from the search */
    total_records: number,

    /** current showing page */
    current_page: number,
    /** total pages for the search res */
    total_pages: number,

    /** indicates if there is a next page */
    has_next: boolean,
    /** indicates if there is a prevues page */
    has_prev: boolean;
}

export type APIResponse = {
    products: Product[]
    pagination: APIPagination,
    debug?: OutputGPT
}
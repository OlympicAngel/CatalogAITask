import { ProductCatalog } from "@/components/Catalog/product-catalog";

export default async function Home() {
  return (
    <main className="min-h-screen bg-slate-200">
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">קטלוג מוצרים</h1>

        <ProductCatalog />
      </div>
    </main>
  )
}

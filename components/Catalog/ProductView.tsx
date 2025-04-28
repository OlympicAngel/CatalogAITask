
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Product } from "@/types/Product";
import { Star } from "lucide-react";
import Image from "next/image";

/** single product view */
export function ProductView({ product }: { product: Product }) {
    return <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
        <div className="relative">
            <div className="aspect-square relative overflow-hidden">
                <Image
                    src={ product.imgUrl || "/placeholder.svg" }
                    alt={ product.title }
                    fill
                    className={ cn(
                        "object-scale-down transition-transform duration-500 hover:scale-110"
                    ) }
                />
            </div>

            { product.isBestSeller && (
                <Badge className="absolute top-3 left-3 text-white bg-amber-500 hover:bg-amber-600">הכי נמכרים</Badge>
            ) }
        </div>

        <div className="p-5 space-y-3">
            <h3 className="font-medium text line-clamp-2">{ product.title }</h3>
            <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-teal-700">${ product.price.toFixed(2) }</p>
                <StarView stars={ product.stars } />
            </div>

            <Button className="w-full bg-teal-600 hover:bg-teal-700">
                קנייה?
            </Button>
        </div>
    </div>
}

/** starts view logic */
function StarView({ stars }: { stars: number }) {
    return <div className="flex items-center">
        <div className="flex">
            { [...Array(5)].map((_, i) => (
                <Star key={ i }
                    className={ cn("w-4 h-4",
                        i < Math.round(stars) ? "fill-amber-400 text-amber-400" : "text-gray-300",
                    ) }
                />
            )) }
        </div>
        <span className="ml-2 text-sm text-gray-500">{ stars.toFixed(1) }</span>
    </div>
}

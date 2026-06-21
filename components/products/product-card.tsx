"use client"

import Link from "next/link"
import Image from "next/image"
import { Pencil, MoreVertical, Star, Copy, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { statusMeta, stockTone, type Product } from "@/lib/products-shared"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WishlistButton } from "@/components/wishlist/wishlist-button"

export function ProductCard({ product }: { product: Product }) {
  const meta = statusMeta[product.status]
  const discount =
    product.compareAt && product.compareAt > product.price
      ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
      : 0

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <WishlistButton productId={product.id} />
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur",
            meta.className,
          )}
        >
          <span className={cn("size-1.5 rounded-full", meta.dot)} />
          {meta.label}
        </span>
        {discount > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-destructive/90 px-2 py-1 text-xs font-semibold text-white shadow-sm">
            -{discount}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{product.category}</p>
          <div className="flex items-center gap-1 text-xs">
            <Star className="size-3.5 fill-accent-foreground text-accent-foreground" />
            <span className="font-medium">{product.rating}</span>
          </div>
        </div>
        <h3 className="mt-1.5 line-clamp-1 text-sm font-semibold leading-snug">{product.name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">SKU {product.sku}</p>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-semibold">${product.price}</span>
          {product.compareAt ? (
            <span className="text-sm text-muted-foreground line-through">${product.compareAt}</span>
          ) : null}
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={cn("font-medium", stockTone(product.stock))}>
            {product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}
          </span>
          <span className="text-muted-foreground">{product.sales.toLocaleString()} sold</span>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            size="lg"
            className="h-9 flex-1"
            render={<Link href={`/vendor/products/${product.id}/edit`} />}
          >
            <Pencil /> Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="icon-lg" aria-label="More actions" className="h-9 w-9" />
              }
            >
              <MoreVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem>
                <Eye /> View on store
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  )
}

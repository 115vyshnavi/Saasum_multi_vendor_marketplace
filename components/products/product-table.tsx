"use client"

import Link from "next/link"
import Image from "next/image"
import { Copy, Eye, MoreVertical, Pencil, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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

export function ProductTable({ products }: { products: Product[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Sales</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      <Image
                        src={p.image || "/placeholder.svg"}
                        alt={p.name}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        SKU {p.sku}
                        {p.variants ? ` · ${p.variants} variants` : ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                <td className="px-4 py-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-medium">${p.price}</span>
                    {p.compareAt ? (
                      <span className="text-xs text-muted-foreground line-through">${p.compareAt}</span>
                    ) : null}
                  </div>
                </td>
                <td className={cn("px-4 py-3 font-medium", stockTone(p.stock))}>
                  {p.stock === 0 ? "Out of stock" : p.stock}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.sales.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("h-5", statusMeta[p.status].className)}>
                    {statusMeta[p.status].label}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      render={<Link href={`/vendor/products/${p.id}/edit`} />}
                    >
                      <Pencil /> Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button size="icon-sm" variant="ghost" aria-label="More actions" />
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Search className="size-5" />
          </span>
          <p className="text-sm font-medium">No products found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  )
}

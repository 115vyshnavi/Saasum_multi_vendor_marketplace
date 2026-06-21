"use client"

import { useState } from "react"
import { Layers, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ProductVariant } from "@/lib/products-shared"

let counter = 0
const uid = () => `var-${Date.now()}-${counter++}`

const defaults: ProductVariant[] = [
  { id: uid(), name: "Default", sku: "", price: 0, stock: 0 },
]

export function VariantEditor({ initial }: { initial?: ProductVariant[] }) {
  const [variants, setVariants] = useState<ProductVariant[]>(initial?.length ? initial : defaults)

  const update = (id: string, key: keyof ProductVariant, value: string) =>
    setVariants((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, [key]: key === "price" || key === "stock" ? Number(value) || 0 : value }
          : v,
      ),
    )

  const add = () =>
    setVariants((prev) => [...prev, { id: uid(), name: "", sku: "", price: 0, stock: 0 }])

  const remove = (id: string) => setVariants((prev) => prev.filter((v) => v.id !== id))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Layers className="size-4 text-muted-foreground" />
          Variants
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {variants.length}
          </span>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus /> Add variant
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.7fr_auto] gap-3 border-b border-border bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground sm:grid">
          <span>Variant</span>
          <span>SKU</span>
          <span>Price</span>
          <span>Stock</span>
          <span className="sr-only">Remove</span>
        </div>
        <div className="flex flex-col">
          {variants.map((v) => (
            <div
              key={v.id}
              className="grid grid-cols-1 gap-3 border-b border-border p-3 last:border-0 sm:grid-cols-[1.4fr_1fr_0.8fr_0.7fr_auto] sm:items-center"
            >
              <Input
                aria-label="Variant name"
                value={v.name}
                onChange={(e) => update(v.id, "name", e.target.value)}
                placeholder="e.g. Medium / Black"
                className="h-9"
              />
              <Input
                aria-label="SKU"
                value={v.sku}
                onChange={(e) => update(v.id, "sku", e.target.value)}
                placeholder="SKU-001"
                className="h-9"
              />
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  aria-label="Price"
                  type="number"
                  value={v.price || ""}
                  onChange={(e) => update(v.id, "price", e.target.value)}
                  placeholder="0"
                  className="h-9 pl-6"
                />
              </div>
              <Input
                aria-label="Stock"
                type="number"
                value={v.stock || ""}
                onChange={(e) => update(v.id, "stock", e.target.value)}
                placeholder="0"
                className="h-9"
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Remove variant"
                onClick={() => remove(v.id)}
                disabled={variants.length === 1}
                className="justify-self-end text-muted-foreground hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import { LayoutGrid, Search, Table2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ProductGrid } from "@/components/products/product-grid"
import { ProductTable } from "@/components/products/product-table"
import { statusMeta, type ProductStatus, type Product } from "@/lib/products-shared"

const filters: { key: ProductStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "draft", label: "Drafts" },
  { key: "rejected", label: "Rejected" },
]

export function VendorProductsView({ products: initialProducts }: { products: Product[] }) {
  const [filter, setFilter] = useState<ProductStatus | "all">("all")
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"grid" | "table">("grid")

  const counts = useMemo(() => {
    return {
      all: initialProducts.length,
      active: initialProducts.filter((p) => p.status === "active").length,
      pending: initialProducts.filter((p) => p.status === "pending").length,
      draft: initialProducts.filter((p) => p.status === "draft").length,
      rejected: initialProducts.filter((p) => p.status === "rejected").length,
    }
  }, [initialProducts])

  const visible = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchFilter = filter === "all" || p.status === filter
      const matchQuery =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase())
      return matchFilter && matchQuery
    })
  }, [filter, query, initialProducts])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  filter === f.key ? "bg-background/20" : "bg-muted",
                )}
              >
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="h-9 w-full pl-8 sm:w-56"
            />
          </div>
          <div className="flex items-center rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-md transition-colors",
                view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              aria-label="Table view"
              aria-pressed={view === "table"}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-md transition-colors",
                view === "table" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Table2 className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-16 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Search className="size-5" />
          </span>
          <p className="text-sm font-medium">No products found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : view === "grid" ? (
        <ProductGrid products={visible} />
      ) : (
        <ProductTable products={visible} />
      )}
    </div>
  )
}

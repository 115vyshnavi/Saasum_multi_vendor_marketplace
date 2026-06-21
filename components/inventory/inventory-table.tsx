"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { ArrowUpDown, Filter, MoreVertical, PackagePlus, Pencil, Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { inventoryItems, stockLevel } from "@/lib/inventory"
import { StockBadge } from "@/components/inventory/stock-badge"

const filters = [
  { id: "all", label: "All" },
  { id: "in-stock", label: "In stock" },
  { id: "low-stock", label: "Low stock" },
  { id: "out-of-stock", label: "Out of stock" },
] as const

type FilterId = (typeof filters)[number]["id"]

export function InventoryTable() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<FilterId>("all")

  const rows = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesQuery =
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.sku.toLowerCase().includes(query.toLowerCase())
      const matchesFilter = filter === "all" || stockLevel(item) === filter
      return matchesQuery && matchesFilter
    })
  }, [query, filter])

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>
              {rows.length} of {inventoryItems.length} SKUs across 3 fulfilment centres
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or SKU"
                className="h-10 pl-9"
                aria-label="Search inventory"
              />
            </div>
            <Button variant="outline" className="h-10 px-3 text-sm">
              <SlidersHorizontal className="size-4" /> Filters
            </Button>
            <Button className="h-10 px-3 text-sm">
              <PackagePlus className="size-4" /> Add stock
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
                filter === f.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {f.id === "all" && <Filter className="size-3.5" />}
              {f.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-5 py-3">Product</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    On hand <ArrowUpDown className="size-3" />
                  </span>
                </th>
                <th className="px-4 py-3">Reserved</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Sold 30d</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const available = item.stock - item.reserved
                return (
                  <tr key={item.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            SKU {item.sku} · {item.category}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.warehouse}</td>
                    <td className="px-4 py-3 font-medium tabular-nums">{item.stock}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{item.reserved}</td>
                    <td
                      className={cn(
                        "px-4 py-3 font-medium tabular-nums",
                        available <= 0 ? "text-destructive" : "text-foreground",
                      )}
                    >
                      {available > 0 ? available : 0}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{item.sold30d}</td>
                    <td className="px-4 py-3">
                      <StockBadge item={item} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="outline">
                          <Pencil /> Adjust
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button size="icon-sm" variant="ghost" aria-label="More actions" />}
                          >
                            <MoreVertical />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem>
                              <PackagePlus /> Restock
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil /> Edit details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View history</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Search className="size-5" />
            </span>
            <p className="text-sm font-medium">No items found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

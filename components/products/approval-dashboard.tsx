"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Check, Eye, Search, SlidersHorizontal, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { statusMeta, type Product, type ProductStatus } from "@/lib/products-shared"

const reviewable: ProductStatus[] = ["pending", "active", "rejected"]

const filters: { key: ProductStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "active", label: "Approved" },
  { key: "rejected", label: "Rejected" },
]

export function ApprovalDashboard({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(
    initialProducts.filter((p) => reviewable.includes(p.status)),
  )
  const [filter, setFilter] = useState<ProductStatus | "all">("pending")
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<Product | null>(null)
  const [action, setAction] = useState<"approve" | "reject" | null>(null)
  const [note, setNote] = useState("")

  const counts = useMemo(
    () => ({
      all: products.length,
      pending: products.filter((p) => p.status === "pending").length,
      active: products.filter((p) => p.status === "active").length,
      rejected: products.filter((p) => p.status === "rejected").length,
    }),
    [products],
  )

  const visible = useMemo(
    () =>
      products.filter((p) => {
        const matchFilter = filter === "all" || p.status === filter
        const matchQuery =
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.vendor.toLowerCase().includes(query.toLowerCase())
        return matchFilter && matchQuery
      }),
    [products, filter, query],
  )

  const openModal = (product: Product, type: "approve" | "reject") => {
    setActive(product)
    setAction(type)
    setNote("")
  }
  const closeModal = () => {
    setActive(null)
    setAction(null)
  }
  const confirm = () => {
    if (!active || !action) return
    setProducts((prev) =>
      prev.map((p) =>
        p.id === active.id ? { ...p, status: action === "approve" ? "active" : "rejected" } : p,
      ),
    )
    closeModal()
  }

  return (
    <div className="flex flex-col gap-4">
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
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products or vendors"
              className="h-9 w-full pl-8 sm:w-64"
            />
          </div>
          <Button variant="outline" size="lg" className="h-9">
            <SlidersHorizontal /> Filters
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
                        <Image src={p.image || "/placeholder.svg"} alt={p.name} fill sizes="44px" className="object-cover" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">SKU {p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.vendor}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 font-medium">${p.price}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.submitted}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn("h-5", statusMeta[p.status].className)}>
                      {statusMeta[p.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status === "pending" ? (
                        <>
                          <Button size="sm" variant="ghost" aria-label="Preview">
                            <Eye />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openModal(p, "approve")}>
                            <Check /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openModal(p, "reject")}>
                            <X /> Reject
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Reviewed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Search className="size-5" />
            </span>
            <p className="text-sm font-medium">No products found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      <Dialog open={!!active} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <span
              className={cn(
                "mb-1 flex size-11 items-center justify-center rounded-xl",
                action === "approve" ? "bg-primary/12 text-primary" : "bg-destructive/12 text-destructive",
              )}
            >
              {action === "approve" ? <Check className="size-5" /> : <X className="size-5" />}
            </span>
            <DialogTitle>{action === "approve" ? "Approve product" : "Reject product"}</DialogTitle>
            <DialogDescription>
              {action === "approve" ? (
                <>
                  <span className="font-medium text-foreground">{active?.name}</span> by{" "}
                  <span className="font-medium text-foreground">{active?.vendor}</span> will go live and become
                  visible to shoppers.
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">{active?.name}</span> will be sent back to{" "}
                  <span className="font-medium text-foreground">{active?.vendor}</span>. Please share a reason.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="review-note" className="text-sm font-medium">
              {action === "approve" ? "Note to vendor (optional)" : "Reason for rejection"}
            </label>
            <Textarea
              id="review-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                action === "approve"
                  ? "Looks great! Your product is now live."
                  : "e.g. Product images are low resolution…"
              }
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} className="h-10 px-4">
              Cancel
            </Button>
            <Button
              variant={action === "approve" ? "default" : "destructive"}
              onClick={confirm}
              className="h-10 px-4"
            >
              {action === "approve" ? "Confirm approval" : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

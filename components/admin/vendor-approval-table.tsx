"use client"

import { useMemo, useState } from "react"
import {
  Building2,
  Check,
  FileText,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"
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

type Status = "pending" | "approved" | "rejected"

type Vendor = {
  id: string
  store: string
  owner: string
  email: string
  category: string
  country: string
  submitted: string
  docs: number
  status: Status
}

const initialVendors: Vendor[] = [
  { id: "v1", store: "Atelier Nord", owner: "Lena Müller", email: "lena@ateliernord.com", category: "Apparel", country: "Germany", submitted: "Mar 12", docs: 4, status: "pending" },
  { id: "v2", store: "Kettle & Co.", owner: "Sam Obi", email: "sam@kettleco.com", category: "Home & Kitchen", country: "USA", submitted: "Mar 12", docs: 4, status: "pending" },
  { id: "v3", store: "Verde Skincare", owner: "Mara Lopez", email: "mara@verde.io", category: "Beauty", country: "Spain", submitted: "Mar 11", docs: 3, status: "pending" },
  { id: "v4", store: "Pixel Forge", owner: "Theo Vance", email: "theo@pixelforge.gg", category: "Electronics", country: "Canada", submitted: "Mar 10", docs: 4, status: "approved" },
  { id: "v5", store: "Loomwell Textiles", owner: "Priya Nair", email: "priya@loomwell.in", category: "Home & Kitchen", country: "India", submitted: "Mar 09", docs: 2, status: "rejected" },
  { id: "v6", store: "Northwind Coffee", owner: "Jonas Berg", email: "jonas@northwind.no", category: "Grocery", country: "Norway", submitted: "Mar 08", docs: 4, status: "approved" },
]

const statusMeta: Record<Status, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-accent/25 text-accent-foreground" },
  approved: { label: "Approved", className: "bg-primary/12 text-primary" },
  rejected: { label: "Rejected", className: "bg-destructive/12 text-destructive" },
}

const filters: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
]

export function VendorApprovalTable() {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors)
  const [filter, setFilter] = useState<Status | "all">("pending")
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<Vendor | null>(null)
  const [action, setAction] = useState<"approve" | "reject" | null>(null)
  const [note, setNote] = useState("")

  const counts = useMemo(() => {
    return {
      all: vendors.length,
      pending: vendors.filter((v) => v.status === "pending").length,
      approved: vendors.filter((v) => v.status === "approved").length,
      rejected: vendors.filter((v) => v.status === "rejected").length,
    }
  }, [vendors])

  const visible = useMemo(() => {
    return vendors.filter((v) => {
      const matchFilter = filter === "all" || v.status === filter
      const matchQuery =
        v.store.toLowerCase().includes(query.toLowerCase()) ||
        v.owner.toLowerCase().includes(query.toLowerCase())
      return matchFilter && matchQuery
    })
  }, [vendors, filter, query])

  const openModal = (vendor: Vendor, type: "approve" | "reject") => {
    setActive(vendor)
    setAction(type)
    setNote("")
  }

  const closeModal = () => {
    setActive(null)
    setAction(null)
  }

  const confirm = () => {
    if (!active || !action) return
    setVendors((prev) =>
      prev.map((v) =>
        v.id === active.id ? { ...v, status: action === "approve" ? "approved" : "rejected" } : v,
      ),
    )
    closeModal()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
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
              placeholder="Search vendors"
              className="h-9 w-full pl-8 sm:w-56"
            />
          </div>
          <Button variant="outline" size="lg" className="h-9">
            <SlidersHorizontal /> Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Docs</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((v) => (
                <tr key={v.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{v.store}</p>
                        <p className="truncate text-xs text-muted-foreground">{v.owner} · {v.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{v.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.country}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.submitted}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <FileText className="size-3.5" /> {v.docs}/4
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn("h-5", statusMeta[v.status].className)}>
                      {statusMeta[v.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {v.status === "pending" ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openModal(v, "approve")}>
                            <Check /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openModal(v, "reject")}>
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
            <p className="text-sm font-medium">No vendors found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Approve / Reject modal */}
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
            <DialogTitle>
              {action === "approve" ? "Approve vendor" : "Reject vendor"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve" ? (
                <>
                  <span className="font-medium text-foreground">{active?.store}</span> will be activated and can start
                  listing products and accepting orders.
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">{active?.store}</span> will be notified that their
                  application was not approved. Please share a reason.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="note" className="text-sm font-medium">
              {action === "approve" ? "Welcome note (optional)" : "Reason for rejection"}
            </label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                action === "approve"
                  ? "Welcome to Saasum IQMart! Your store is now live…"
                  : "e.g. Business registration document is unreadable…"
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

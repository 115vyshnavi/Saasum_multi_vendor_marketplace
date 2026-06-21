"use client"

import React, { useState } from "react"
import {
  Boxes,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Check,
  X,
  Search,
  Calendar,
  Image as ImageIcon,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { updateReturnStatus } from "@/app/actions/returns"

type VendorReturn = {
  id: number
  orderId: string
  userId: string
  reason: string
  description: string | null
  images: string[] | null
  status: string
  refundMethod: string | null
  rejectionReason: string | null
  createdAt: Date
  updatedAt: Date
  shippingName: string
  totalAmount: string
}

type VendorReturnsClientProps = {
  initialReturns: VendorReturn[]
}

export function VendorReturnsClient({ initialReturns }: VendorReturnsClientProps) {
  const [returnsList, setReturnsList] = useState<VendorReturn[]>(initialReturns)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  
  // Rejection modal state
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null)
  const [rejectionNote, setRejectionNote] = useState<string>("")
  
  // Loading and error states
  const [actionLoadingOrderId, setActionLoadingOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Requested</span>
      case "approved":
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Approved</span>
      case "pickup_scheduled":
        return <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Pickup Scheduled</span>
      case "item_received":
        return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Item Received</span>
      case "refunded":
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Refunded</span>
      case "rejected":
        return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Rejected</span>
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">{status}</span>
    }
  }

  // Handle status update
  const handleUpdateStatus = async (orderId: string, newStatus: "approved" | "pickup_scheduled" | "item_received" | "rejected", note?: string) => {
    setActionLoadingOrderId(orderId)
    setError(null)
    try {
      const res = await updateReturnStatus(orderId, newStatus, note)
      if (res.success && res.returnRequest) {
        setReturnsList(prev =>
          prev.map(r => (r.orderId === orderId ? { ...r, status: res.returnRequest.status, rejectionReason: res.returnRequest.rejectionReason } : r))
        )
        if (newStatus === "rejected") {
          setRejectingOrderId(null)
          setRejectionNote("")
        }
      } else {
        setError(res.error || "Failed to update return status")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setActionLoadingOrderId(null)
    }
  }

  // Calculate statistics
  const stats = {
    total: returnsList.length,
    requested: returnsList.filter(r => r.status === "requested").length,
    processing: returnsList.filter(r => ["approved", "pickup_scheduled", "item_received"].includes(r.status)).length,
    completed: returnsList.filter(r => r.status === "refunded").length,
  }

  // Filter & Search returns
  const filteredReturns = returnsList.filter(r => {
    const matchesStatus = filterStatus === "all" || r.status === filterStatus
    const matchesSearch = r.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.shippingName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-extrabold text-3xl text-foreground tracking-tight">Returns & Refunds Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Review buyer return requests, schedule package pickups, and authorize inspect stages.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-2xl">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 rounded-3xl shadow-sm bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 border border-slate-100">
              <Boxes className="size-5" />
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Total Requests</p>
              <h3 className="text-xl font-extrabold mt-0.5 text-foreground">{stats.total}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 rounded-3xl shadow-sm bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="size-5" />
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Pending Action</p>
              <h3 className="text-xl font-extrabold mt-0.5 text-foreground">{stats.requested}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 rounded-3xl shadow-sm bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Truck className="size-5" />
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">In Progress</p>
              <h3 className="text-xl font-extrabold mt-0.5 text-foreground">{stats.processing}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 rounded-3xl shadow-sm bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Refunded</p>
              <h3 className="text-xl font-extrabold mt-0.5 text-foreground">{stats.completed}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-card border border-border/80 p-4 rounded-3xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {["all", "requested", "approved", "pickup_scheduled", "item_received", "refunded", "rejected"].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`h-8 px-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border transition-all ${
                filterStatus === st
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted/10 hover:text-foreground"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Order ID / Buyer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-semibold"
          />
        </div>
      </div>

      {/* Returns List */}
      <div className="bg-card border border-border/85 rounded-[2rem] overflow-hidden shadow-sm">
        {filteredReturns.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <Boxes className="size-12 text-muted-foreground/60 mx-auto" />
            <div>
              <h4 className="font-extrabold text-base text-foreground">No Return Requests</h4>
              <p className="text-xs text-muted-foreground mt-0.5">There are no return requests matching your selection.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-4 w-28">Order ID</th>
                  <th className="px-5 py-4 w-36">Requested Date</th>
                  <th className="px-5 py-4">Buyer</th>
                  <th className="px-5 py-4 w-40">Reason</th>
                  <th className="px-5 py-4">Details</th>
                  <th className="px-5 py-4 w-32">Status</th>
                  <th className="px-5 py-4 w-52 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredReturns.map(req => {
                  const isActionLoading = actionLoadingOrderId === req.orderId

                  return (
                    <tr key={req.id} className="align-middle hover:bg-muted/5 transition-all">
                      <td className="px-5 py-4 font-mono font-bold text-foreground">{req.orderId}</td>
                      <td className="px-5 py-4 text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar className="size-3.5" />
                        {new Date(req.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-5 py-4 font-semibold text-foreground">{req.shippingName}</td>
                      <td className="px-5 py-4">
                        <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                          {req.reason}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1.5 max-w-xs">
                          <p className="text-muted-foreground line-clamp-2">{req.description || "No description provided."}</p>
                          {req.images && req.images.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                              {req.images.map((img, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-md px-1.5 py-0.5 cursor-pointer"
                                  onClick={() => setSelectedReason(`${req.orderId}-${index}`)}
                                >
                                  <ImageIcon className="size-3" /> Proof {index + 1}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">{getStatusBadge(req.status)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {req.status === "requested" && (
                            <>
                              <Button
                                size="xs"
                                variant="outline"
                                className="rounded-lg h-7 font-bold border-rose-200 text-rose-600 hover:bg-rose-50"
                                onClick={() => setRejectingOrderId(req.orderId)}
                                disabled={isActionLoading}
                              >
                                <X className="size-3.5 mr-1" /> Reject
                              </Button>
                              <Button
                                size="xs"
                                className="rounded-lg h-7 font-bold"
                                onClick={() => handleUpdateStatus(req.orderId, "approved")}
                                disabled={isActionLoading}
                              >
                                <Check className="size-3.5 mr-1" /> Approve
                              </Button>
                            </>
                          )}

                          {req.status === "approved" && (
                            <Button
                              size="xs"
                              className="rounded-lg h-7 font-bold bg-indigo-600 hover:bg-indigo-700"
                              onClick={() => handleUpdateStatus(req.orderId, "pickup_scheduled")}
                              disabled={isActionLoading}
                            >
                              <Truck className="size-3.5 mr-1" /> Schedule Pickup
                            </Button>
                          )}

                          {req.status === "pickup_scheduled" && (
                            <Button
                              size="xs"
                              className="rounded-lg h-7 font-bold bg-purple-600 hover:bg-purple-700"
                              onClick={() => handleUpdateStatus(req.orderId, "item_received")}
                              disabled={isActionLoading}
                            >
                              <Boxes className="size-3.5 mr-1" /> Item Received
                            </Button>
                          )}

                          {req.status === "item_received" && (
                            <span className="text-[10px] text-muted-foreground font-semibold italic">Awaiting Admin Refund</span>
                          )}

                          {req.status === "refunded" && (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="size-3.5" /> Refund Completed
                            </span>
                          )}

                          {req.status === "rejected" && (
                            <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                              <XCircle className="size-3.5" /> Request Rejected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal overlay */}
      {rejectingOrderId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="border border-border/80 rounded-[2rem] w-full max-w-md shadow-2xl bg-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-border/60 pb-3">
                <h3 className="font-extrabold text-base text-foreground">Reject Return Request</h3>
                <button
                  onClick={() => setRejectingOrderId(null)}
                  className="p-1.5 hover:bg-muted rounded-full cursor-pointer transition-all border border-border"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Rejection Reason
                </label>
                <textarea
                  rows={3}
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="State the reason why this return request is being rejected..."
                  className="w-full p-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl font-bold"
                  onClick={() => setRejectingOrderId(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl font-bold bg-rose-600 hover:bg-rose-750"
                  onClick={() => handleUpdateStatus(rejectingOrderId, "rejected", rejectionNote)}
                  disabled={!rejectionNote.trim()}
                >
                  Confirm Rejection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

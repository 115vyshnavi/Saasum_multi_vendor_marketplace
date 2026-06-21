"use client"

import React, { useState } from "react"
import {
  ShieldAlert,
  Boxes,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Calendar,
  CreditCard,
  Percent,
  TrendingUp,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { processAdminRefund } from "@/app/actions/returns"

type AdminReturn = {
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

type AdminRefundsClientProps = {
  initialReturns: AdminReturn[]
}

export function AdminRefundsClient({ initialReturns }: AdminRefundsClientProps) {
  const [returnsList, setReturnsList] = useState<AdminReturn[]>(initialReturns)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  
  // Refund method states per order
  const [refundMethods, setRefundMethods] = useState<Record<string, "original_payment_method" | "store_credit">>({})
  
  // Action state
  const [actionLoadingOrderId, setActionLoadingOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Requested</span>
      case "approved":
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Approved</span>
      case "pickup_scheduled":
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Pickup Scheduled</span>
      case "item_received":
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Item Received</span>
      case "refunded":
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Refunded</span>
      case "rejected":
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Rejected</span>
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{status}</span>
    }
  }

  // Handle refund action
  const handleProcessRefund = async (orderId: string) => {
    const method = refundMethods[orderId] || "original_payment_method"
    setActionLoadingOrderId(orderId)
    setError(null)
    try {
      const res = await processAdminRefund(orderId, method)
      if (res.success && res.returnRequest) {
        setReturnsList(prev =>
          prev.map(r => (r.orderId === orderId ? { ...r, status: res.returnRequest.status, refundMethod: res.returnRequest.refundMethod } : r))
        )
      } else {
        setError(res.error || "Failed to process refund")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setActionLoadingOrderId(null)
    }
  }

  // Handle method change
  const handleMethodChange = (orderId: string, method: "original_payment_method" | "store_credit") => {
    setRefundMethods(prev => ({
      ...prev,
      [orderId]: method
    }))
  }

  // Calculate statistics
  const stats = {
    total: returnsList.length,
    pendingRefund: returnsList.filter(r => r.status === "item_received").length,
    inProgress: returnsList.filter(r => ["requested", "approved", "pickup_scheduled"].includes(r.status)).length,
    refunded: returnsList.filter(r => r.status === "refunded").length,
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-extrabold text-3xl text-foreground tracking-tight flex items-center gap-2">
            Admin Refunds Panel <span className="bg-primary/10 text-primary border-none font-bold text-xs rounded-full px-2.5 py-1">Admin</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Global command center to approve refunds, select refund methods, and sync inventory levels.</p>
        </div>
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
            <span className="flex size-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
              <Clock className="size-5" />
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Awaiting Refund</p>
              <h3 className="text-xl font-extrabold mt-0.5 text-foreground">{stats.pendingRefund}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 rounded-3xl shadow-sm bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <TrendingUp className="size-5" />
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">In Transit/Review</p>
              <h3 className="text-xl font-extrabold mt-0.5 text-foreground">{stats.inProgress}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 rounded-3xl shadow-sm bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Completed Refunds</p>
              <h3 className="text-xl font-extrabold mt-0.5 text-foreground">{stats.refunded}</h3>
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

      {/* Refunds Table */}
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
                  <th className="px-5 py-4 w-32">Requested Date</th>
                  <th className="px-5 py-4">Buyer</th>
                  <th className="px-5 py-4 w-24 text-right">Amount</th>
                  <th className="px-5 py-4">Reason</th>
                  <th className="px-5 py-4 w-28">Stage</th>
                  <th className="px-5 py-4 w-72 text-right">Refund Action / Configuration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredReturns.map(req => {
                  const isActionLoading = actionLoadingOrderId === req.orderId
                  const activeMethod = refundMethods[req.orderId] || "original_payment_method"

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
                      <td className="px-5 py-4 text-right font-bold text-primary">${parseFloat(req.totalAmount).toFixed(2)}</td>
                      <td className="px-5 py-4">
                        <div className="max-w-xs space-y-1">
                          <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-[9px]">
                            {req.reason}
                          </span>
                          <p className="text-muted-foreground line-clamp-1">{req.description || "No description."}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">{getStatusBadge(req.status)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex flex-col sm:flex-row justify-end items-center gap-3">
                          {req.status === "item_received" ? (
                            <>
                              {/* Refund Method Selectors */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleMethodChange(req.orderId, "original_payment_method")}
                                  className={`h-7 px-2.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer border flex items-center gap-1.5 transition-all ${
                                    activeMethod === "original_payment_method"
                                      ? "bg-primary/5 text-primary border-primary"
                                      : "bg-background text-muted-foreground border-border hover:bg-muted/10 hover:text-foreground"
                                  }`}
                                >
                                  <CreditCard className="size-3" /> Original Card
                                </button>
                                <button
                                  onClick={() => handleMethodChange(req.orderId, "store_credit")}
                                  className={`h-7 px-2.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer border flex items-center gap-1.5 transition-all ${
                                    activeMethod === "store_credit"
                                      ? "bg-primary/5 text-primary border-primary"
                                      : "bg-background text-muted-foreground border-border hover:bg-muted/10 hover:text-foreground"
                                  }`}
                                >
                                  <Percent className="size-3" /> Store Credit
                                </button>
                              </div>

                              <Button
                                size="xs"
                                className="rounded-lg h-7 font-bold bg-emerald-600 hover:bg-emerald-700 shrink-0"
                                onClick={() => handleProcessRefund(req.orderId)}
                                disabled={isActionLoading}
                              >
                                <CheckCircle2 className="size-3.5 mr-1" /> Approve Refund
                              </Button>
                            </>
                          ) : req.status === "refunded" ? (
                            <div className="text-right">
                              <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 justify-end">
                                <CheckCircle2 className="size-3.5" /> Refund Completed
                              </span>
                              <span className="text-[9px] text-muted-foreground italic font-semibold mt-0.5 block">
                                Method: {req.refundMethod === "original_payment_method" ? "Original Payment Card" : "Store Credit"}
                              </span>
                            </div>
                          ) : req.status === "rejected" ? (
                            <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1 justify-end">
                              <XCircle className="size-3.5" /> Request Rejected
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-semibold italic">Waiting for Vendor inspect status</span>
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
    </div>
  )
}

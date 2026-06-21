"use client"

import React, { useState } from "react"
import {
  Boxes,
  Calendar,
  Clock,
  CreditCard,
  Eye,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowRight,
  ShieldCheck,
  User,
  ShoppingBag,
  Store
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"

type AdminOrdersClientProps = {
  initialOrders: any[]
  vendors: { id: string; name: string; email: string }[]
}

export function AdminOrdersClient({ initialOrders, vendors }: AdminOrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "shipped" | "delivered" | "cancelled">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all")

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // Tab Filter
    const isOutForDelivery = order.status === "shipped" && order.trackingNumber?.startsWith("[Out for Delivery]")
    
    if (activeTab === "pending" && order.status !== "placed" && order.status !== "confirmed") return false
    if (activeTab === "shipped" && order.status !== "shipped") return false
    if (activeTab === "delivered" && order.status !== "delivered") return false
    if (activeTab === "cancelled" && order.status !== "cancelled") return false

    // Vendor-wise filter
    if (selectedVendorId !== "all") {
      const hasVendor = order.items.some((item: any) => item.vendorId === selectedVendorId)
      if (!hasVendor) return false
    }

    // Search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      const matchesId = order.id.toLowerCase().includes(query)
      const matchesCustomer = order.shippingName.toLowerCase().includes(query) || order.customer?.name?.toLowerCase().includes(query)
      const matchesVendorName = order.items.some((item: any) => item.vendorId.toLowerCase().includes(query))
      return matchesId || matchesCustomer || matchesVendorName
    }

    return true
  })

  // Calculations for stats
  const totalCount = orders.length
  const pendingCount = orders.filter(o => o.status === "placed" || o.status === "confirmed").length
  const shippedCount = orders.filter(o => o.status === "shipped").length
  const deliveredCount = orders.filter(o => o.status === "delivered").length

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Marketplace Orders", value: totalCount, icon: Boxes, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
          { label: "Pending Approvals", value: pendingCount, icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" },
          { label: "Shipped & In Transit", value: shippedCount, icon: Truck, color: "text-blue-600 bg-blue-50 border-blue-100" },
          { label: "Completed Deliveries", value: deliveredCount, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" }
        ].map((stat, i) => (
          <Card key={i} className="border border-border/80 shadow-sm rounded-3xl overflow-hidden bg-card">
            <CardContent className="p-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-extrabold tracking-tight text-foreground">{stat.value}</p>
              </div>
              <div className={`size-12 rounded-2xl flex items-center justify-center border ${stat.color}`}>
                <stat.icon className="size-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-muted/50 p-1 rounded-2xl border border-border self-start">
          {(["all", "pending", "shipped", "delivered", "cancelled"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all capitalize ${
                activeTab === tab
                  ? "bg-background text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "shipped" ? "Shipped / In Transit" : tab}
            </button>
          ))}
        </div>

        {/* Search & Vendor Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Vendor Filter */}
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="w-full h-10 pl-10 pr-8 rounded-2xl border border-border bg-muted/20 text-xs font-semibold text-foreground outline-none focus:border-primary transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, customer, vendor..."
              className="pl-10 h-10 rounded-2xl border-border bg-muted/20 focus-visible:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border border-border/85 rounded-3xl overflow-hidden shadow-sm bg-card">
        {filteredOrders.length === 0 ? (
          <CardContent className="py-16 text-center space-y-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mx-auto">
              <ShoppingBag className="size-6" />
            </span>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground">No Marketplace Orders Found</h3>
              <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
                No orders match your filter criteria.
              </p>
            </div>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Seller/Vendor</th>
                  <th className="px-6 py-4">Placed Date</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredOrders.map((order) => {
                  const isOutForDelivery = order.status === "shipped" && order.trackingNumber?.startsWith("[Out for Delivery]")
                  // Retrieve vendor names
                  const vendorNames = Array.from(new Set(order.items.map((i: any) => i.vendorId)))
                  
                  return (
                    <tr key={order.id} className="transition-colors hover:bg-muted/30">
                      
                      {/* Order ID */}
                      <td className="px-6 py-4">
                        <p className="font-mono font-bold text-foreground">{order.id}</p>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                          Items Count: {order.items.length}
                        </span>
                      </td>

                      {/* Customer Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="size-3.5 text-muted-foreground shrink-0" />
                          <p className="font-semibold text-foreground">{order.shippingName}</p>
                        </div>
                        <p className="text-xs text-muted-foreground pl-5">{order.shippingPhone}</p>
                      </td>

                      {/* Vendor details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Store className="size-3.5 text-primary shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {vendorNames.map((vId: any, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5 font-bold border-border">
                                {vendors.find(v => v.id === vId)?.name || "Vendor"}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Placed Date */}
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-slate-400" />
                          <span>{new Date(order.placedAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-6 py-4">
                        <Badge
                          className={`font-bold text-[10px] uppercase rounded-full border-none px-2 py-0.5 ${
                            order.paymentStatus === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : order.paymentStatus === "failed"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {order.paymentStatus}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <Badge
                          className={`font-bold text-[10px] uppercase rounded-full border-none px-2.5 py-0.5 ${
                            order.status === "delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : order.status === "cancelled"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isOutForDelivery ? "OUT FOR DELIVERY" : order.status}
                        </Badge>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 font-bold text-foreground">
                        ${parseFloat(order.totalAmount).toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                          render={<Link href={`/payment/success?orderId=${order.id}`} />}
                          aria-label={`View detail for order ${order.id}`}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

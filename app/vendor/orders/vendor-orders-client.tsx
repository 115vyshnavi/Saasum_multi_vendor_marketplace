"use client"

import React, { useState } from "react"
import {
  Boxes,
  CircleDollarSign,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  X,
  Search,
  ChevronDown,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { updateVendorOrderStatus } from "@/app/actions/order-management"
import { useRouter } from "next/navigation"

type VendorOrdersClientProps = {
  initialOrders: any[]
  initialStats: {
    pending: number
    shipped: number
    outForDelivery: number
    delivered: number
    revenue: number
  }
}

export function VendorOrdersClient({ initialOrders, initialStats }: VendorOrdersClientProps) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [stats, setStats] = useState(initialStats)
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "shipped" | "delivered" | "cancelled">("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Edit status modal state
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")
  const [trackingNumber, setTrackingNumber] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleOpenEdit = (order: any) => {
    setEditingOrder(order)
    setNewStatus(order.status === "shipped" && order.trackingNumber?.startsWith("[Out for Delivery]") ? "out_for_delivery" : order.status)
    setTrackingNumber(order.trackingNumber ? order.trackingNumber.replace("[Out for Delivery]", "").trim() : "")
    setError(null)
    setSuccessMsg(null)
  }

  const handleSaveStatus = async () => {
    if (!editingOrder) return
    setSaving(true)
    setError(null)
    try {
      const res = await updateVendorOrderStatus(
        editingOrder.id,
        newStatus as any,
        trackingNumber
      )

      if (res.success) {
        setSuccessMsg("Order status updated successfully!")
        router.refresh()
        
        // Update local state instantly
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id === editingOrder.id) {
              let updatedStatus = newStatus
              let finalTracking = trackingNumber
              if (newStatus === "out_for_delivery") {
                updatedStatus = "shipped"
                finalTracking = `[Out for Delivery] ${trackingNumber}`.trim()
              }
              return {
                ...o,
                status: updatedStatus,
                trackingNumber: finalTracking || null,
                updatedAt: new Date()
              }
            }
            return o
          })
        )

        // Close after a brief delay
        setTimeout(() => {
          setEditingOrder(null)
        }, 1000)
      } else {
        setError(res.error || "Failed to update status")
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  // Filter orders based on Tab and Search
  const filteredOrders = orders.filter((order) => {
    // Tab Filter
    const isOutForDelivery = order.status === "shipped" && order.trackingNumber?.startsWith("[Out for Delivery]")
    
    if (activeTab === "pending" && order.status !== "placed" && order.status !== "confirmed") return false
    if (activeTab === "shipped" && order.status !== "shipped") return false
    if (activeTab === "delivered" && order.status !== "delivered") return false
    if (activeTab === "cancelled" && order.status !== "cancelled") return false

    // Search query filter (Order ID or customer name/phone)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      const matchesId = order.id.toLowerCase().includes(query)
      const matchesCustomer = order.shippingName.toLowerCase().includes(query) || order.shippingPhone.includes(query)
      const matchesItem = order.items.some((item: any) => item.productName.toLowerCase().includes(query))
      return matchesId || matchesCustomer || matchesItem
    }

    return true
  })

  // Format stats for cards
  const statsConfig = [
    { label: "Pending Orders", value: stats.pending, icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" },
    { label: "Shipped & Out for Delivery", value: stats.shipped + stats.outForDelivery, icon: Truck, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { label: "Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: CircleDollarSign, color: "text-indigo-600 bg-indigo-50 border-indigo-100" }
  ]

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="border border-border/80 shadow-sm rounded-3xl overflow-hidden bg-card">
              <CardContent className="p-6 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-extrabold tracking-tight text-foreground">{stat.value}</p>
                </div>
                <div className={`size-12 rounded-2xl flex items-center justify-center border ${stat.color}`}>
                  <Icon className="size-6" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-muted/50 p-1 rounded-2xl border border-border">
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

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order ID, customer, item..."
            className="pl-10 h-10 rounded-2xl border-border bg-muted/20 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* Orders List / Grid */}
      {filteredOrders.length === 0 ? (
        <Card className="border border-border/80 rounded-3xl overflow-hidden shadow-sm bg-card text-center py-16">
          <CardContent className="space-y-4">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Boxes className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-foreground">No Orders Found</p>
              <p className="text-sm text-muted-foreground">There are no orders that match your criteria right now.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isOutForDelivery = order.status === "shipped" && order.trackingNumber?.startsWith("[Out for Delivery]")
            return (
              <Card key={order.id} className="border border-border/80 rounded-3xl overflow-hidden shadow-sm bg-card hover:shadow-md transition-all">
                <CardContent className="p-6 space-y-4">
                  {/* Row 1: Order Details Summary */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border/60">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-base text-foreground">{order.id}</span>
                        <Badge className={`font-bold text-[10px] uppercase rounded-full border-none px-2.5 py-0.5 ${
                          order.status === "delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "cancelled"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {isOutForDelivery ? "OUT FOR DELIVERY" : order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Placed on {new Date(order.placedAt).toLocaleDateString()} at {new Date(order.placedAt).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Vendor Subtotal</p>
                        <p className="font-extrabold text-foreground">${parseFloat(order.vendorSubtotal).toFixed(2)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(order)}
                        className="h-9 gap-1.5 border-border rounded-xl"
                      >
                        <Edit2 className="size-3.5" />
                        Manage Status
                      </Button>
                    </div>
                  </div>

                  {/* Row 2: Customer & Shipping */}
                  <div className="grid md:grid-cols-3 gap-6 text-sm">
                    {/* Customer */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Customer Details</p>
                      <p className="font-semibold text-foreground">{order.shippingName}</p>
                      <p className="text-xs text-muted-foreground">{order.shippingPhone}</p>
                    </div>

                    {/* Delivery Address */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Delivery Address</p>
                      <p className="text-xs text-foreground truncate max-w-xs">{order.shippingAddress}</p>
                      <p className="text-xs text-muted-foreground">{order.shippingCity}, {order.shippingState} - {order.shippingPincode}</p>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Products ({order.items.length})</p>
                      <div className="space-y-1">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-foreground truncate max-w-[180px]" title={item.productName}>
                              {item.productName} <span className="text-muted-foreground">×{item.quantity}</span>
                            </span>
                            <span className="font-medium text-foreground ml-2">${parseFloat(item.totalPrice).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Tracking & Updated status details */}
                  {order.trackingNumber && (
                    <div className="bg-muted/30 p-2.5 rounded-xl border border-border/50 text-xs flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Truck className="size-4 text-primary shrink-0" />
                        <span className="font-medium text-muted-foreground">Tracking ID:</span>
                        <span className="font-mono text-foreground font-semibold">
                          {order.trackingNumber.replace("[Out for Delivery]", "").trim()}
                        </span>
                      </div>
                      {isOutForDelivery && (
                        <Badge className="bg-blue-100 text-blue-800 text-[9px] font-bold border-none uppercase rounded-full">
                          Out For Delivery
                        </Badge>
                      )}
                    </div>
                  )}

                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Manage Status Modal (Dialog Overlay) */}
      {editingOrder && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="border-b border-border p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-foreground">Update Order Status</h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">ID: {editingOrder.id}</p>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="size-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
                  <AlertCircle className="size-4 shrink-0 text-rose-600" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  <p className="font-medium">{successMsg}</p>
                </div>
              )}

              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                <div className="relative">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full h-10 px-3 pr-10 rounded-xl border border-border bg-muted/20 text-sm text-foreground outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="placed">Placed (Received)</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped (In Transit)</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="returned">Returned</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Tracking Number Input */}
              {(newStatus === "shipped" || newStatus === "out_for_delivery") && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tracking / Reference Number</label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter carrier tracking ID (optional)"
                    className="h-10 rounded-xl border-border bg-muted/20 focus-visible:ring-primary/20"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {newStatus === "out_for_delivery" 
                      ? "This will prefix '[Out for Delivery]' automatically on the buyer timeline."
                      : "Provide a tracking reference for customer notifications."
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border p-5 bg-muted/20 flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingOrder(null)}
                disabled={saving}
                className="h-9 rounded-xl border-border"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveStatus}
                disabled={saving}
                className="h-9 rounded-xl shadow-md"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

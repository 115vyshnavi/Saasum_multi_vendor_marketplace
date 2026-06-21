"use client"

import { useState } from "react"
import { Calendar, Clock, CreditCard, Eye, Package, ShoppingBag, Truck, CheckCircle2, XCircle, AlertTriangle, FileText, RotateCcw, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { cancelBuyerOrder } from "@/app/actions/order-management"
import { useRouter } from "next/navigation"

type BuyerOrdersClientProps = {
  initialOrders: any[]
  initialShipments: any[]
}

const STEPS = [
  { label: "Placed", desc: "Order submitted" },
  { label: "Confirmed", desc: "Payment verified" },
  { label: "Shipped", desc: "In transit" },
  { label: "Out for Delivery", desc: "Courier assigned" },
  { label: "Delivered", desc: "Package received" }
]

const RETURN_STEPS = [
  { label: "Requested", desc: "Return request submitted" },
  { label: "Approved", desc: "Approved by vendor" },
  { label: "Pickup Scheduled", desc: "Courier package dispatch" },
  { label: "Item Received", desc: "Received and inspected" },
  { label: "Refunded", desc: "Refund successfully credited" }
]

export function BuyerOrdersClient({ initialOrders, initialShipments }: BuyerOrdersClientProps) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [shipments] = useState(initialShipments)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleCancelClick = (orderId: string) => {
    setConfirmCancelId(orderId)
    setMessage(null)
  }

  const handleConfirmCancel = async (orderId: string) => {
    setCancellingId(orderId)
    setConfirmCancelId(null)
    try {
      const res = await cancelBuyerOrder(orderId)
      if (res.success) {
        setMessage({ type: "success", text: `Order ${orderId} was successfully cancelled.` })
        router.refresh()
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled", paymentStatus: o.paymentStatus === "paid" ? "refunded" : o.paymentStatus } : o))
      } else {
        setMessage({ type: "error", text: res.error || "Failed to cancel order" })
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to cancel order" })
    } finally {
      setCancellingId(null)
    }
  }

  const getStepStatus = (orderStatus: string, trackingNumber: string | null) => {
    const isOutForDelivery = orderStatus === "shipped" && trackingNumber?.startsWith("[Out for Delivery]")
    if (orderStatus === "cancelled") return { currentStep: -1, isCancelled: true }
    if (orderStatus === "returned") return { currentStep: -1, isReturned: true }

    let currentStep = 0
    if (orderStatus === "placed") currentStep = 0
    else if (orderStatus === "confirmed") currentStep = 1
    else if (orderStatus === "shipped") currentStep = isOutForDelivery ? 3 : 2
    else if (orderStatus === "delivered") currentStep = 4

    return { currentStep, isCancelled: false, isReturned: false }
  }

  const getShipmentForOrder = (orderId: string) => {
    return shipments.find((s: any) => s.orderId === orderId)
  }

  return (
    <div className="space-y-8">
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          message.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="size-5 shrink-0" /> : <AlertTriangle className="size-5 shrink-0" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <Card className="border border-border rounded-3xl overflow-hidden shadow-sm bg-card">
          <CardContent className="py-16 text-center space-y-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mx-auto">
              <ShoppingBag className="size-6" />
            </span>
            <div className="space-y-1.5">
              <h3 className="font-bold text-base text-foreground">No Orders Found</h3>
              <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">You haven't placed any orders yet.</p>
            </div>
            <Button size="sm" render={<Link href="/shop" />}>
              Start Shopping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const { currentStep, isCancelled, isReturned } = getStepStatus(order.status, order.trackingNumber)
            const isCancellable = order.status === "placed" || order.status === "confirmed"
            const shipment = getShipmentForOrder(order.id)
            const hasShipment = !!shipment && !isCancelled && !isReturned

            return (
              <Card key={order.id} className="border border-border rounded-3xl overflow-hidden shadow-sm bg-card transition-all hover:shadow-md">
                <div className="bg-muted/40 border-b border-border px-6 py-4.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Order ID</span>
                      <span className="font-mono font-bold text-foreground">{order.id}</span>
                      <Badge className="bg-primary/10 text-primary border-none text-[10px] uppercase font-bold py-0 px-2 rounded-full">
                        {order.vendorName}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {new Date(order.placedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="size-3.5" />
                        {order.paymentMethod || "COD"} ({order.paymentStatus})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Amount</p>
                      <p className="text-lg font-extrabold text-foreground">${parseFloat(order.totalAmount).toFixed(2)}</p>
                    </div>
                    <div>
                      <Badge className={`font-bold px-3 py-1 rounded-full text-xs border-none ${
                        order.status === "delivered" 
                          ? "bg-emerald-100 text-emerald-800" 
                          : order.status === "cancelled" 
                          ? "bg-rose-100 text-rose-800"
                          : order.status === "returned" 
                          ? "bg-purple-100 text-purple-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {order.status === "shipped" && order.trackingNumber?.startsWith("[Out for Delivery]") 
                          ? "OUT FOR DELIVERY" 
                          : order.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Package Items</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-muted/20">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-secondary border border-border">
                            <Image src={item.productImage || "/placeholder.svg"} alt={item.productName} fill sizes="48px" className="object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-foreground truncate">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ${parseFloat(item.unitPrice).toFixed(2)}</p>
                          </div>
                          <p className="font-bold text-sm text-foreground ml-2">${parseFloat(item.totalPrice).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/60">
                    {order.returnRequest ? (
                      <>
                        <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-6 flex items-center gap-1.5">
                          <RotateCcw className="size-3.5" /> Return tracking timeline
                        </h4>
                        {order.returnRequest.status === "rejected" ? (
                          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-150 rounded-2xl text-rose-800 text-sm">
                            <XCircle className="size-5 text-rose-600 shrink-0" />
                            <div>
                              <p className="font-bold">Return Request Rejected</p>
                              <p className="text-xs text-rose-700">Reason: {order.returnRequest.rejectionReason || "Not specified"}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-border -z-10 hidden md:block" />
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-2">
                              {RETURN_STEPS.map((step, idx) => {
                                const getReturnStepIndex = (status: string) => {
                                  switch (status) {
                                    case "requested": return 0
                                    case "approved": return 1
                                    case "pickup_scheduled": return 2
                                    case "item_received": return 3
                                    case "refunded": return 4
                                    default: return 0
                                  }
                                }
                                const currentReturnStep = getReturnStepIndex(order.returnRequest.status)
                                const isCompleted = idx <= currentReturnStep
                                const isActive = idx === currentReturnStep
                                return (
                                  <div key={idx} className="flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center relative">
                                    <div className={`size-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                                      isCompleted ? "bg-purple-650 border-purple-650 text-white shadow-sm shadow-purple-700 scale-110" : "bg-background border-border text-muted-foreground"
                                    }`}>
                                      {isCompleted ? <CheckCircle2 className="size-5" /> : idx + 1}
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className={`font-semibold text-sm ${isActive ? "text-purple-700" : "text-foreground"}`}>{step.label}</p>
                                      <p className="text-[11px] text-muted-foreground">{step.desc}</p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">Delivery Timeline</h4>
                        {isCancelled ? (
                          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-150 rounded-2xl text-rose-800 text-sm">
                            <XCircle className="size-5 text-rose-600 shrink-0" />
                            <div>
                              <p className="font-bold">Order Cancelled</p>
                              <p className="text-xs text-rose-700">This order was cancelled on {new Date(order.cancelledAt || order.updatedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ) : isReturned ? (
                          <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-150 rounded-2xl text-purple-800 text-sm">
                            <Clock className="size-5 text-purple-600 shrink-0" />
                            <div>
                              <p className="font-bold">Item Returned</p>
                              <p className="text-xs text-purple-700">A return request was processed for this order.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-border -z-10 hidden md:block" />
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-2">
                              {STEPS.map((step, idx) => {
                                const isCompleted = idx <= currentStep
                                const isActive = idx === currentStep
                                return (
                                  <div key={idx} className="flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center relative">
                                    <div className={`size-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                                      isCompleted ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20 scale-110" : "bg-background border-border text-muted-foreground"
                                    }`}>
                                      {isCompleted ? <CheckCircle2 className="size-5" /> : idx + 1}
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className={`font-semibold text-sm ${isActive ? "text-primary" : "text-foreground"}`}>{step.label}</p>
                                      <p className="text-[11px] text-muted-foreground">{step.desc}</p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {hasShipment ? (
                    <div className="pt-4 border-t border-border/60">
                      <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-xl border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <Truck className="size-3.5 text-primary" />
                          <span className="font-semibold uppercase text-[10px] tracking-wider text-primary">{shipment.courierPartner}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-foreground text-xs">{shipment.trackingNumber}</span>
                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => navigator.clipboard.writeText(shipment.trackingNumber)}>
                            <Copy className="size-3" />
                          </Button>
                        </div>
                        {shipment.estimatedDelivery && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                            <Calendar className="size-3" />
                            ETA: {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : order.trackingNumber && !isCancelled && !isReturned ? (
                    <div className="pt-4 border-t border-border/60">
                      <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-xl border border-border">
                        <span className="font-semibold block uppercase text-[10px] tracking-wider">Tracking Reference</span>
                        <span className="font-mono text-foreground text-xs">{order.trackingNumber}</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3 ml-auto flex-wrap justify-end">
                    {(() => {
                      const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : null
                      const isEligibleForReturn = order.status === "delivered" && deliveredDate && (new Date().getTime() - deliveredDate.getTime()) <= 7 * 24 * 60 * 60 * 1000 && !order.returnRequest
                      return isEligibleForReturn && (
                        <Button size="sm" className="h-8.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5" render={<Link href={`/orders/returns/${order.id}`} />}>
                          <RotateCcw className="size-4" /> Return Order
                        </Button>
                      )
                    })()}

                    {isCancellable && (
                      <>
                        {confirmCancelId === order.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-rose-600 animate-pulse">Are you sure?</span>
                            <Button size="sm" variant="destructive" disabled={cancellingId === order.id} onClick={() => handleConfirmCancel(order.id)}>Yes, Cancel</Button>
                            <Button size="sm" variant="outline" onClick={() => setConfirmCancelId(null)}>No</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="destructive" disabled={cancellingId === order.id} onClick={() => handleCancelClick(order.id)}>Cancel Order</Button>
                        )}
                      </>
                    )}

                    {["confirmed", "shipped", "delivered", "returned"].includes(order.status) && (
                      <Button size="sm" variant="outline" className="h-8.5 rounded-xl gap-1.5" render={<Link href={`/orders/invoice/${order.id}`} />}>
                        <FileText className="size-4" /> Download Invoice
                      </Button>
                    )}
                    
                    <Button size="sm" variant="outline" render={<Link href={order.paymentStatus === "paid" || order.status === "returned" ? `/payment/success?orderId=${order.id}` : `/payment/failure?orderId=${order.id}&error=Payment failure`} />}>
                      <Eye className="size-4" /> Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
import Link from "next/link"
import { CheckCircle2, ShoppingBag, History, Truck, ArrowRight, Clock } from "lucide-react"
import { getOrderDetails } from "@/app/actions/order"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { headers } from "next/headers"
import { eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"

type SuccessPageProps = {
  searchParams: Promise<{ orderId?: string; cod?: string }>
}

const STEPS = [
  { label: "Placed" },
  { label: "Confirmed" },
  { label: "Shipped" },
  { label: "Out for Delivery" },
  { label: "Delivered" }
]

export default async function PaymentSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams
  const orderId = params.orderId
  const isCod = params.cod === "true"

  if (!orderId) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteNavbar />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Invalid Request</h2>
            <p className="text-muted-foreground">No order identifier was provided.</p>
            <Button render={<Link href="/shop" />}>Return to Shop</Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // 1. Authentication Check & Session Retrieval
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect(`/login?callbackURL=/payment/success?orderId=${encodeURIComponent(orderId)}`)
  }

  const orderIds = orderId.split(",")
  const allDetails = await Promise.all(orderIds.map((id) => getOrderDetails(id)))
  const validDetails = allDetails.filter((d): d is NonNullable<typeof d> => d !== null)

  if (validDetails.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteNavbar />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Order Not Found</h2>
            <p className="text-muted-foreground">We couldn&apos;t find any records for Order {orderId}.</p>
            <Button render={<Link href="/shop" />}>Return to Shop</Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // 2. Strict Ownership Verification (Only owner or admin allowed)
  const userRecord = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1)
  const userRole = userRecord[0]?.role || "buyer"
  
  for (const details of validDetails) {
    if (details.order.userId !== session.user.id && userRole !== "admin") {
      notFound()
    }
  }

  // Calculate overall totals
  const totalAmount = validDetails.reduce((sum, d) => sum + (typeof d.order.totalAmount === 'number' ? d.order.totalAmount : parseFloat(String(d.order.totalAmount))), 0)
  const paymentMethod = validDetails[0]?.order.paymentMethod || "COD"
  const paymentStatus = validDetails[0]?.order.paymentStatus || "pending"
  const paymentId = validDetails[0]?.order.paymentId || null

  const getStepStatus = (orderStatus: string, trackingNumber: string | null) => {
    const isOutForDelivery = orderStatus === "shipped" && trackingNumber?.startsWith("[Out for Delivery]");
    
    if (orderStatus === "cancelled") return { currentStep: -1, isCancelled: true };
    if (orderStatus === "returned") return { currentStep: -1, isReturned: true };

    let currentStep = 0; 
    if (orderStatus === "placed") {
      currentStep = 0;
    } else if (orderStatus === "confirmed") {
      currentStep = 1;
    } else if (orderStatus === "shipped") {
      if (isOutForDelivery) {
        currentStep = 3;
      } else {
        currentStep = 2;
      }
    } else if (orderStatus === "delivered") {
      currentStep = 4;
    }

    return { currentStep, isCancelled: false, isReturned: false };
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="space-y-8">
          
          {/* Success Banner */}
          <div className="text-center space-y-3">
            <div className="inline-flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
              <CheckCircle2 className="size-10" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {isCod ? "Order Placed Successfully!" : "Payment Successful!"}
            </h1>
            <p className="text-muted-foreground text-pretty max-w-md mx-auto text-sm sm:text-base">
              {isCod
                ? "Your order has been received. Pay with cash upon delivery."
                : "Thank you for your purchase! We have confirmed your payment and started preparing your items."}
            </p>
          </div>

          {/* Checkout Payment Info Summary Card */}
          <Card className="border border-border/80 rounded-3xl overflow-hidden shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Payment Method</span>
                  <span className="font-bold text-foreground mt-0.5 block">{paymentMethod}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Payment Status</span>
                  <span className={`inline-flex items-center gap-1 mt-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    paymentStatus === "paid" 
                      ? "bg-emerald-100 text-emerald-800" 
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {paymentStatus.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Total Paid Amount</span>
                  <span className="font-extrabold text-primary text-base mt-0.5 block">${totalAmount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Total Packages</span>
                  <span className="font-bold text-foreground mt-0.5 block">{validDetails.length} Packages</span>
                </div>
                {paymentId && (
                  <div className="col-span-2 md:col-span-4 border-t border-border/60 pt-4">
                    <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Transaction ID</span>
                    <span className="font-mono text-xs text-foreground bg-muted px-2.5 py-1.5 rounded-xl border border-border inline-block mt-1">
                      {paymentId}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Split Package Cards */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <Truck className="size-5 text-primary" />
              Delivery Details by Package
            </h3>

            {validDetails.map((details, index) => {
              const { order, items } = details
              const { currentStep, isCancelled, isReturned } = getStepStatus(order.status, order.trackingNumber)
              const deliveryDate = order.estimatedDelivery
                ? new Date(order.estimatedDelivery).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })
                : new Date(Date.now() + (4 + index) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })

              return (
                <Card key={order.id} className="border border-border/80 rounded-3xl overflow-hidden shadow-sm bg-card hover:shadow-md transition-all">
                  <div className="bg-muted/40 px-6 py-4.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border/60">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Package {index + 1} ID</span>
                      <p className="font-mono font-bold text-sm text-foreground">{order.id}</p>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Estimated Delivery</span>
                      <p className="font-bold text-sm text-foreground flex items-center gap-1.5 justify-end">
                        <Truck className="size-4 shrink-0 text-primary" />
                        {deliveryDate}
                      </p>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-6">
                    {/* Items List */}
                    <div className="space-y-3">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Items in Package</span>
                      <ul className="divide-y divide-border/60">
                        {items.map((item) => (
                          <li key={item.id} className="flex py-3.5 justify-between items-center text-sm">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-secondary border border-border">
                                <Image
                                  src={item.productImage || "/placeholder.svg"}
                                  alt={item.productName}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate max-w-sm sm:max-w-md">{item.productName}</p>
                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <p className="font-bold text-foreground ml-3">${Number(item.totalPrice).toFixed(2)}</p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Timeline stepper */}
                    <div className="border-t border-border/60 pt-6">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-4">Package Status Timeline</span>
                      
                      {isCancelled ? (
                        <div className="bg-rose-50 border border-rose-150 p-3.5 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                          <Clock className="size-4 text-rose-600" />
                          <span>Package was cancelled.</span>
                        </div>
                      ) : isReturned ? (
                        <div className="bg-purple-50 border border-purple-150 p-3.5 rounded-2xl text-purple-800 text-xs font-semibold flex items-center gap-2">
                          <Clock className="size-4 text-purple-600" />
                          <span>Package was returned.</span>
                        </div>
                      ) : (
                        <div className="relative pt-2">
                          {/* Stepper bar */}
                          <div className="absolute top-3 left-[5%] right-[5%] h-0.5 bg-border -z-10 hidden sm:block" />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2">
                            {STEPS.map((step, idx) => {
                              const isCompleted = idx <= currentStep
                              const isActive = idx === currentStep

                              return (
                                <div key={idx} className="flex sm:flex-col items-center gap-3 sm:gap-1.5 text-left sm:text-center">
                                  <div className={`size-6 rounded-full flex items-center justify-center border text-[10px] font-bold transition-all ${
                                    isCompleted 
                                      ? "bg-primary border-primary text-primary-foreground scale-110" 
                                      : "bg-background border-border text-muted-foreground"
                                  }`}>
                                    {isCompleted ? "✓" : idx + 1}
                                  </div>
                                  <div>
                                    <p className={`font-semibold text-xs ${isActive ? "text-primary" : "text-foreground"}`}>
                                      {step.label}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Package status reference */}
                    <div className="border-t border-border/60 pt-4 flex justify-between items-center text-xs text-muted-foreground">
                      <span>Package Total:</span>
                      <span className="font-extrabold text-foreground">${(typeof order.totalAmount === 'number' ? order.totalAmount : parseFloat(String(order.totalAmount))).toFixed(2)}</span>
                    </div>

                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              className="flex-1 h-11 gap-2 shadow-sm border-border rounded-xl"
              variant="outline"
              render={<Link href="/orders" />}
            >
              <History className="size-4" />
              View Orders &amp; Timeline
            </Button>
            <Button
              className="flex-1 h-11 gap-2 shadow-lg shadow-primary/25 rounded-xl"
              render={<Link href="/shop" />}
            >
              <ShoppingBag className="size-4" />
              Continue Shopping
              <ArrowRight className="size-4" />
            </Button>
          </div>

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

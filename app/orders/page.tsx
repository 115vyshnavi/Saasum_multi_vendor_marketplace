import Link from "next/link"
import { History, ShieldAlert, ShoppingBag } from "lucide-react"
import { getBuyerOrders } from "@/app/actions/order-management"
import { getBuyerShipments } from "@/app/actions/logistics"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { BuyerOrdersClient } from "./buyer-orders-client"

export default async function BuyerOrdersPage() {
  const [ordersResult, shipmentsResult] = await Promise.all([
    getBuyerOrders(),
    getBuyerShipments(),
  ])

  // 1. Authentication Check (Sign-in Wall)
  if (!ordersResult.success || !ordersResult.orders) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteNavbar />
        <main className="flex-1 max-w-md mx-auto w-full px-4 py-20 flex flex-col justify-center">
          <Card className="border border-border rounded-3xl p-6 text-center space-y-5 shadow-sm">
            <span className="flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 mx-auto border border-amber-100">
              <ShieldAlert className="size-6" />
            </span>
            <div className="space-y-1.5">
              <CardTitle className="text-xl">Authentication Required</CardTitle>
              <CardDescription className="max-w-[280px] mx-auto">
                Please sign in to your SaaSum account to view your order history and tracking pipelines.
              </CardDescription>
            </div>
            <Button className="w-full h-11 shadow-md shadow-primary/10" render={<Link href="/login?callbackURL=/orders" />}>
              Sign In to Account
            </Button>
          </Card>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
        <div className="space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2 text-foreground">
                <History className="size-7 text-primary" />
                Your Orders &amp; Tracking
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Monitor delivery timelines, view split packages by vendor, or manage your order status.
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-9 gap-1.5" render={<Link href="/shop" />}>
              <ShoppingBag className="size-4" />
              Continue Shopping
            </Button>
          </div>

          {/* Orders Client List */}
          <BuyerOrdersClient 
            initialOrders={ordersResult.orders} 
            initialShipments={shipmentsResult.success ? shipmentsResult.shipments || [] : []} 
          />

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

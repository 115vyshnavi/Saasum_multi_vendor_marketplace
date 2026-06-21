import Link from "next/link"
import { ClipboardList, ShieldAlert, Store } from "lucide-react"
import { getVendorOrders } from "@/app/actions/order-management"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { VendorOrdersClient } from "./vendor-orders-client"

export default async function VendorOrdersPage() {
  const result = await getVendorOrders()

  // 1. Authentication Check (Sign-in Wall)
  if (!result.success || !result.orders) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteNavbar />
        <main className="flex-1 max-w-md mx-auto w-full px-4 py-20 flex flex-col justify-center">
          <Card className="border border-border rounded-3xl p-6 text-center space-y-5 shadow-sm">
            <span className="flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 mx-auto border border-amber-100">
              <ShieldAlert className="size-6" />
            </span>
            <div className="space-y-1.5">
              <CardTitle className="text-xl">Seller Portal Required</CardTitle>
              <CardDescription className="max-w-[280px] mx-auto">
                Please log in to your vendor/brand account to manage assigned orders and view sales summaries.
              </CardDescription>
            </div>
            <Button className="w-full h-11 shadow-md shadow-primary/10" render={<Link href="/login?callbackURL=/vendor/orders" />}>
              Sign In as Vendor
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
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Vendor Dashboard</p>
              <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl flex items-center gap-2 text-foreground">
                <Store className="size-7 text-primary" />
                Manage Assigned Orders
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                View your product sales, manage package shipping statuses, and track revenue summaries.
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-9 gap-1.5" render={<Link href="/vendor/products" />}>
              <ClipboardList className="size-4" />
              Manage Products Catalog
            </Button>
          </div>

          {/* Orders Component */}
          <VendorOrdersClient initialOrders={result.orders} initialStats={result.stats} />

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

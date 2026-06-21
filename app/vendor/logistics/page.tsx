import Link from "next/link"
import { Truck, ShieldAlert, ArrowLeft, Package, Clock, AlertTriangle, CheckCircle2 } from "lucide-react"
import { getVendorShipments } from "@/app/actions/logistics"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { VendorLogisticsClient } from "./vendor-logistics-client"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function VendorLogisticsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user || (session.user.role !== "vendor" && session.user.role !== "brand" && session.user.role !== "admin")) {
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
                Please log in to your vendor/brand account to manage shipments and tracking.
              </CardDescription>
            </div>
            <Button className="w-full h-11 shadow-md shadow-primary/10" render={<Link href="/login?callbackURL=/vendor/logistics" />}>
              Sign In as Vendor
            </Button>
          </Card>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const result = await getVendorShipments()

  if (!result.success) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteNavbar authenticated />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
          <div className="text-center py-20 border border-dashed rounded-3xl p-8 bg-card">
            <ShieldAlert className="size-10 mx-auto text-destructive" />
            <h2 className="text-lg font-bold mt-4">Failed to load shipments</h2>
            <p className="text-sm text-muted-foreground mt-2">{result.error || "An error occurred."}</p>
          </div>
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
                <Truck className="size-7 text-primary" />
                Logistics & Shipments
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track active shipments, manage courier assignments, and monitor delivery performance.
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-9 gap-1.5" render={<Link href="/vendor/orders" />}>
              <ArrowLeft className="size-4" />
              Manage Orders
            </Button>
          </div>

          {/* Client Dashboard */}
          <VendorLogisticsClient initialShipments={result.shipments || []} initialStats={result.stats || { active: 0, delayed: 0, delivered: 0 }} />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
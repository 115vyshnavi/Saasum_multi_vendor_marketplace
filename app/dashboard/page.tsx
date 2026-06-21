import Link from "next/link"
import { Plus, Settings, Store } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { Button } from "@/components/ui/button"
import { StatCards } from "@/components/dashboard/stat-cards"
import { SalesOverview } from "@/components/dashboard/sales-overview"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User"

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back, {userName}</h1>
            <p className="mt-1 text-muted-foreground">Here's what's happening with your store today.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-10 px-4 text-sm" render={<Link href="/profile" />}>
              <Settings className="size-4" /> Settings
            </Button>
            <Button className="h-10 px-4 text-sm">
              <Plus className="size-4" /> Add product
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <StatCards />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SalesOverview />
          </div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Top products</CardTitle>
              <CardDescription>Best sellers this month</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">No product data available yet.</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentOrders />
          </div>
          <Card className="h-full bg-primary text-primary-foreground">
            <CardContent className="flex h-full flex-col justify-between gap-6 py-2">
              <div>
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-foreground/15">
                  <Store className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">Grow your storefront</h3>
                <p className="mt-2 text-sm text-primary-foreground/80">
                  Upgrade to Saasum IQMart Pro for advanced analytics, lower fees, and priority support.
                </p>
              </div>
              <Button
                variant="secondary"
                className="h-10 w-full px-4 text-sm"
              >
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

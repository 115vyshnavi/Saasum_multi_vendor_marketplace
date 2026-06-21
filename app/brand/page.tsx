import Link from "next/link"
import { BadgeCheck, Crown, Package, Plus, Settings, Sparkles } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { Button } from "@/components/ui/button"
import { StatCards } from "@/components/dashboard/stat-cards"
import { SalesOverview } from "@/components/dashboard/sales-overview"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export default async function BrandDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User"

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Crown className="size-5" />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <BadgeCheck className="size-3.5" /> Verified brand
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Brand dashboard</h1>
            <p className="mt-1 text-muted-foreground">Welcome, {userName}. Track performance and grow your premium storefront.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-10 px-4 text-sm" render={<Link href="/profile" />}>
              <Settings className="size-4" /> Settings
            </Button>
            <Button className="h-10 px-4 text-sm" render={<Link href="/vendor/products/new" />}>
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
              <CardTitle>Active campaigns</CardTitle>
              <CardDescription>Brand promotions this month</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">No active campaigns yet.</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Link
            href="/vendor/products"
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="size-5" />
            </span>
            <span className="text-sm font-medium">Manage products</span>
          </Link>
          <Link
            href="/profile"
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Settings className="size-5" />
            </span>
            <span className="text-sm font-medium">Brand settings</span>
          </Link>
          <Link
            href="/shop"
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <span className="text-sm font-medium">Browse storefront</span>
          </Link>
        </div>
      </main>
    </div>
  )
}

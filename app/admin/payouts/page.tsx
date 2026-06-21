import Link from "next/link"
import { ShieldAlert, Users, ArrowLeft } from "lucide-react"
import { getAdminPayouts } from "@/app/actions/payouts"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { AdminPayoutsClient } from "./admin-payouts-client"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export default async function AdminPayoutsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteNavbar />
        <main className="flex-1 max-w-md mx-auto w-full px-4 py-20 flex flex-col justify-center">
          <Card className="border border-border rounded-3xl p-6 text-center space-y-5 shadow-sm">
            <span className="flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 mx-auto border border-amber-100">
              <ShieldAlert className="size-6" />
            </span>
            <div className="space-y-1.5">
              <CardTitle className="text-xl">Admin Portal Required</CardTitle>
              <CardDescription className="max-w-[280px] mx-auto">
                Please log in as an administrator to manage vendor payout settlements.
              </CardDescription>
            </div>
            <Button className="w-full h-11 shadow-md shadow-primary/10" render={<Link href="/login?callbackURL=/admin/payouts" />}>
              Sign In as Admin
            </Button>
          </Card>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // Check admin role
  const adminCheck = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1)

  if (adminCheck[0]?.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteNavbar authenticated />
        <main className="flex-1 max-w-md mx-auto w-full px-4 py-20 flex flex-col justify-center">
          <Card className="border border-border rounded-3xl p-6 text-center space-y-5 shadow-sm">
            <span className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500 mx-auto border border-red-100">
              <ShieldAlert className="size-6" />
            </span>
            <div className="space-y-1.5">
              <CardTitle className="text-xl">Access Denied</CardTitle>
              <CardDescription className="max-w-[280px] mx-auto">
                This page is restricted to platform administrators only.
              </CardDescription>
            </div>
            <Button className="w-full h-11" render={<Link href="/dashboard" />}>
              Go to Dashboard
            </Button>
          </Card>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const result = await getAdminPayouts()

  if (!result.success || !result.payouts) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteNavbar authenticated />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
          <div className="text-center py-20 border border-dashed rounded-3xl p-8 bg-card">
            <ShieldAlert className="size-10 mx-auto text-destructive" />
            <h2 className="text-lg font-bold mt-4">Failed to load payouts data</h2>
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
              <p className="text-sm font-medium text-primary">Admin Control Panel</p>
              <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl flex items-center gap-2 text-foreground">
                <Users className="size-7 text-primary" />
                Vendor Payout Settlements
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Review settlement requests, approve transfers, log bank UTR references, or reject transactions.
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-9 gap-1.5" render={<Link href="/dashboard" />}>
              <ArrowLeft className="size-4" />
              Admin Home
            </Button>
          </div>

          {/* Admin Payouts Manager Client */}
          <AdminPayoutsClient initialPayouts={result.payouts} />

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

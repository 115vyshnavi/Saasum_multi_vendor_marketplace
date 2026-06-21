import { CheckCircle2, Clock, Store, XCircle } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { Card, CardContent } from "@/components/ui/card"
import { VendorApprovalTable } from "@/components/admin/vendor-approval-table"
import { db } from "@/lib/db"
import { vendorProfiles } from "@/lib/db/schema"
import { count, sql } from "drizzle-orm"

export default async function AdminVendorsPage() {
  // Fetch real vendor counts from database
  const totalCount = await db.select({ count: count() }).from(vendorProfiles)
  const pendingCount = await db.select({ count: count() }).from(vendorProfiles).where(sql`${vendorProfiles.approvalStatus} = 'pending'`)
  const approvedCount = await db.select({ count: count() }).from(vendorProfiles).where(sql`${vendorProfiles.approvalStatus} = 'approved'`)
  const rejectedCount = await db.select({ count: count() }).from(vendorProfiles).where(sql`${vendorProfiles.approvalStatus} = 'rejected'`)

  const stats = [
    { label: "Pending review", value: String(pendingCount[0]?.count || 0), icon: Clock, tone: "bg-accent/25 text-accent-foreground" },
    { label: "Approved", value: String(approvedCount[0]?.count || 0), icon: CheckCircle2, tone: "bg-primary/12 text-primary" },
    { label: "Rejected", value: String(rejectedCount[0]?.count || 0), icon: XCircle, tone: "bg-destructive/12 text-destructive" },
    { label: "Total vendors", value: String(totalCount[0]?.count || 0), icon: Store, tone: "bg-muted text-muted-foreground" },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-primary">Admin</p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">Vendor approvals</h1>
            <p className="mt-1 text-muted-foreground">
              Review seller applications and manage marketplace access.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center justify-between gap-3 py-1">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">{s.value}</p>
                </div>
                <span className={`flex size-10 items-center justify-center rounded-lg ${s.tone}`}>
                  <s.icon className="size-5" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <VendorApprovalTable />
        </div>
      </main>
    </div>
  )
}

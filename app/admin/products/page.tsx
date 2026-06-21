import { CheckCircle2, Clock, Package, XCircle } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { Card, CardContent } from "@/components/ui/card"
import { ApprovalDashboard } from "@/components/products/approval-dashboard"
import { getPendingProducts, getActiveProducts } from "@/lib/products"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export default async function AdminProductsPage() {
  const [pendingProducts, activeProducts] = await Promise.all([
    getPendingProducts(),
    getActiveProducts(),
  ])

  // Count products by status from database
  const allProducts = await db.select().from(products)
  const rejectedCount = allProducts.filter(p => p.status === 'rejected').length
  const approvedCount = activeProducts.length
  const totalCount = allProducts.length

  const stats = [
    { label: "Pending review", value: pendingProducts.length.toString(), icon: Clock, tone: "bg-accent/25 text-accent-foreground" },
    { label: "Approved (30d)", value: approvedCount.toString(), icon: CheckCircle2, tone: "bg-primary/12 text-primary" },
    { label: "Rejected (30d)", value: rejectedCount.toString(), icon: XCircle, tone: "bg-destructive/12 text-destructive" },
    { label: "Total products", value: totalCount.toString(), icon: Package, tone: "bg-muted text-muted-foreground" },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium text-primary">Admin</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">Product approvals</h1>
          <p className="mt-1 text-muted-foreground">
            Review new listings before they go live on the marketplace.
          </p>
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
          <ApprovalDashboard initialProducts={pendingProducts} />
        </div>
      </main>
    </div>
  )
}

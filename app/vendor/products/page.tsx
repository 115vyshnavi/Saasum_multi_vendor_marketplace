import Link from "next/link"
import { Boxes, CircleDollarSign, Clock, Plus, TriangleAlert } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { VendorProductsView } from "@/components/products/vendor-products-view"
import { getVendorProducts } from "@/lib/products"
import { getCurrentUser } from "@/lib/auth-helpers"

export default async function VendorProductsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/30">
        <SiteNavbar authenticated />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <p>Not authenticated. Please log in.</p>
        </main>
      </div>
    )
  }

  const vendorProducts = await getVendorProducts(user.id)

  const stats = [
    { label: "Total products", value: vendorProducts.length.toString(), icon: Boxes, tone: "bg-primary/12 text-primary" },
    { label: "Active", value: vendorProducts.filter(p => p.status === "active").length.toString(), icon: CircleDollarSign, tone: "bg-primary/12 text-primary" },
    { label: "Pending review", value: vendorProducts.filter(p => p.status === "pending").length.toString(), icon: Clock, tone: "bg-accent/25 text-accent-foreground" },
    { label: "Drafts", value: vendorProducts.filter(p => p.status === "draft").length.toString(), icon: TriangleAlert, tone: "bg-destructive/12 text-destructive" },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-primary">Catalog</p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">Your products</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your listings, inventory, and pricing in one place.
            </p>
          </div>
          <Button className="h-10 px-4 text-sm" render={<Link href="/vendor/products/new" />}>
            <Plus className="size-4" /> Add product
          </Button>
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
          <VendorProductsView products={vendorProducts} />
        </div>
      </main>
    </div>
  )
}

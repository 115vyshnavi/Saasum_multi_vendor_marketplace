import Link from "next/link"
import { notFound } from "next/navigation"
import { ShieldCheck, ShieldAlert, FileText, Search, ArrowLeft, Eye, Download } from "lucide-react"
import { getAdminInvoices } from "@/app/actions/invoice"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function AdminInvoicesPage() {
  const result = await getAdminInvoices()

  // 1. Authentication Check (Sign-in Wall)
  if (!result.success || !result.invoices) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteNavbar />
        <main className="flex-1 max-w-md mx-auto w-full px-4 py-20 flex flex-col justify-center">
          <Card className="border border-border rounded-3xl p-6 text-center space-y-5 shadow-sm bg-card">
            <span className="flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 mx-auto border border-amber-100">
              <ShieldAlert className="size-6" />
            </span>
            <div className="space-y-1.5">
              <CardTitle className="text-xl">Admin Access Required</CardTitle>
              <CardDescription className="max-w-[280px] mx-auto">
                Please log in to an administrator account to view marketplace tax invoices and logistics receipts.
              </CardDescription>
            </div>
            <Button className="w-full h-11 shadow-md shadow-primary/10" render={<Link href="/login?callbackURL=/admin/invoices" />}>
              Sign In as Admin
            </Button>
          </Card>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const { invoices } = result

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="size-8 p-0 rounded-full" render={<Link href="/admin/orders" />}>
                  <ArrowLeft className="size-4" />
                </Button>
                <p className="text-sm font-medium text-primary">Admin Control Center</p>
              </div>
              <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl flex items-center gap-2 text-foreground">
                <FileText className="size-7 text-primary" />
                Marketplace Invoices
              </h1>
              <p className="text-sm text-muted-foreground">
                Audit tax invoices, filter and download PDF receipts for completed transactions.
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-9 gap-1.5" render={<Link href="/admin/orders" />}>
              Back to Orders Panel
            </Button>
          </div>

          {/* Invoices List Card */}
          <Card className="border border-border/85 rounded-3xl overflow-hidden shadow-sm bg-card">
            {invoices.length === 0 ? (
              <CardContent className="py-16 text-center space-y-4">
                <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mx-auto">
                  <FileText className="size-6" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">No Invoices Found</h3>
                  <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
                    Invoices are only generated for confirmed, shipped, or delivered orders.
                  </p>
                </div>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4">Invoice #</th>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {invoices.map((inv) => (
                      <tr key={inv.orderId} className="transition-colors hover:bg-muted/30">
                        
                        {/* Invoice Number */}
                        <td className="px-6 py-4 font-mono font-bold text-foreground">
                          {inv.invoiceNumber}
                        </td>

                        {/* Order ID */}
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          {inv.orderId}
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4 font-semibold text-foreground">
                          {inv.buyerName}
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {new Date(inv.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4 font-bold text-foreground">
                          ${parseFloat(inv.totalAmount).toFixed(2)}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <Badge className={`font-bold text-[10px] uppercase rounded-full border-none px-2.5 py-0.5 ${
                            inv.invoiceStatus === "refunded"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {inv.invoiceStatus}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                            render={<Link href={`/orders/invoice/${inv.orderId}`} />}
                            aria-label={`View invoice ${inv.invoiceNumber}`}
                          >
                            <Download className="size-4" />
                          </Button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

import Link from "next/link"
import { History, ShieldAlert, ShoppingBag, Eye, CreditCard, Calendar, Clock, AlertTriangle } from "lucide-react"
import { getUserPaymentHistory } from "@/app/actions/payment"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { redirect } from "next/navigation"

export default async function PaymentHistoryPage() {
  redirect("/orders")
  const result = await getUserPaymentHistory()

  // 1. Authentication Check (Sign-in Wall)
  if (!result.success || !result.history) {
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
              <CardDescription className="max-w-[280px] mx-auto">Please sign in to your SaaSum account to view your transaction and payment history.</CardDescription>
            </div>
            <Button className="w-full h-11 shadow-md shadow-primary/10" render={<Link href="/login?callbackURL=/payment/history" />}>
              Sign In to Account
            </Button>
          </Card>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const history = result.history

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
                Payment &amp; Order History
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">List of all your processed payments, receipts, and order statuses.</p>
            </div>
            <Button size="sm" variant="outline" className="h-9 gap-1.5" render={<Link href="/shop" />}>
              <ShoppingBag className="size-4" />
              Continue Shopping
            </Button>
          </div>

          {/* Table Card */}
          <Card className="border border-border rounded-3xl overflow-hidden shadow-sm bg-card">
            {history.length === 0 ? (
              <CardContent className="py-16 text-center space-y-4">
                <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mx-auto">
                  <CreditCard className="size-6" />
                </span>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-base text-foreground">No Payments Found</h3>
                  <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">You haven&apos;t placed any orders or made any payments yet.</p>
                </div>
                <Button size="sm" render={<Link href="/shop" />}>
                  Browse Products
                </Button>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4">Order / Payment ID</th>
                      <th className="px-6 py-4">Placed Date</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {history.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-muted/30">
                        
                        {/* Order & Transaction ID */}
                        <td className="px-6 py-4.5">
                          <p className="font-mono font-bold text-foreground">{order.id}</p>
                          {order.paymentId ? (
                            <p className="text-[11px] font-mono text-muted-foreground mt-0.5 max-w-[140px] truncate" title={order.paymentId}>
                              TX: {order.paymentId}
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium flex items-center gap-1">
                              <Clock className="size-3" /> No transaction ID
                            </p>
                          )}
                        </td>

                        {/* Placed Date */}
                        <td className="px-6 py-4.5 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 shrink-0 text-slate-400" />
                            <span>{new Date(order.placedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}</span>
                          </div>
                        </td>

                        {/* Payment Method */}
                        <td className="px-6 py-4.5 font-medium text-foreground">
                          {order.paymentMethod || "N/A"}
                        </td>

                        {/* Total Amount */}
                        <td className="px-6 py-4.5 font-bold text-foreground">
                          ${parseFloat(order.totalAmount).toFixed(2)}
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4.5">
                          <Badge
                            className={`border-transparent font-semibold text-xs rounded-full px-2.5 py-0.5 ${
                              order.paymentStatus === "paid"
                                ? "bg-emerald-100 text-emerald-800"
                                : order.paymentStatus === "failed"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {order.paymentStatus.toUpperCase()}
                          </Badge>
                        </td>

                        {/* View Button */}
                        <td className="px-6 py-4.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                            render={<Link href={order.paymentStatus === "paid" ? `/payment/success?orderId=${order.id}` : `/payment/failure?orderId=${order.id}&error=Payment was not successful`} />}
                            aria-label={`View details for order ${order.id}`}
                          >
                            <Eye className="size-4" />
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

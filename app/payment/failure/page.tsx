import Link from "next/link"
import { AlertOctagon, ArrowLeft, RefreshCw } from "lucide-react"
import { getOrderDetails } from "@/app/actions/order"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

type FailurePageProps = {
  searchParams: Promise<{ orderId?: string; error?: string }>
}

export default async function PaymentFailurePage({ searchParams }: FailurePageProps) {
  const params = await searchParams
  const orderId = params.orderId
  const errorMessage = params.error || "The transaction was declined by the bank."

  // 1. Authentication Check & Session Retrieval
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect(`/login?callbackURL=/payment/failure?orderId=${encodeURIComponent(orderId || "")}`)
  }

  let orderAmount = 0
  let paymentMethod: string | null = null

  if (orderId) {
    const orderIds = orderId.split(",")
    const allDetails = await Promise.all(orderIds.map((id) => getOrderDetails(id)))
    const validDetails = allDetails.filter((d): d is NonNullable<typeof d> => d !== null)
    
    // 2. Strict Ownership Verification (Only owner or admin allowed)
    for (const details of validDetails) {
      if (details.order.userId !== session.user.id && session.user.role !== "admin") {
        notFound()
      }
    }

    if (validDetails.length > 0) {
      orderAmount = validDetails.reduce((sum, d) => sum + parseFloat(d.order.totalAmount), 0)
      paymentMethod = validDetails[0].order.paymentMethod
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-16 flex flex-col justify-center">
        <div className="space-y-8">
          
          {/* Failure Banner */}
          <div className="text-center space-y-3">
            <div className="inline-flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive animate-pulse">
              <AlertOctagon className="size-10" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Payment Failed
            </h1>
            <p className="text-muted-foreground text-pretty max-w-sm mx-auto text-sm">
              We couldn&apos;t complete your transaction. Your card or account was not charged.
            </p>
          </div>

          {/* Details Box */}
          <Card className="border border-border rounded-3xl overflow-hidden shadow-sm bg-card">
            <CardContent className="p-6 space-y-4">
              <div className="text-sm space-y-3">
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Order ID(s)</span>
                  <span className="font-semibold font-mono text-foreground truncate max-w-[200px]" title={orderId || "N/A"}>
                    {orderId || "N/A"}
                  </span>
                </div>
                {orderAmount > 0 && (
                  <div className="flex justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-bold text-foreground">${orderAmount.toFixed(2)}</span>
                  </div>
                )}
                {paymentMethod && (
                  <div className="flex justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-semibold text-foreground">{paymentMethod}</span>
                  </div>
                )}
                <div className="pt-1">
                  <span className="text-muted-foreground block text-xs mb-1">Reason for Failure</span>
                  <p className="text-xs font-semibold text-destructive bg-destructive/5 border border-destructive/10 rounded-lg p-3 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 h-11 gap-2 shadow-sm rounded-xl border-border"
              variant="outline"
              render={<Link href="/cart" />}
            >
              <ArrowLeft className="size-4" />
              Return to Cart
            </Button>
            <Button
              className="flex-1 h-11 gap-2 shadow-lg shadow-primary/25 rounded-xl"
              render={<Link href="/checkout" />}
            >
              <RefreshCw className="size-4" />
              Retry Checkout
            </Button>
          </div>

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

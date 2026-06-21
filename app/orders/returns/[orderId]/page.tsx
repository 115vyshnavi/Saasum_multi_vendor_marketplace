import React from "react"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { returns as returnsTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { getOrderDetails } from "@/app/actions/order"
import { ReturnFormClient } from "./return-form-client"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import Link from "next/link"

type ReturnRequestPageProps = {
  params: Promise<{ orderId: string }>
}

export default async function ReturnRequestPage({ params }: ReturnRequestPageProps) {
  const { orderId } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    redirect(`/login?callbackUrl=/orders/returns/${orderId}`)
  }

  // 1. Fetch order details
  const details = await getOrderDetails(orderId)
  if (!details) {
    notFound()
  }

  const { order } = details

  // 2. Ownership check
  if (order.userId !== session.user.id && session.user.role !== "admin") {
    notFound()
  }

  // 3. Strict Return Eligibility Validations
  let ineligibleReason: string | null = null

  // Eligibility Rule 1: Delivered orders only
  if (order.status !== "delivered") {
    ineligibleReason = `Only orders with status 'delivered' can be returned. Current status is '${order.status}'.`
  }
  // Eligibility Rule 2: Not cancelled
  else if (order.status === "cancelled") {
    ineligibleReason = "Cancelled orders are not eligible for return."
  }
  // Eligibility Rule 3: Within 7 days
  else if (!order.deliveredAt) {
    ineligibleReason = "No delivery timestamp found. Order return window cannot be verified."
  } else {
    const deliveredDate = new Date(order.deliveredAt)
    const now = new Date()
    const diffInTime = now.getTime() - deliveredDate.getTime()
    const diffInDays = diffInTime / (1000 * 3600 * 24)
    if (diffInDays > 7) {
      ineligibleReason = `The 7-day return eligibility window has expired. (Delivered on ${deliveredDate.toLocaleDateString()})`
    }
  }

  // Eligibility Rule 4: Not already returned (existing return request check)
  if (!ineligibleReason) {
    const existingReturns = await db
      .select()
      .from(returnsTable)
      .where(eq(returnsTable.orderId, orderId))
      .limit(1)

    if (existingReturns[0]) {
      ineligibleReason = `A return request has already been submitted for this order (current return status: '${existingReturns[0].status}').`
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <SiteNavbar />

      <main className="flex-1 py-12 px-4 max-w-7xl mx-auto w-full flex flex-col justify-center">
        {ineligibleReason ? (
          <Card className="border border-border/80 rounded-[2rem] p-8 max-w-md mx-auto text-center shadow-lg bg-card space-y-6">
            <CardContent className="space-y-5 pt-6">
              <span className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 mx-auto border border-rose-100">
                <ShieldAlert className="size-7" />
              </span>
              <div className="space-y-2">
                <h3 className="font-extrabold text-xl text-foreground tracking-tight">Return Ineligible</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {ineligibleReason}
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Button size="sm" variant="outline" className="rounded-xl" render={<Link href="/orders" />}>
                  <ArrowLeft className="size-4 mr-1.5" /> Back to Orders
                </Button>
                <Button size="sm" className="rounded-xl" render={<Link href="/shop" />}>
                  Return to Shop
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ReturnFormClient orderId={orderId} />
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

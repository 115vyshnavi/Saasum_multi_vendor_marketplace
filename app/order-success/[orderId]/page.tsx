import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, ShoppingBag, Truck, CreditCard, Calendar } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { getOrderDetails } from "@/app/actions/order"

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const details = await getOrderDetails(orderId)

  if (!details) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteNavbar />
        <main className="flex-1 bg-card/20 py-20 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Order not found</h1>
          <p className="mt-3 text-muted-foreground text-sm">
            We couldn&apos;t retrieve the details for order ID: {orderId}
          </p>
          <Button className="mt-8" render={<Link href="/shop" />}>
            Back to Shop
          </Button>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const { order, items } = details
  const subtotal = parseFloat(order.subtotal)
  const shipping = parseFloat(order.shippingCost)
  const total = parseFloat(order.totalAmount)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNavbar />
      <main className="flex-1 bg-card/20 py-10 lg:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center pb-8 border-b border-border mb-8">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="size-9" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">Order Placed Successfully!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you for shopping with Saasum IQMart.
            </p>
          </div>

          <div className="space-y-6">
            {/* Info Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-4 text-primary" />
                  Order Info
                </h2>
                <div className="space-y-1">
                  <p className="text-sm">
                    Order ID: <strong className="font-mono text-foreground text-xs">{orderId}</strong>
                  </p>
                  <p className="text-sm">
                    Status: <span className="capitalize font-medium text-primary">{order.status}</span>
                  </p>
                  <p className="text-sm">
                    Payment Method: <span className="font-medium text-foreground">{order.paymentMethod}</span>
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <Truck className="size-4 text-primary" />
                  Shipping Address
                </h2>
                <div className="text-sm space-y-0.5 text-foreground leading-normal">
                  <p className="font-semibold">{order.shippingName}</p>
                  <p>{order.shippingAddress}</p>
                  <p>
                    {order.shippingCity}, {order.shippingState} - {order.shippingPincode}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Phone: {order.shippingPhone}</p>
                </div>
              </section>
            </div>

            {/* Items List */}
            <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground pb-2 border-b border-border">
                <ShoppingBag className="size-4 text-primary" />
                Items Ordered
              </h2>
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id} className="flex py-3 items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-secondary border border-border">
                        <Image
                          src={item.productImage || "/placeholder.svg"}
                          alt={item.productName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate text-foreground">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} · Price: ${item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-foreground ml-3">${item.totalPrice.toFixed(2)}</p>
                  </li>
                ))}
              </ul>
            </section>

            {/* Payment Summary */}
            <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground pb-2 border-b border-border">
                <CreditCard className="size-4 text-primary" />
                Payment Summary
              </h2>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-foreground">${subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <dt>Shipping Charge</dt>
                  <dd className="font-medium text-foreground">
                    {shipping === 0 ? <span className="text-emerald-500 font-semibold">Free</span> : `$${shipping.toFixed(2)}`}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold text-foreground">
                  <dt>Total Amount</dt>
                  <dd>${total.toFixed(2)}</dd>
                </div>
              </dl>
            </section>

            {/* Back Button */}
            <div className="text-center pt-4">
              <Button className="w-full sm:w-auto h-11 px-8 shadow-md" render={<Link href="/shop" />}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, CreditCard, Minus, Plus, ShoppingBag, Trash2, CheckCircle2 } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-provider"
import { cn } from "@/lib/utils"
import { getCartRecommendations } from "@/app/actions/recommendations"
import { Recommendations } from "@/components/recommendations"

const ease = [0.22, 1, 0.36, 1] as const

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartSubtotal } = useCart()
  const [recommendations, setRecommendations] = useState<any[]>([])

  useEffect(() => {
    const fetchRecs = async () => {
      const itemIds = cartItems.map((item) => item.id)
      const recs = await getCartRecommendations(itemIds, 8)
      setRecommendations(recs)
    }
    fetchRecs()
  }, [cartItems])

  // Shipping is $10, free if subtotal is over $150, and $0 if cart is empty
  const shippingCost = useMemo(() => {
    if (cartItems.length === 0) return 0
    return cartSubtotal >= 150 ? 0 : 10
  }, [cartItems, cartSubtotal])

  const totalAmount = useMemo(() => {
    return cartSubtotal + shippingCost
  }, [cartSubtotal, shippingCost])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNavbar />
      <main className="flex-1 bg-card/20 py-10 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 sm:py-24">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
                <ShoppingBag className="size-8" />
              </div>
              <h1 className="mt-6 text-2xl font-bold tracking-tight">Your cart is empty</h1>
              <p className="mt-3 text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
                Looks like you haven&apos;t added anything to your cart yet. Explore our marketplace to discover great products.
              </p>
              <Button className="mt-8 gap-2" render={<Link href="/shop" />}>
                <ArrowLeft className="size-4" />
                Explore products
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between pb-6 border-b border-border">
                  <h1 className="text-2xl font-bold tracking-tight">Shopping Cart</h1>
                  <span className="text-sm text-muted-foreground">
                    {cartItems.reduce((acc, item) => acc + item.quantity, 0)} items
                  </span>
                </div>

                <div className="mt-6 flow-root">
                  <ul className="-my-6 divide-y divide-border">
                    <AnimatePresence initial={false}>
                      {cartItems.map((item) => (
                        <motion.li
                          key={item.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -12, paddingBottom: 0, paddingTop: 0 }}
                          transition={{ duration: 0.35, ease }}
                          className="flex py-6 overflow-hidden"
                        >
                          <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          </div>

                          <div className="ml-4 flex flex-1 flex-col">
                            <div>
                              <div className="flex justify-between text-base font-semibold">
                                <h3 className="line-clamp-1">
                                  <Link href={`/product/${item.id}`} className="hover:text-primary transition-colors">
                                    {item.name}
                                  </Link>
                                </h3>
                                <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                              </div>
                              {item.vendorName && (
                                <p className="mt-1 text-xs text-muted-foreground">by {item.vendorName}</p>
                              )}
                            </div>
                            <div className="flex flex-1 items-end justify-between text-sm">
                              <div className="flex items-center gap-1 border border-border bg-background rounded-lg p-0.5 shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="size-3.5" />
                                </button>
                                <span className="w-8 text-center font-mono text-sm font-medium tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="size-3.5" />
                                </button>
                              </div>

                              <div className="flex">
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.id)}
                                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="size-4" />
                                  <span className="hidden sm:inline">Remove</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              </div>

              {/* Order Summary */}
              <aside className="rounded-3xl border border-border bg-card p-6 shadow-sm h-fit">
                <h2 className="text-lg font-bold tracking-tight border-b border-border pb-4">Order Summary</h2>

                <dl className="mt-6 space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <dt>Subtotal</dt>
                    <dd className="font-medium text-foreground">${cartSubtotal.toFixed(2)}</dd>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <dt>Delivery Charges</dt>
                    <dd className="font-medium text-foreground">
                      {shippingCost === 0 ? (
                        <span className="text-emerald-500 font-semibold">Free</span>
                      ) : (
                        `$${shippingCost.toFixed(2)}`
                      )}
                    </dd>
                  </div>
                  {shippingCost > 0 && (
                    <div className="rounded-2xl bg-primary/5 border border-primary/10 p-3 text-xs text-primary leading-normal">
                      Add <span className="font-semibold">${(150 - cartSubtotal).toFixed(2)}</span> more to your cart to unlock **Free Delivery**!
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-4 text-base font-bold">
                    <dt>Final Total</dt>
                    <dd>${totalAmount.toFixed(2)}</dd>
                  </div>
                </dl>

                <Button
                  className="mt-8 w-full gap-2 h-11 shadow-lg shadow-primary/25"
                  render={<Link href="/checkout" />}
                >
                  <CreditCard className="size-4" />
                  Proceed to Checkout
                </Button>

                <div className="mt-4 text-center">
                  <Link href="/shop" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="size-3" />
                    Continue Shopping
                  </Link>
                </div>
              </aside>
            </div>
          )}

          <Recommendations products={recommendations} title="Recommended for You" />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

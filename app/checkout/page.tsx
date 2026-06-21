"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { ArrowLeft, CreditCard, ShoppingBag, Truck, User, Phone, MapPin, Building, Globe, Mail } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/components/cart-provider"
import { authClient } from "@/lib/auth-client"
import { placeOrder } from "@/app/actions/order"
import { validateCouponAction } from "@/app/actions/coupons"
import { cn } from "@/lib/utils"
import {
  getRazorpayConfig,
  createRazorpayOrder,
  verifyAndCompletePayment,
  markPaymentFailed,
} from "@/app/actions/payment"

// Dynamically load Razorpay SDK on client side
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const ease = [0.22, 1, 0.36, 1] as const

const paymentMethods = [
  { id: "cod", name: "Cash on Delivery", desc: "Pay with cash when package arrives" },
  { id: "upi", name: "UPI", desc: "Pay instantly with Google Pay, PhonePe, or BHIM" },
  { id: "card", name: "Card", desc: "Pay with credit, debit, or prepaid cards" },
  { id: "netbanking", name: "Net Banking", desc: "Direct pay from your bank account" },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { cartItems, cartSubtotal, clearCart } = useCart()
  const { data: session, isPending } = authClient.useSession()

  const [showSandboxModal, setShowSandboxModal] = useState(false)
  const [sandboxOrderDetails, setSandboxOrderDetails] = useState<{
    id: string
    orderId: string
    amount: number
    paymentMethod: string
  } | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [pincode, setPincode] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasRedirectedRef = useRef(false)

  // Coupon Engine States
  const [couponCodeInput, setCouponCodeInput] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  // Shipping cost: $10, free if subtotal > 150
  const shippingCost = useMemo(() => {
    if (cartItems.length === 0) return 0
    return cartSubtotal >= 150 ? 0 : 10
  }, [cartItems, cartSubtotal])

  const totalAmount = useMemo(() => {
    const val = cartSubtotal + shippingCost - discountAmount
    return val > 0 ? val : 0
  }, [cartSubtotal, shippingCost, discountAmount])

  const handleApplyCoupon = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!couponCodeInput.trim()) return

    setCouponLoading(true)
    setCouponMessage(null)

    try {
      const res = await validateCouponAction(
        couponCodeInput,
        cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        }))
      )

      if (res.success && res.discountAmount !== undefined) {
        setAppliedCoupon(res.coupon)
        setDiscountAmount(res.discountAmount)
        setCouponMessage({
          text: `Coupon applied! Saved $${res.discountAmount.toFixed(2)}.`,
          isError: false,
        })
      } else {
        setAppliedCoupon(null)
        setDiscountAmount(0)
        setCouponMessage({
          text: res.error || "Failed to apply coupon.",
          isError: true,
        })
      }
    } catch (err: any) {
      setAppliedCoupon(null)
      setDiscountAmount(0)
      setCouponMessage({
        text: err.message || "An error occurred.",
        isError: true,
      })
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = (e: React.MouseEvent) => {
    e.preventDefault()
    setCouponCodeInput("")
    setAppliedCoupon(null)
    setDiscountAmount(0)
    setCouponMessage(null)
  }

  // Prefill authenticated user profile info
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "")
      setEmail(session.user.email || "")
    }
  }, [session])

  // Redirect if cart is empty (with guard to prevent multiple redirects)
  useEffect(() => {
    if (cartItems.length === 0 && !loading && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true
      // Use setTimeout to ensure redirect happens after render is complete
      setTimeout(() => {
        router.push("/cart")
      }, 0)
    }
  }, [cartItems, router, loading])

  const handleSandboxSuccess = async () => {
    if (!sandboxOrderDetails) return
    setLoading(true)
    setError(null)
    try {
      const mockPayId = `pay_sandbox_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`
      const res = await verifyAndCompletePayment({
        orderId: sandboxOrderDetails.orderId,
        razorpayPaymentId: mockPayId,
        razorpayOrderId: sandboxOrderDetails.id,
        razorpaySignature: "mock_sandbox_signature",
        paymentMethod: sandboxOrderDetails.paymentMethod,
      })
      if (res.success) {
        clearCart()
        setShowSandboxModal(false)
        router.push(`/payment/success?orderId=${sandboxOrderDetails.orderId}`)
      } else {
        setError(res.error || "Sandbox payment verification failed")
        setShowSandboxModal(false)
      }
    } catch (err: any) {
      setError(err.message || "Sandbox payment verification failed")
      setShowSandboxModal(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSandboxFailure = async () => {
    if (!sandboxOrderDetails) return
    setLoading(true)
    setError(null)
    try {
      await markPaymentFailed(sandboxOrderDetails.orderId)
      setShowSandboxModal(false)
      router.push(`/payment/failure?orderId=${sandboxOrderDetails.orderId}&error=Simulated payment failure`)
    } catch (err: any) {
      setError(err.message || "Failed to log sandbox failure")
      setShowSandboxModal(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSandboxCancel = async () => {
    if (!sandboxOrderDetails) return
    setLoading(true)
    try {
      await markPaymentFailed(sandboxOrderDetails.orderId)
      setShowSandboxModal(false)
      setError("Payment cancelled by user")
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name || !phone || !address || !city || !state || !pincode) {
      setError("Please fill in all shipping details")
      return
    }

    if (!session?.user && !email) {
      setError("Please fill in your email for guest checkout")
      return
    }

    setLoading(true)

    try {
      // 1. Create order record in database (initially pending status)
      const res = await placeOrder({
        items: cartItems.map((item) => ({ id: item.id, quantity: item.quantity })),
        address: { name, phone, address, city, state, pincode },
        paymentMethod,
        email: session?.user ? undefined : email,
        couponCode: appliedCoupon?.code || undefined,
      })

      if (!res.success || !('orderId' in res)) {
        setError('error' in res ? res.error : "Failed to place order")
        setLoading(false)
        return
      }

      const orderId = res.orderId

      // 2. Handle Cash on Delivery directly without payment gateway
      if (paymentMethod === "Cash on Delivery") {
        clearCart()
        router.push(`/payment/success?orderId=${orderId}&cod=true`)
        return
      }

      // 3. Handle Online Payment (UPI, Card, Net Banking) via Razorpay
      const config = await getRazorpayConfig()
      const razorpayOrder = await createRazorpayOrder({
        orderId,
        amount: Math.round(totalAmount * 100),
      })

      if (!razorpayOrder.success || !razorpayOrder.id) {
        setError(razorpayOrder.error || "Failed to initiate online payment order")
        setLoading(false)
        return
      }

      if (razorpayOrder.mock || !config.keyId) {
        // Trigger Sandbox Modal simulation
        setSandboxOrderDetails({
          id: razorpayOrder.id,
          orderId,
          amount: typeof razorpayOrder.amount === 'number' ? razorpayOrder.amount : Math.round(totalAmount * 100),
          paymentMethod,
        })
        setShowSandboxModal(true)
      } else {
        // Load script and trigger real Razorpay Checkout
        const loaded = await loadRazorpayScript()
        if (!loaded) {
          setError("Failed to load Razorpay payment SDK. Check connection.")
          setLoading(false)
          return
        }

        const options = {
          key: config.keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency || "USD",
          name: "SaaSum IQMart",
          description: `Payment for Order ${orderId}`,
          order_id: razorpayOrder.id,
          handler: async function (response: any) {
            setLoading(true)
            try {
              const verifyRes = await verifyAndCompletePayment({
                orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                paymentMethod,
              })

              if (verifyRes.success) {
                clearCart()
                router.push(`/payment/success?orderId=${orderId}`)
              } else {
                setError(verifyRes.error || "Payment verification failed")
              }
            } catch (err: any) {
              setError(err.message || "Failed to verify signature")
            } finally {
              setLoading(false)
            }
          },
          prefill: {
            name,
            email: email || session?.user?.email,
            contact: phone,
          },
          notes: {
            address,
          },
          theme: {
            color: "#2563eb",
          },
          modal: {
            ondismiss: async function () {
              setLoading(true)
              await markPaymentFailed(orderId)
              router.push(`/payment/failure?orderId=${orderId}&error=Payment cancelled by user`)
            },
          },
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      setLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return null // useEffect handles redirect
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNavbar />
      <main className="flex-1 bg-card/20 py-10 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 pb-6 border-b border-border mb-10">
            <Link href="/cart" className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors">
              <ArrowLeft className="size-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping Details */}
              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 pb-3 border-b border-border text-foreground">
                  <Truck className="size-5 text-primary" />
                  Shipping Details
                </h2>

                {session?.user && (
                  <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 text-sm text-primary flex items-center gap-2">
                    <User className="size-4" />
                    <span>Logged in as <strong>{session.user.name}</strong> ({session.user.email})</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  {!session?.user && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="email">Email Address (for Guest Checkout)</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House / Flat No, Apartment Name, Street Name"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <div className="relative">
                      <Building className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="state">State</Label>
                    <div className="relative">
                      <Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="600001"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Payment Details */}
              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 pb-3 border-b border-border text-foreground">
                  <CreditCard className="size-5 text-primary" />
                  Payment Method
                </h2>

                <div className="grid gap-3 sm:grid-cols-2">
                  {paymentMethods.map((m) => (
                    <label
                      key={m.id}
                      className={cn(
                        "relative flex flex-col gap-1.5 rounded-2xl border p-4 cursor-pointer hover:bg-muted/40 transition-all select-none",
                        paymentMethod === m.name
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border bg-background"
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={m.name}
                        checked={paymentMethod === m.name}
                        onChange={() => setPaymentMethod(m.name)}
                        className="sr-only"
                      />
                      <span className="font-semibold text-sm">{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.desc}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            {/* Order Summary & Actions */}
            <aside className="space-y-6">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 pb-4 border-b border-border text-foreground">
                  <ShoppingBag className="size-5 text-primary" />
                  Order Summary
                </h2>

                {/* Items List */}
                <ul className="divide-y divide-border max-h-52 overflow-y-auto pr-1 my-4">
                  {cartItems.map((item) => (
                    <li key={item.id} className="flex py-3 items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-secondary border border-border">
                          <Image src={item.image} alt={item.name} fill sizes="40px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-foreground ml-3">${(item.price * item.quantity).toFixed(2)}</p>
                    </li>
                  ))}
                </ul>

                {/* Coupon Code Input */}
                <div className="border-t border-border pt-4 mt-4 space-y-2.5">
                  <Label htmlFor="coupon" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Have a promo code?
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      placeholder="Enter coupon code"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      disabled={couponLoading || !!appliedCoupon}
                      className="h-9 text-sm bg-background border-border"
                    />
                    {appliedCoupon ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveCoupon}
                        className="h-9 px-3 text-xs border-destructive text-destructive hover:bg-destructive/5"
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCodeInput.trim()}
                        className="h-9 px-4 text-xs font-semibold"
                      >
                        {couponLoading ? "Applying..." : "Apply"}
                      </Button>
                    )}
                  </div>
                  {couponMessage && (
                    <p className={cn("text-xs leading-normal", couponMessage.isError ? "text-destructive" : "text-emerald-500 font-medium")}>
                      {couponMessage.text}
                    </p>
                  )}
                </div>

                <dl className="space-y-4 pt-4 border-t border-border mt-4">
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
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm text-emerald-500 font-medium">
                      <dt>Discount ({appliedCoupon?.code})</dt>
                      <dd>-${discountAmount.toFixed(2)}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-4 text-base font-bold">
                    <dt>Final Total</dt>
                    <dd className="text-foreground">${totalAmount.toFixed(2)}</dd>
                  </div>
                </dl>

                {error && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive mt-6 leading-normal">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="mt-6 w-full h-11 gap-2 shadow-lg shadow-primary/25"
                  disabled={loading}
                >
                  <CreditCard className="size-4" />
                  {loading ? "Processing..." : paymentMethod === "Cash on Delivery" ? "Place Order (COD)" : `Pay $${totalAmount.toFixed(2)}`}
                </Button>
              </div>
            </aside>
          </form>
        </div>
      </main>

      {/* SaaSum Sandbox Payment Simulation Modal */}
      {showSandboxModal && sandboxOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="text-center space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                SaaSum Sandbox Gateway
              </span>
              <h3 className="text-xl font-bold tracking-tight text-foreground">Complete Payment Simulation</h3>
              <p className="text-xs text-muted-foreground">Test payment processing environment</p>
            </div>

            {/* Details Box */}
            <div className="bg-muted/40 rounded-2xl p-4 border border-border text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-semibold font-mono text-foreground">{sandboxOrderDetails.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-foreground">${(sandboxOrderDetails.amount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-semibold text-foreground">{sandboxOrderDetails.paymentMethod}</span>
              </div>
            </div>

            {/* Simulator Actions */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleSandboxSuccess}
                disabled={loading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/20"
              >
                Simulate Payment Success
              </Button>
              <Button
                onClick={handleSandboxFailure}
                disabled={loading}
                variant="outline"
                className="w-full h-11 border-destructive text-destructive hover:bg-destructive/5 font-semibold"
              >
                Simulate Payment Failure
              </Button>
              <Button
                onClick={handleSandboxCancel}
                disabled={loading}
                variant="ghost"
                className="w-full h-11 text-muted-foreground hover:text-foreground"
              >
                Cancel &amp; Go Back
              </Button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  )
}

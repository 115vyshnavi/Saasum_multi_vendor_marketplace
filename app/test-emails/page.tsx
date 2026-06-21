"use client"

import { useEffect, useState } from "react"
import { Mail, CheckCircle2, AlertTriangle, ExternalLink, Loader2, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  triggerTestWelcome,
  triggerTestConfirmation,
  triggerTestShipped,
  triggerTestCartReminder,
  getRecentOrdersList,
} from "@/app/actions/test-emails"

type OrderItemInfo = {
  id: string
  shippingName: string
  total: string
  status: string
}

export default function TestEmailsPage() {
  const [orders, setOrders] = useState<OrderItemInfo[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Form States
  const [welcomeName, setWelcomeName] = useState("Marcus Lee")
  const [welcomeEmail, setWelcomeEmail] = useState("marcus@example.com")
  const [welcomeRole, setWelcomeRole] = useState("buyer")

  const [orderEmail, setOrderEmail] = useState("customer@example.com")
  const [trackingNumber, setTrackingNumber] = useState("")

  const [cartName, setCartName] = useState("Priya Nair")
  const [cartEmail, setCartEmail] = useState("priya@example.com")

  // Result States
  const [triggerStatus, setTriggerStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [resultMessage, setResultMessage] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Load recent orders
  async function loadOrders() {
    setLoadingOrders(true)
    try {
      const list = await getRecentOrdersList()
      setOrders(list)
      if (list.length > 0) {
        setSelectedOrderId(list[0].id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  async function handleSendWelcome(e: React.FormEvent) {
    e.preventDefault()
    setTriggerStatus("sending")
    setResultMessage("")
    setPreviewUrl(null)

    try {
      const res = await triggerTestWelcome(welcomeName, welcomeEmail, welcomeRole)
      if (res.success) {
        setTriggerStatus("success")
        setResultMessage(`Welcome email successfully triggered for ${welcomeName} (${welcomeEmail})!`)
        if (res.previewUrl) setPreviewUrl(res.previewUrl)
      } else {
        setTriggerStatus("error")
        setResultMessage("Failed to send welcome email. Check server console logs.")
      }
    } catch (err: any) {
      setTriggerStatus("error")
      setResultMessage(err.message || "An unexpected error occurred.")
    }
  }

  async function handleSendConfirmation(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrderId) {
      alert("Please select or create an order first.")
      return
    }
    setTriggerStatus("sending")
    setResultMessage("")
    setPreviewUrl(null)

    try {
      const res = await triggerTestConfirmation(selectedOrderId, orderEmail)
      if (res.success) {
        setTriggerStatus("success")
        setResultMessage(`Order confirmation email sent for Order ${selectedOrderId} to ${orderEmail}!`)
        if (res.previewUrl) setPreviewUrl(res.previewUrl)
      } else {
        setTriggerStatus("error")
        setResultMessage("Failed to send order confirmation email. Ensure order ID exists in DB.")
      }
    } catch (err: any) {
      setTriggerStatus("error")
      setResultMessage(err.message || "An unexpected error occurred.")
    }
  }

  async function handleSendShipped(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrderId) {
      alert("Please select or create an order first.")
      return
    }
    setTriggerStatus("sending")
    setResultMessage("")
    setPreviewUrl(null)

    try {
      const res = await triggerTestShipped(selectedOrderId, orderEmail, trackingNumber || undefined)
      if (res.success) {
        setTriggerStatus("success")
        setResultMessage(`Order shipped email sent for Order ${selectedOrderId} to ${orderEmail}!`)
        if (res.previewUrl) setPreviewUrl(res.previewUrl)
        // Refresh orders list to see updated status
        loadOrders()
      } else {
        setTriggerStatus("error")
        setResultMessage("Failed to send order shipped email. Check server console logs.")
      }
    } catch (err: any) {
      setTriggerStatus("error")
      setResultMessage(err.message || "An unexpected error occurred.")
    }
  }

  async function handleSendCartReminder(e: React.FormEvent) {
    e.preventDefault()
    setTriggerStatus("sending")
    setResultMessage("")
    setPreviewUrl(null)

    try {
      const res = await triggerTestCartReminder(cartEmail, cartName)
      if (res.success) {
        setTriggerStatus("success")
        setResultMessage(`Cart reminder email triggered for ${cartName} (${cartEmail})!`)
        if (res.previewUrl) setPreviewUrl(res.previewUrl)
      } else {
        setTriggerStatus("error")
        setResultMessage("Failed to send cart reminder email. Check server console logs.")
      }
    } catch (err: any) {
      setTriggerStatus("error")
      setResultMessage(err.message || "An unexpected error occurred.")
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground transition-colors">
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight">SaaSum IQMart</h1>
              <p className="text-xs text-muted-foreground font-medium">Developer Email Diagnostics</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Mail className="size-3" /> Transactional Mail Console
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Action Columns */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* WELCOME EMAIL */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">1. Welcome Email (Signup Trigger)</CardTitle>
                <CardDescription>Simulate a new user registration to trigger the onboarding email flow.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendWelcome} className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="welcome-name">Full name</Label>
                      <Input
                        id="welcome-name"
                        value={welcomeName}
                        onChange={(e) => setWelcomeName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="welcome-role">Account Role</Label>
                      <select
                        id="welcome-role"
                        value={welcomeRole}
                        onChange={(e) => setWelcomeRole(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      >
                        <option value="buyer">Buyer (Customer)</option>
                        <option value="vendor">Vendor (Seller)</option>
                        <option value="brand">Brand (Store Owner)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="welcome-email">Email address</Label>
                    <Input
                      id="welcome-email"
                      type="email"
                      value={welcomeEmail}
                      onChange={(e) => setWelcomeEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={triggerStatus === "sending"} className="w-full">
                    {triggerStatus === "sending" ? <Loader2 className="size-4 animate-spin mr-2" /> : <Mail className="size-4 mr-2" />}
                    Send Welcome Email
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* ORDER CONFIRMATION & SHIPPED */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">2 & 3. Order Placement & Shipping Emails</CardTitle>
                    <CardDescription>Trigger Order Confirmation and Order Shipped notification flows.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadOrders} disabled={loadingOrders} className="size-8 p-0">
                    <RefreshCw className={`size-4 ${loadingOrders ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="order-select">Select Order from Database</Label>
                    <select
                      id="order-select"
                      value={selectedOrderId}
                      onChange={(e) => {
                        setSelectedOrderId(e.target.value)
                        const matched = orders.find(o => o.id === e.target.value)
                        if (matched) {
                          // Try to set address name as hints
                        }
                      }}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    >
                      {orders.length === 0 ? (
                        <option value="">No orders found (Place an order first!)</option>
                      ) : (
                        orders.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.id} - {o.shippingName} (${o.total}) [{o.status}]
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="order-email">Customer Email Address</Label>
                      <Input
                        id="order-email"
                        type="email"
                        value={orderEmail}
                        onChange={(e) => setOrderEmail(e.target.value)}
                        placeholder="customer@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping-track">Tracking Number (Optional)</Label>
                      <Input
                        id="shipping-track"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g. TRK123456789"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Button onClick={handleSendConfirmation} disabled={triggerStatus === "sending" || !selectedOrderId} variant="outline" className="w-full">
                      {triggerStatus === "sending" ? <Loader2 className="size-4 animate-spin mr-2" /> : <Mail className="size-4 mr-2" />}
                      Send Order Confirmation
                    </Button>
                    <Button onClick={handleSendShipped} disabled={triggerStatus === "sending" || !selectedOrderId} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      {triggerStatus === "sending" ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                      Send Order Shipped
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CART REMINDER */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">4. Cart Reminder Email</CardTitle>
                <CardDescription>Send a reminder email containing items left in the customer's cart.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendCartReminder} className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cart-name">Customer Name</Label>
                      <Input
                        id="cart-name"
                        value={cartName}
                        onChange={(e) => setCartName(e.target.value)}
                        placeholder="Priya Nair"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cart-email">Email Address</Label>
                      <Input
                        id="cart-email"
                        type="email"
                        value={cartEmail}
                        onChange={(e) => setCartEmail(e.target.value)}
                        placeholder="priya@example.com"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={triggerStatus === "sending"} className="w-full">
                    {triggerStatus === "sending" ? <Loader2 className="size-4 animate-spin mr-2" /> : <Mail className="size-4 mr-2" />}
                    Send Cart Reminder Email
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results Sidebar */}
          <div className="space-y-6">
            <Card className="h-full min-h-[400px] flex flex-col">
              <CardHeader className="border-b border-border bg-muted/40">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">Console Output</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                {triggerStatus === "idle" && (
                  <div className="space-y-3">
                    <span className="flex size-12 items-center justify-center rounded-full bg-muted mx-auto">
                      <Mail className="size-6 text-muted-foreground" />
                    </span>
                    <h3 className="font-semibold text-sm">Ready to Test</h3>
                    <p className="text-xs text-muted-foreground max-w-[200px]">Fill out any of the forms on the left and trigger an email dispatch.</p>
                  </div>
                )}

                {triggerStatus === "sending" && (
                  <div className="space-y-3">
                    <Loader2 className="size-8 animate-spin text-primary mx-auto" />
                    <h3 className="font-semibold text-sm">Sending Mail...</h3>
                    <p className="text-xs text-muted-foreground">Connecting to SMTP host and generating responsive HTML layout.</p>
                  </div>
                )}

                {triggerStatus === "success" && (
                  <div className="space-y-5 w-full">
                    <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                      <CheckCircle2 className="size-6" />
                    </span>
                    <div className="space-y-2">
                      <h3 className="font-bold text-sm text-emerald-800">Email Delivered!</h3>
                      <p className="text-xs text-muted-foreground bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 text-pretty">{resultMessage}</p>
                    </div>

                    {previewUrl ? (
                      <div className="p-4 border border-border bg-card rounded-lg space-y-3 shadow-sm">
                        <div className="text-left">
                          <p className="text-xs font-semibold text-muted-foreground">Ethereal Mail Preview</p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[280px] mt-0.5">{previewUrl}</p>
                        </div>
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          Open Email Preview
                          <ExternalLink className="size-3.5 ml-2" />
                        </a>
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed border-border rounded-lg">
                        <p className="text-xs font-medium text-slate-700">Real SMTP Sent</p>
                        <p className="text-[11px] text-muted-foreground mt-1">Real SMTP credentials were detected and used. Check the inbox of target email.</p>
                      </div>
                    )}
                  </div>
                )}

                {triggerStatus === "error" && (
                  <div className="space-y-3">
                    <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto">
                      <AlertTriangle className="size-6" />
                    </span>
                    <h3 className="font-semibold text-sm text-destructive">Failed to Send</h3>
                    <p className="text-xs text-muted-foreground bg-destructive/5 border border-destructive/10 rounded-lg p-3 text-pretty">{resultMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  )
}

"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { 
  DollarSign, 
  ArrowUpRight, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Percent, 
  RotateCcw,
  Sparkles,
  Award
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { requestPayout, getVendorLedger } from "@/app/actions/payouts"
import { cn } from "@/lib/utils"

interface Ledger {
  totalSales: number
  grossRevenue: number
  commissionRate: number
  platformCommission: number
  refundsDeducted: number
  netPayout: number
  paidPayouts: number
  pendingPayouts: number
  unpaidBalance: number
  eligibleGross: number
  eligibleCommission: number
  eligibleRefunds: number
}

interface Payout {
  id: number
  vendorId: string
  amount: string
  commissionAmount: string
  refundAmount: string
  status: string
  transactionId: string | null
  remarks: string | null
  payoutDate: Date | null
  createdAt: Date
  updatedAt: Date
}

interface Metrics {
  successfulOrdersCount: number
  refundedOrdersCount: number
  payoutSuccessRate: number
}

interface ClientProps {
  initialLedger: Ledger
  initialPayouts: Payout[]
  initialMetrics: Metrics
  vendorId: string
}

const ease = [0.22, 1, 0.36, 1] as const

export function VendorPayoutsClient({
  initialLedger,
  initialPayouts,
  initialMetrics,
  vendorId
}: ClientProps) {
  const [ledger, setLedger] = useState<Ledger>(initialLedger)
  const [payouts, setPayouts] = useState<Payout[]>(initialPayouts)
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Status Badge styles
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === "paid") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
          <CheckCircle2 className="size-3" /> Paid
        </span>
      )
    }
    if (s === "processing") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100 animate-pulse">
          <Clock className="size-3 animate-spin" /> Processing
        </span>
      )
    }
    if (s === "failed") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 border border-red-100">
          <AlertCircle className="size-3" /> Failed
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-100">
        <Clock className="size-3" /> Pending Approval
      </span>
    )
  }

  const handleRequestPayout = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await requestPayout()
      if (res.success) {
        setSuccess("Payout request submitted successfully! Notifications dispatched to email.")
        // Refresh local ledger state
        const refResult = await getVendorLedger(vendorId)
        if (refResult.success && refResult.ledger && refResult.payouts && refResult.metrics) {
          setLedger(refResult.ledger)
          setPayouts(refResult.payouts)
          setMetrics(refResult.metrics)
        }
      } else {
        setError(res.error || "Failed to submit payout request.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const hasPendingPayout = payouts.some(p => p.status === "pending" || p.status === "processing")

  return (
    <div className="space-y-8">
      
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Unpaid Balance Card */}
        <Card className="relative overflow-hidden border-primary/20 bg-primary/[0.02] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary">
              Eligible Balance
            </CardTitle>
            <span className="rounded-full bg-primary/10 p-1.5 text-primary">
              <DollarSign className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${ledger.unpaidBalance.toFixed(2)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ready for release (Excludes 7-day hold)
            </p>
          </CardContent>
        </Card>

        {/* Gross Revenue Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gross Sales
            </CardTitle>
            <span className="rounded-full bg-muted p-1.5 text-muted-foreground">
              <ArrowUpRight className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${ledger.grossRevenue.toFixed(2)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              From {ledger.totalSales} successful delivered orders
            </p>
          </CardContent>
        </Card>

        {/* Commission Deducted Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Commission ({ledger.commissionRate.toFixed(0)}%)
            </CardTitle>
            <span className="rounded-full bg-red-50 p-1.5 text-red-600">
              <Percent className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">-${ledger.platformCommission.toFixed(2)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Platform processing fee deduction
            </p>
          </CardContent>
        </Card>

        {/* Refunds Deducted Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Refunds Deducted
            </CardTitle>
            <span className="rounded-full bg-red-50 p-1.5 text-red-600">
              <RotateCcw className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">-${ledger.refundsDeducted.toFixed(2)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Debited from returns &amp; cancellations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Banner & Performance Metrics Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Payout Request Panel */}
        <Card className="lg:col-span-2 shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Request Settlement</CardTitle>
            <CardDescription>
              Submit a settlement request for your outstanding eligible store balance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Hold Policy Notice */}
            <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-4 text-sm text-amber-700 leading-normal flex items-start gap-3">
              <AlertCircle className="size-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-800">7-Day Payout Hold Period:</span>
                <p className="mt-1 text-xs text-amber-700/90 leading-relaxed">
                  Orders are eligible for payout only after status is <strong>delivered</strong> for more than <strong>7 days</strong>, provided they are not returned or refunded. This ensures protection against refunds and returns windows.
                </p>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-muted/40 rounded-2xl p-4 border border-border text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outstanding Gross (Delivered &gt; 7 Days):</span>
                <span className="font-semibold text-foreground">${ledger.eligibleGross.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Commission override ({ledger.commissionRate}%):</span>
                <span className="font-semibold text-destructive">-${ledger.eligibleCommission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outstanding Refunds Deductions:</span>
                <span className="font-semibold text-destructive">-${ledger.eligibleRefunds.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-3 mt-3 flex justify-between text-base font-bold">
                <span>Net Eligible payout:</span>
                <span className="text-primary">${ledger.unpaidBalance.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive leading-normal">
                {error}
              </div>
            )}
            
            {success && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700 leading-normal">
                {success}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                onClick={handleRequestPayout}
                disabled={loading || ledger.unpaidBalance <= 0 || hasPendingPayout}
                className="h-11 px-6 shadow-md shadow-primary/10"
              >
                {loading ? "Submitting..." : hasPendingPayout ? "Payout In Progress" : `Request Payout ($${ledger.unpaidBalance.toFixed(2)})`}
              </Button>
              {hasPendingPayout && (
                <p className="text-xs text-muted-foreground max-w-[280px]">
                  You have a pending or processing payout request. Please wait until it completes before requesting another.
                </p>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Performance Metrics Card (Module 20 Groundwork) */}
        <Card className="shadow-sm border border-border h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Award className="size-5 text-primary" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Groundwork metrics for store performance score (Module 20).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            
            {/* Metric 1 */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground">Successful Orders</span>
                <p className="text-xs text-muted-foreground">Orders successfully delivered</p>
              </div>
              <span className="text-xl font-extrabold text-emerald-600">{metrics.successfulOrdersCount}</span>
            </div>

            {/* Metric 2 */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground">Refunded Orders</span>
                <p className="text-xs text-muted-foreground">Orders returned/refunded</p>
              </div>
              <span className={cn("text-xl font-extrabold", metrics.refundedOrdersCount > 0 ? "text-amber-600" : "text-muted-foreground")}>
                {metrics.refundedOrdersCount}
              </span>
            </div>

            {/* Metric 3 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground">Payout Success Rate</span>
                <p className="text-xs text-muted-foreground">Paid vs requested payouts</p>
              </div>
              <span className="text-xl font-extrabold text-primary">{metrics.payoutSuccessRate}%</span>
            </div>

            <div className="rounded-2xl bg-primary/5 border border-primary/10 p-3 text-[11px] text-primary flex items-center gap-1.5 mt-2">
              <Sparkles className="size-3.5 shrink-0" />
              <span>Higher success rates and lower refunds increase your seller rating score!</span>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* Payout History Table */}
      <Card className="shadow-sm border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Settlement History</CardTitle>
          <CardDescription>
            Audit log of past payout transfers and requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-y border-border">
                <tr>
                  <th className="px-6 py-3">Initiated Date</th>
                  <th className="px-6 py-3">Transaction ID / Reference</th>
                  <th className="px-6 py-3">Net Amount</th>
                  <th className="px-6 py-3">Fees &amp; Deductions</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                      No payout records found.
                    </td>
                  </tr>
                ) : (
                  payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                        {p.transactionId || "Pending"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-foreground">
                        ${parseFloat(p.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                        Commission: ${parseFloat(p.commissionAmount).toFixed(2)} | Refunds: ${parseFloat(p.refundAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">
                        {p.remarks || "No remarks"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

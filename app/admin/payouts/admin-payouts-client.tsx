"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  FileCheck, 
  Coins, 
  XOctagon, 
  Check, 
  FileText 
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePayoutStatusAction, getAdminPayouts } from "@/app/actions/payouts"
import { cn } from "@/lib/utils"

interface AdminPayout {
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
  vendorName: string | null
  vendorEmail: string | null
}

interface ClientProps {
  initialPayouts: AdminPayout[]
}

const ease = [0.22, 1, 0.36, 1] as const

export function AdminPayoutsClient({ initialPayouts }: ClientProps) {
  const [payouts, setPayouts] = useState<AdminPayout[]>(initialPayouts)
  const [searchTerm, setSearchTerm] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Modal State
  const [selectedPayout, setSelectedPayout] = useState<AdminPayout | null>(null)
  const [modalAction, setModalAction] = useState<"approve" | "reject" | "pay" | null>(null)
  const [utrInput, setUtrInput] = useState("")
  const [remarksInput, setRemarksInput] = useState("")

  const handleRefresh = async () => {
    const res = await getAdminPayouts()
    if (res.success && res.payouts) {
      setPayouts(res.payouts)
    }
  }

  const handleActionSubmit = async () => {
    if (!selectedPayout || !modalAction) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    let nextStatus: "pending" | "processing" | "paid" | "failed" = "pending"
    if (modalAction === "approve") nextStatus = "processing"
    if (modalAction === "pay") nextStatus = "paid"
    if (modalAction === "reject") {
      nextStatus = "failed"
      if (!remarksInput.trim()) {
        setError("Rejection reason is mandatory.")
        setLoading(false)
        return
      }
    }

    try {
      const res = await updatePayoutStatusAction(
        selectedPayout.id,
        nextStatus,
        utrInput.trim() || undefined,
        remarksInput.trim() || undefined
      )

      if (res.success) {
        setSuccess(`Payout status updated to ${nextStatus.toUpperCase()} successfully.`)
        setSelectedPayout(null)
        setModalAction(null)
        setUtrInput("")
        setRemarksInput("")
        await handleRefresh()
      } else {
        setError(res.error || "Failed to update payout status.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  // Filter payouts based on vendor search
  const filteredPayouts = payouts.filter((p) => {
    const name = p.vendorName?.toLowerCase() || ""
    const email = p.vendorEmail?.toLowerCase() || ""
    const val = searchTerm.toLowerCase()
    return name.includes(val) || email.includes(val) || p.transactionId?.toLowerCase().includes(val)
  })

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

  return (
    <div className="space-y-8">
      
      {/* Alert logs */}
      {success && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700 leading-normal">
          {success}
        </div>
      )}

      {/* Admin stats widgets */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Requested settlements
            </CardTitle>
            <span className="rounded-full bg-primary/10 p-1.5 text-primary">
              <FileText className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payouts.length} requests</div>
            <p className="mt-1 text-xs text-muted-foreground">Historical settlement logs count</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/20 bg-primary/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary">
              Pending Settlements
            </CardTitle>
            <span className="rounded-full bg-amber-50 p-1.5 text-amber-600 border border-amber-100">
              <Clock className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              ${payouts
                .filter(p => p.status === "pending" || p.status === "processing")
                .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                .toFixed(2)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {payouts.filter(p => p.status === "pending" || p.status === "processing").length} pending admin release
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completed payouts
            </CardTitle>
            <span className="rounded-full bg-emerald-50 p-1.5 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${payouts
                .filter(p => p.status === "paid")
                .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                .toFixed(2)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Total platform payouts disbursed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table Card */}
      <Card className="shadow-sm border border-border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Payout Settlements Ledger</CardTitle>
            <CardDescription>Auditable record of multi-vendor payment requests.</CardDescription>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vendor or UTR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-y border-border">
                <tr>
                  <th className="px-6 py-3">Vendor / Store</th>
                  <th className="px-6 py-3">Requested Date</th>
                  <th className="px-6 py-3">Transaction ID / UTR</th>
                  <th className="px-6 py-3">Net payout</th>
                  <th className="px-6 py-3">Fees &amp; Deductions</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                      No payout requests match filters.
                    </td>
                  </tr>
                ) : (
                  filteredPayouts.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{p.vendorName}</div>
                        <div className="text-xs text-muted-foreground">{p.vendorEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-foreground">
                        {p.transactionId || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-foreground">
                        ${parseFloat(p.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                        Commission: ${parseFloat(p.commissionAmount).toFixed(2)}<br/>
                        Refunds: ${parseFloat(p.refundAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        {p.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPayout(p)
                                setModalAction("approve")
                              }}
                              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPayout(p)
                                setModalAction("reject")
                              }}
                              className="h-8 text-xs border-destructive text-destructive hover:bg-destructive/5"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {p.status === "processing" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPayout(p)
                              setModalAction("pay")
                            }}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Mark Paid
                          </Button>
                        )}
                        {p.status === "paid" && (
                          <span className="text-xs font-semibold text-emerald-600">Settled</span>
                        )}
                        {p.status === "failed" && (
                          <span className="text-xs font-semibold text-destructive">Rejected</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog / Modal Overlay */}
      <AnimatePresence>
        {selectedPayout && modalAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease }}
              className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-6"
            >
              
              {/* Header */}
              <div className="text-center space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Payout Request ID #{selectedPayout.id}
                </span>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {modalAction === "approve" && "Approve Payout Settlement"}
                  {modalAction === "reject" && "Reject Payout Settlement"}
                  {modalAction === "pay" && "Confirm Funds Disbursed"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Vendor: {selectedPayout.vendorName} ({selectedPayout.vendorEmail})
                </p>
              </div>

              {/* Payout Details */}
              <div className="bg-muted/40 rounded-2xl p-4 border border-border text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Net Settlement Amount</span>
                  <span className="font-bold text-foreground">${parseFloat(selectedPayout.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Commission Fee</span>
                  <span className="font-semibold text-destructive">-${parseFloat(selectedPayout.commissionAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Refund Deductions</span>
                  <span className="font-semibold text-destructive">-${parseFloat(selectedPayout.refundAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* Action Fields Form */}
              <div className="space-y-4">
                {modalAction === "pay" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="utr">Bank Transaction ID / UTR Code</Label>
                    <Input
                      id="utr"
                      placeholder="e.g. UTR-98216317"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value)}
                      className="h-10 border-border"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="remarks">
                    {modalAction === "reject" ? "Reason for Rejection (Mandatory)" : "Remarks / Internal Notes"}
                  </Label>
                  <Input
                    id="remarks"
                    placeholder={modalAction === "reject" ? "e.g. Verification details mismatched." : "e.g. Approved for release."}
                    value={remarksInput}
                    onChange={(e) => setRemarksInput(e.target.value)}
                    className="h-10 border-border"
                    required={modalAction === "reject"}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive leading-normal">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleActionSubmit}
                  disabled={loading}
                  className={cn(
                    "w-full h-11 font-semibold text-white shadow-lg",
                    modalAction === "reject" ? "bg-destructive hover:bg-destructive/95" : "bg-primary hover:bg-primary/95"
                  )}
                >
                  {loading ? "Processing..." : modalAction === "approve" ? "Approve Settlement" : modalAction === "pay" ? "Mark Paid" : "Reject Settlement"}
                </Button>
                <Button
                  onClick={() => {
                    setSelectedPayout(null)
                    setModalAction(null)
                    setUtrInput("")
                    setRemarksInput("")
                    setError(null)
                  }}
                  disabled={loading}
                  variant="ghost"
                  className="w-full h-11 text-muted-foreground hover:text-foreground"
                >
                  Cancel &amp; Close
                </Button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

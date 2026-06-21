"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Truck,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { updateShipmentStatus, getShipmentEvents } from "@/app/actions/logistics"
import { cn } from "@/lib/utils"

interface Shipment {
  id: number
  orderId: string
  vendorId: string
  courierPartner: string
  trackingNumber: string
  status: string
  estimatedDelivery: Date | null
  actualDelivery: Date | null
  currentLocation: string | null
  remarks: string | null
  createdAt: Date
  updatedAt: Date
}

interface Event {
  id: number
  shipmentId: number
  status: string
  location: string | null
  remarks: string | null
  timestamp: Date
}

interface Stats {
  active: number
  delayed: number
  delivered: number
}

interface ClientProps {
  initialShipments: Shipment[]
  initialStats: Stats
}

const ease = [0.22, 1, 0.36, 1] as const

const STATUS_FLOW = ["confirmed", "courier_assigned", "picked_up", "in_transit", "out_for_delivery", "delivered"] as const

export function VendorLogisticsClient({ initialShipments, initialStats }: ClientProps) {
  const [shipments, setShipments] = useState<Shipment[]>(initialShipments)
  const [stats, setStats] = useState<Stats>(initialStats)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Modal state for status update
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")
  const [locationInput, setLocationInput] = useState("")
  const [remarksInput, setRemarksInput] = useState("")
  const [expandedShipment, setExpandedShipment] = useState<number | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/logistics/vendor-shipments")
      if (res.ok) {
        const data = await res.json()
        setShipments(data.shipments || [])
        setStats(data.stats || { active: 0, delayed: 0, delivered: 0 })
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedShipment || !newStatus) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await updateShipmentStatus(selectedShipment.id, newStatus as any, locationInput || undefined, remarksInput || undefined)
      if (res.success) {
        setSuccess(`Shipment status updated to ${newStatus.replace(/_/g, " ")}.`)
        setSelectedShipment(null)
        setNewStatus("")
        setLocationInput("")
        setRemarksInput("")
        await handleRefresh()
      } else {
        setError(res.error || "Failed to update shipment status.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleExpand = async (shipmentId: number) => {
    if (expandedShipment === shipmentId) {
      setExpandedShipment(null)
      return
    }

    setExpandedShipment(shipmentId)
    setLoadingEvents(true)
    try {
      const res = await getShipmentEvents(shipmentId)
      if (res.success) {
        setEvents(res.events || [])
      }
    } catch {
      // silent
    } finally {
      setLoadingEvents(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === "delivered") {
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">Delivered</Badge>
    }
    if (s === "in_transit") {
      return <Badge className="bg-blue-50 text-blue-700 border-blue-100">In Transit</Badge>
    }
    if (s === "out_for_delivery") {
      return <Badge className="bg-purple-50 text-purple-700 border-purple-100 animate-pulse">Out for Delivery</Badge>
    }
    if (s === "picked_up") {
      return <Badge className="bg-amber-50 text-amber-700 border-amber-100">Picked Up</Badge>
    }
    if (s === "courier_assigned") {
      return <Badge className="bg-cyan-50 text-cyan-700 border-cyan-100">Courier Assigned</Badge>
    }
    return <Badge className="bg-gray-50 text-gray-700 border-gray-100">Confirmed</Badge>
  }

  const isDelayed = (shipment: Shipment) => {
    if (!shipment.estimatedDelivery) return false
    if (shipment.status === "delivered") return false
    return new Date() > shipment.estimatedDelivery
  }

  const getNextStatus = (current: string) => {
    const idx = STATUS_FLOW.indexOf(current as any)
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1]
    return null
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700">{success}</div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Shipments</CardTitle>
            <span className="rounded-full bg-blue-50 p-1.5 text-blue-600"><Truck className="size-4" /></span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="mt-1 text-xs text-muted-foreground">Currently in transit</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-amber-200 bg-amber-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-700">Delayed</CardTitle>
            <span className="rounded-full bg-amber-100 p-1.5 text-amber-600"><AlertTriangle className="size-4" /></span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{stats.delayed}</div>
            <p className="mt-1 text-xs text-muted-foreground">Past estimated delivery</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivered</CardTitle>
            <span className="rounded-full bg-emerald-50 p-1.5 text-emerald-600"><CheckCircle2 className="size-4" /></span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.delivered}</div>
            <p className="mt-1 text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Shipments Table */}
      <Card className="shadow-sm border border-border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Shipment Ledger</CardTitle>
            <CardDescription>All shipments for your store orders.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={loading} className="h-9 gap-1.5">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-y border-border">
                <tr>
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Tracking</th>
                  <th className="px-6 py-3">Courier</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">ETA</th>
                  <th className="px-6 py-3">Delay</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shipments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">No shipments found.</td>
                  </tr>
                ) : (
                  shipments.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-medium">{s.orderId}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">{s.trackingNumber}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(s.trackingNumber)}
                          >
                            <Copy className="size-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4">{s.courierPartner}</td>
                      <td className="px-6 py-4">{getStatusBadge(s.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                        {s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        {isDelayed(s) ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <AlertTriangle className="size-3" /> Delayed
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">On Track</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExpand(s.id)}
                          className="h-8 text-xs"
                        >
                          {expandedShipment === s.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </Button>
                        {getNextStatus(s.status) && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedShipment(s)
                              setNewStatus(getNextStatus(s.status)!)
                            }}
                            className="h-8 text-xs bg-primary hover:bg-primary/90 text-white"
                          >
                            Advance
                          </Button>
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

      {/* Expanded Timeline */}
      {expandedShipment && (
        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold">Shipment Timeline</CardTitle>
            <CardDescription>Event history for shipment #{expandedShipment}</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <p className="text-sm text-muted-foreground">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {events.map((evt, idx) => (
                  <div key={evt.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="size-3 rounded-full bg-primary" />
                      {idx < events.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold capitalize">{evt.status.replace(/_/g, " ")}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {evt.location && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="size-3" /> {evt.location}
                        </p>
                      )}
                      {evt.remarks && <p className="text-xs text-muted-foreground mt-0.5">{evt.remarks}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Update Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-6"
          >
            <div className="text-center space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Shipment #{selectedShipment.id}
              </span>
              <h3 className="text-xl font-bold tracking-tight">Update Shipment Status</h3>
              <p className="text-xs text-muted-foreground">
                Tracking: {selectedShipment.trackingNumber}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                >
                  {STATUS_FLOW.map((s) => (
                    <option key={s} value={s} disabled={s === selectedShipment.status}>
                      {s.replace(/_/g, " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Location (optional)</label>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g. Mumbai Hub"
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Remarks (optional)</label>
                <input
                  type="text"
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  placeholder="e.g. Handed over to delivery partner"
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-col gap-3">
              <Button onClick={handleStatusUpdate} disabled={loading || !newStatus} className="w-full h-11 font-semibold text-white">
                {loading ? "Updating..." : "Update Status"}
              </Button>
              <Button
                onClick={() => {
                  setSelectedShipment(null)
                  setNewStatus("")
                  setLocationInput("")
                  setRemarksInput("")
                  setError(null)
                }}
                disabled={loading}
                variant="ghost"
                className="w-full h-11 text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
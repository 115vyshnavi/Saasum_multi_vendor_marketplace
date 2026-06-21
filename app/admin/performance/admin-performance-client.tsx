"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  Star,
  Package,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  AlertCircle,
  Search,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface VendorMetric {
  id: string
  name: string
  email: string
  storeName: string
  approvalStatus: string
  fulfillmentRate: number
  returnRate: number
  cancellationRate: number
  payoutSuccessRate: number
  deliverySLA: number
  vendorScore: number
  totalOrders: number
  alerts: string[]
  isLowPerformer: boolean
}

interface ClientProps {
  initialVendors: VendorMetric[]
}

const ease = [0.22, 1, 0.36, 1] as const

export function AdminPerformanceClient({ initialVendors }: ClientProps) {
  const [vendors] = useState(initialVendors)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200"
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200"
    return "text-rose-600 bg-rose-50 border-rose-200"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Needs Improvement"
  }

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0) return <ArrowUp className="size-3 text-emerald-600" />
    if (value < 0) return <ArrowDown className="size-3 text-rose-600" />
    return <Minus className="size-3 text-muted-foreground" />
  }

  const TrendColor = ({ value }: { value: number }) => {
    if (value > 0) return "text-emerald-600"
    if (value < 0) return "text-rose-600"
    return "text-muted-foreground"
  }

  const filteredVendors = vendors.filter((v) => {
    const term = searchTerm.toLowerCase()
    return (
      v.name.toLowerCase().includes(term) ||
      v.email.toLowerCase().includes(term) ||
      v.storeName.toLowerCase().includes(term)
    )
  })

  const lowPerformers = vendors.filter(v => v.isLowPerformer)
  const topPerformers = [...vendors].sort((a, b) => b.vendorScore - a.vendorScore).slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Alerts Section */}
      {lowPerformers.length > 0 && (
        <Card className="shadow-sm border border-rose-200 bg-rose-50/50">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-rose-800">
              <AlertTriangle className="size-4" />
              Low Performing Vendors Alert
            </CardTitle>
            <CardDescription className="text-rose-700">Vendors requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowPerformers.map((vendor) => (
                <div key={vendor.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-rose-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{vendor.storeName}</p>
                      <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-xs">Score: {vendor.vendorScore}/100</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {vendor.alerts.map((alert, idx) => (
                        <span key={idx} className="text-xs text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          {alert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card className="shadow-sm border border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold">Vendor Leaderboard</CardTitle>
              <CardDescription>All vendors ranked by performance score</CardDescription>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-y border-border">
                <tr>
                  <th className="px-6 py-3">Rank</th>
                  <th className="px-6 py-3">Vendor</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Fulfillment</th>
                  <th className="px-6 py-3">Return Rate</th>
                  <th className="px-6 py-3">Delivery SLA</th>
                  <th className="px-6 py-3">Orders</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">No vendors found</td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor, idx) => (
                    <tr key={vendor.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {idx < 3 ? (
                            <span className={cn(
                              "size-8 rounded-full flex items-center justify-center text-xs font-bold",
                              idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-slate-200 text-slate-700" : "bg-orange-100 text-orange-700"
                            )}>
                              {idx + 1}
                            </span>
                          ) : (
                            <span className="size-8 rounded-full flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground">
                              {idx + 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-sm">{vendor.storeName}</p>
                          <p className="text-xs text-muted-foreground">{vendor.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-lg font-bold", getScoreColor(vendor.vendorScore).split(" ")[0])}>
                            {vendor.vendorScore}
                          </span>
                          <Badge className={cn("text-xs", getScoreColor(vendor.vendorScore))}>
                            {getScoreLabel(vendor.vendorScore)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium">{vendor.fulfillmentRate}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("text-sm font-medium", vendor.returnRate > 20 ? "text-rose-600" : "text-foreground")}>
                          {vendor.returnRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("text-sm font-medium", vendor.deliverySLA < 75 ? "text-rose-600" : "text-foreground")}>
                          {vendor.deliverySLA}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{vendor.totalOrders}</span>
                      </td>
                      <td className="px-6 py-4">
                        {vendor.isLowPerformer ? (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200">At Risk</Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">Healthy</Badge>
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

      {/* Top Performers */}
      <Card className="shadow-sm border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Award className="size-5 text-amber-500" />
            Top 5 Performers
          </CardTitle>
          <CardDescription>Best performing vendors this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {topPerformers.map((vendor, idx) => (
              <div key={vendor.id} className="p-4 rounded-xl border border-border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                  {idx < 3 ? (
                    <span className={cn(
                      "size-6 rounded-full flex items-center justify-center text-xs font-bold",
                      idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-slate-200 text-slate-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {idx + 1}
                    </span>
                  ) : (
                    <span className="size-6 rounded-full flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground">
                      {idx + 1}
                    </span>
                  )}
                  <p className="font-semibold text-sm truncate">{vendor.storeName}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Score</span>
                    <span className={cn("text-sm font-bold", getScoreColor(vendor.vendorScore).split(" ")[0])}>
                      {vendor.vendorScore}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Fulfillment</span>
                    <span className="text-xs font-medium">{vendor.fulfillmentRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Return Rate</span>
                    <span className="text-xs font-medium">{vendor.returnRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
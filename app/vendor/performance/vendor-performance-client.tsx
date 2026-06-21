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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface Product {
  productId: string
  productName: string
  productImage: string | null
  totalQty: number
  totalRevenue: number
  returnCount?: number
  id?: string
  name?: string
  stock?: number
}

interface Metrics {
  fulfillmentRate: number
  returnRate: number
  cancellationRate: number
  payoutSuccessRate: number
  deliverySLA: number
  vendorScore: number
  totalOrders: number
  deliveredOrders: number
  returnedOrders: number
  cancelledOrders: number
  avgDeliveryTime: number
  customerRating: number
}

interface Trend {
  fulfillmentRate: number
  returnRate: number
  deliverySLA: number
  vendorScore: number
}

interface PerformanceData {
  success: boolean
  metrics: Metrics
  topProducts: {
    bestSelling: Product[]
    highestRevenue: Product[]
    mostReturned: Product[]
  }
  productRisk: {
    lowStockBestSellers: Product[]
    fastMovingProducts: Product[]
  }
  alerts: string[]
  trend: Trend
}

interface ClientProps {
  initialData: PerformanceData
}

const ease = [0.22, 1, 0.36, 1] as const

export function VendorPerformanceClient({ initialData }: ClientProps) {
  const [data] = useState(initialData)
  const [loading, setLoading] = useState(false)

  const { metrics, topProducts, productRisk, alerts, trend } = data

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

  return (
    <div className="space-y-8">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <AlertTriangle className="size-5 text-amber-600 shrink-0" />
              <p className="text-sm font-medium text-amber-800">{alert}</p>
            </div>
          ))}
        </div>
      )}

      {/* Score & KPIs */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Vendor Score Badge */}
        <Card className="shadow-sm border border-border lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Vendor Score</CardTitle>
            <CardDescription>Overall performance rating</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className={cn("size-32 rounded-full border-4 flex items-center justify-center", getScoreColor(metrics.vendorScore))}>
              <div className="text-center">
                <span className="text-4xl font-extrabold">{metrics.vendorScore}</span>
                <span className="text-lg font-semibold">/100</span>
              </div>
            </div>
            <Badge className={cn("mt-4 px-3 py-1 rounded-full text-xs font-bold", getScoreColor(metrics.vendorScore))}>
              {getScoreLabel(metrics.vendorScore)}
            </Badge>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <TrendIcon value={trend.vendorScore} />
              <span className={TrendColor({ value: trend.vendorScore })}>
                {trend.vendorScore > 0 ? "+" : ""}{trend.vendorScore} vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fulfillment Rate</CardTitle>
              <CheckCircle2 className="size-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.fulfillmentRate}%</div>
              <p className="mt-1 text-xs text-muted-foreground">{metrics.deliveredOrders} / {metrics.totalOrders} orders</p>
              <div className="mt-2 flex items-center gap-1 text-xs">
                <TrendIcon value={trend.fulfillmentRate} />
                <span className={TrendColor({ value: trend.fulfillmentRate })}>
                  {trend.fulfillmentRate > 0 ? "+" : ""}{trend.fulfillmentRate}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Return Rate</CardTitle>
              <RefreshCw className="size-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.returnRate}%</div>
              <p className="mt-1 text-xs text-muted-foreground">{metrics.returnedOrders} returned</p>
              <div className="mt-2 flex items-center gap-1 text-xs">
                <TrendIcon value={-trend.returnRate} />
                <span className={TrendColor({ value: -trend.returnRate })}>
                  {trend.returnRate > 0 ? "+" : ""}{trend.returnRate}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery SLA</CardTitle>
              <Truck className="size-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.deliverySLA}%</div>
              <p className="mt-1 text-xs text-muted-foreground">On-time delivery</p>
              <div className="mt-2 flex items-center gap-1 text-xs">
                <TrendIcon value={trend.deliverySLA} />
                <span className={TrendColor({ value: trend.deliverySLA })}>
                  {trend.deliverySLA > 0 ? "+" : ""}{trend.deliverySLA}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer Rating</CardTitle>
              <Star className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.customerRating}</div>
              <p className="mt-1 text-xs text-muted-foreground">Weighted average</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                Avg delivery: {metrics.avgDeliveryTime} days
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Products */}
      <Card className="shadow-sm border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Top Products Analytics</CardTitle>
          <CardDescription>Best sellers, revenue leaders, and return risks</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="best-selling" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="best-selling">Best Selling</TabsTrigger>
              <TabsTrigger value="highest-revenue">Highest Revenue</TabsTrigger>
              <TabsTrigger value="most-returned">Most Returned</TabsTrigger>
            </TabsList>
            <TabsContent value="best-selling" className="mt-4">
              <ProductTable products={topProducts.bestSelling} type="quantity" />
            </TabsContent>
            <TabsContent value="highest-revenue" className="mt-4">
              <ProductTable products={topProducts.highestRevenue} type="revenue" />
            </TabsContent>
            <TabsContent value="most-returned" className="mt-4">
              <ProductTable products={topProducts.mostReturned} type="returns" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Product Risk Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-600" />
              Low Stock Best Sellers
            </CardTitle>
            <CardDescription>High demand products running low</CardDescription>
          </CardHeader>
          <CardContent>
            {productRisk.lowStockBestSellers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No low stock products</p>
            ) : (
              <div className="space-y-3">
                {productRisk.lowStockBestSellers.map((p) => (
                  <div key={p.productId} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-secondary border border-border flex items-center justify-center">
                        <Package className="size-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{p.productName}</p>
                        <p className="text-xs text-muted-foreground">Stock: {p.stock ?? 0} units</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{p.totalQty} sold</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              Fast Moving Products
            </CardTitle>
            <CardDescription>Top revenue generators</CardDescription>
          </CardHeader>
          <CardContent>
            {productRisk.fastMovingProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No sales data yet</p>
            ) : (
              <div className="space-y-3">
                {productRisk.fastMovingProducts.map((p) => (
                  <div key={p.productId} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-secondary border border-border flex items-center justify-center">
                        <Package className="size-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{p.productName}</p>
                        <p className="text-xs text-muted-foreground">Stock: {p.stock ?? 0} units</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-xs">
                      ${parseFloat(p.totalRevenue as any).toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProductTable({ products, type }: { products: Product[]; type: "quantity" | "revenue" | "returns" }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-y border-border">
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3 text-right">{type === "quantity" ? "Qty Sold" : type === "revenue" ? "Revenue" : "Returns"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">No data available</td>
            </tr>
          ) : (
            products.map((p) => (
              <tr key={p.productId} className="hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-secondary border border-border">
                      {p.productImage && (
                        <img src={p.productImage} alt={p.productName} className="size-full object-cover" />
                      )}
                    </div>
                    <span className="font-medium truncate max-w-[200px]">{p.productName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {type === "revenue" ? `$${parseFloat(p.totalRevenue as any).toFixed(2)}` : type === "returns" ? `${p.returnCount || 0}` : `${p.totalQty}`}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
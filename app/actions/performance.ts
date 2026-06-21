"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  orders as ordersTable,
  orderItems as orderItemsTable,
  products as productsTable,
  user as userTable,
  returns as returnsTable,
  payouts as payoutsTable,
  shipments as shipmentsTable,
  vendorProfiles as vendorProfilesTable,
} from "@/lib/db/schema"
import { eq, and, desc, sql, inArray, ne, gte, lte, sum, count, avg, sql as drizzleSql } from "drizzle-orm"
import { headers } from "next/headers"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getUserId() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    return session?.user?.id || null
  } catch {
    return null
  }
}

function getDateRange(days: number) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - days)
  return { start, end: now }
}

// ---------------------------------------------------------------------------
// 1. Vendor Performance Metrics
// ---------------------------------------------------------------------------

export async function getVendorPerformance() {
  const userId = await getUserId()
  if (!userId) return { success: false, error: "Unauthorized" }

  try {
    const now = new Date()
    const currentPeriod = getDateRange(30)
    const previousPeriod = getDateRange(60)

    // Total orders for this vendor
    const vendorItems = await db.select().from(orderItemsTable).where(eq(orderItemsTable.vendorId, userId))
    const orderIds = Array.from(new Set(vendorItems.map(i => i.orderId)))

    if (orderIds.length === 0) {
      return {
        success: true,
        metrics: {
          fulfillmentRate: 0,
          returnRate: 0,
          cancellationRate: 0,
          payoutSuccessRate: 0,
          deliverySLA: 0,
          vendorScore: 0,
          totalOrders: 0,
          deliveredOrders: 0,
          returnedOrders: 0,
          cancelledOrders: 0,
          avgDeliveryTime: 0,
          customerRating: 0,
        },
        topProducts: { bestSelling: [], highestRevenue: [], mostReturned: [] },
        alerts: [],
        trend: { fulfillmentRate: 0, returnRate: 0, deliverySLA: 0, vendorScore: 0 },
      }
    }

    const orders = await db.select().from(ordersTable).where(inArray(ordersTable.id, orderIds))

    // Current period orders
    const currentOrderIds = orders
      .filter(o => new Date(o.createdAt) >= currentPeriod.start)
      .map(o => o.id)
    const previousOrderIds = orders
      .filter(o => new Date(o.createdAt) >= previousPeriod.start && new Date(o.createdAt) < currentPeriod.start)
      .map(o => o.id)

    // Metrics calculations
    const totalOrders = orders.length
    const deliveredOrders = orders.filter(o => o.status === "delivered").length
    const returnedOrders = orders.filter(o => o.status === "returned").length
    const cancelledOrders = orders.filter(o => o.status === "cancelled").length

    const fulfillmentRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0
    const returnRate = deliveredOrders > 0 ? (returnedOrders / deliveredOrders) * 100 : 0
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0

    // Delivery SLA - on-time delivery rate
    const deliveredWithShipments = await db
      .select({
        orderId: shipmentsTable.orderId,
        estimatedDelivery: shipmentsTable.estimatedDelivery,
        actualDelivery: shipmentsTable.actualDelivery,
      })
      .from(shipmentsTable)
      .where(and(
        inArray(shipmentsTable.orderId, orderIds),
        eq(shipmentsTable.status, "delivered")
      ))

    const onTimeDeliveries = deliveredWithShipments.filter(s =>
      s.estimatedDelivery && s.actualDelivery && new Date(s.actualDelivery) <= new Date(s.estimatedDelivery)
    ).length
    const deliverySLA = deliveredWithShipments.length > 0 ? (onTimeDeliveries / deliveredWithShipments.length) * 100 : 0

    // Average delivery time (days)
    const deliveryTimes: number[] = []
    for (const s of deliveredWithShipments) {
      if (s.estimatedDelivery && s.actualDelivery) {
        const actualDate = new Date(s.actualDelivery)
        const estimatedDate = new Date(s.estimatedDelivery)
        const diff = actualDate.getTime() - estimatedDate.getTime()
        deliveryTimes.push(diff / (1000 * 60 * 60 * 24))
      }
    }
    const avgDeliveryTime = deliveryTimes.length > 0
      ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
      : 0

    // Customer rating - weighted average across vendor's products
    const vendorProducts = await db
      .select({ rating: productsTable.rating, reviewCount: productsTable.reviewCount })
      .from(productsTable)
      .where(eq(productsTable.vendorId, userId))

    const productsWithReviews = vendorProducts.filter(p => p.reviewCount > 0)
    let customerRating = 0
    if (productsWithReviews.length > 0) {
      const totalWeightedRating = productsWithReviews.reduce((sum, p) => {
        return sum + (parseFloat(p.rating) * p.reviewCount)
      }, 0)
      const totalReviews = productsWithReviews.reduce((sum, p) => sum + p.reviewCount, 0)
      customerRating = totalReviews > 0 ? totalWeightedRating / totalReviews : 0
    }

    // Payout success rate
    const vendorPayouts = await db.select().from(payoutsTable).where(eq(payoutsTable.vendorId, userId))
    const totalPayouts = vendorPayouts.length
    const paidPayouts = vendorPayouts.filter(p => p.status === "paid").length
    const payoutSuccessRate = totalPayouts > 0 ? (paidPayouts / totalPayouts) * 100 : 100

    // Vendor Score (100 points)
    // Fulfillment Rate = 30%, Return Rate = 20%, Customer Ratings = 20%, Payout Success = 15%, Delivery SLA = 15%
    const fulfillmentScore = fulfillmentRate * 0.30
    const returnScore = Math.max(0, (100 - returnRate)) * 0.20
    const ratingScore = Math.min(100, customerRating * 20) * 0.20
    const payoutScore = payoutSuccessRate * 0.15
    const slaScore = deliverySLA * 0.15
    const vendorScore = Math.round(fulfillmentScore + returnScore + ratingScore + payoutScore + slaScore)

    // Top Products Analytics
    const itemsWithProduct = await db
      .select({
        productId: orderItemsTable.productId,
        productName: orderItemsTable.productName,
        productImage: orderItemsTable.productImage,
        quantity: orderItemsTable.quantity,
        totalPrice: orderItemsTable.totalPrice,
        status: orderItemsTable.status,
      })
      .from(orderItemsTable)
      .where(inArray(orderItemsTable.orderId, orderIds))

    // Best selling (by quantity)
    const productSales = new Map<string, { productId: string; productName: string; productImage: string | null; totalQty: number; totalRevenue: number }>()
    itemsWithProduct.forEach(item => {
      const existing = productSales.get(item.productId) || { productId: item.productId, productName: item.productName, productImage: item.productImage, totalQty: 0, totalRevenue: 0 }
      existing.totalQty += item.quantity
      existing.totalRevenue += parseFloat(item.totalPrice)
      productSales.set(item.productId, existing)
    })

    const bestSelling = Array.from(productSales.values())
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5)

    const highestRevenue = Array.from(productSales.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5)

    // Most returned products
    const returnedOrderIds = orders.filter(o => o.status === "returned").map(o => o.id)
    const returnedItems = returnedOrderIds.length > 0
      ? await db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, returnedOrderIds))
      : []
    const returnCounts = new Map<string, number>()
    returnedItems.forEach(item => {
      returnCounts.set(item.productId, (returnCounts.get(item.productId) || 0) + 1)
    })
    const mostReturned = Array.from(productSales.values())
      .map(p => ({ ...p, returnCount: returnCounts.get(p.productId) || 0 }))
      .filter(p => p.returnCount > 0)
      .sort((a, b) => b.returnCount - a.returnCount)
      .slice(0, 5)

    // Product Risk Analytics
    const allProducts = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        stock: productsTable.stock,
        totalQty: sql<number>`COALESCE(SUM(${orderItemsTable.quantity}), 0)`,
        totalRevenue: sql<number>`COALESCE(SUM(${orderItemsTable.totalPrice}), 0)`,
      })
      .from(productsTable)
      .leftJoin(orderItemsTable, eq(productsTable.id, orderItemsTable.productId))
      .where(eq(productsTable.vendorId, userId))
      .groupBy(productsTable.id, productsTable.name, productsTable.stock)

    const lowStockBestSellers = allProducts
      .filter(p => p.stock < 10 && p.totalQty > 0)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5)

    const fastMovingProducts = allProducts
      .filter(p => p.totalQty > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5)

    // Alerts
    const alerts: string[] = []
    if (returnRate > 20) alerts.push(`High return rate: ${returnRate.toFixed(1)}% (threshold: 20%)`)
    if (cancellationRate > 15) alerts.push(`High cancellation rate: ${cancellationRate.toFixed(1)}% (threshold: 15%)`)
    if (fulfillmentRate < 80) alerts.push(`Low fulfillment rate: ${fulfillmentRate.toFixed(1)}% (threshold: 80%)`)
    if (vendorScore < 60) alerts.push(`Low vendor score: ${vendorScore}/100 (threshold: 60)`)
    if (deliverySLA < 75) alerts.push(`Low on-time delivery: ${deliverySLA.toFixed(1)}% (threshold: 75%)`)

    // Trend comparison (current 30 days vs previous 30 days)
    const currentMetrics = calculateMetricsForOrders(orders, currentPeriod.start, now)
    const previousMetrics = calculateMetricsForOrders(orders, previousPeriod.start, currentPeriod.start)

    const trend = {
      fulfillmentRate: currentMetrics.fulfillmentRate - previousMetrics.fulfillmentRate,
      returnRate: currentMetrics.returnRate - previousMetrics.returnRate,
      deliverySLA: currentMetrics.deliverySLA - previousMetrics.deliverySLA,
      vendorScore: currentMetrics.vendorScore - previousMetrics.vendorScore,
    }

    return {
      success: true,
      metrics: {
        fulfillmentRate: Math.round(fulfillmentRate * 10) / 10,
        returnRate: Math.round(returnRate * 10) / 10,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        payoutSuccessRate: Math.round(payoutSuccessRate * 10) / 10,
        deliverySLA: Math.round(deliverySLA * 10) / 10,
        vendorScore,
        totalOrders,
        deliveredOrders,
        returnedOrders,
        cancelledOrders,
        avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
        customerRating: Math.round(customerRating * 100) / 100,
      },
      topProducts: {
        bestSelling,
        highestRevenue,
        mostReturned,
      },
      productRisk: {
        lowStockBestSellers,
        fastMovingProducts,
      },
      alerts,
      trend: {
        fulfillmentRate: Math.round(trend.fulfillmentRate * 10) / 10,
        returnRate: Math.round(trend.returnRate * 10) / 10,
        deliverySLA: Math.round(trend.deliverySLA * 10) / 10,
        vendorScore: Math.round(trend.vendorScore),
      },
    }
  } catch (error: any) {
    console.error("Failed to fetch vendor performance:", error)
    return { success: false, error: error.message || "Failed to fetch performance metrics" }
  }
}

function calculateMetricsForOrders(orders: any[], start: Date, end: Date) {
  const filtered = orders.filter(o => new Date(o.createdAt) >= start && new Date(o.createdAt) < end)
  const total = filtered.length
  const delivered = filtered.filter(o => o.status === "delivered").length
  const returned = filtered.filter(o => o.status === "returned").length
  const cancelled = filtered.filter(o => o.status === "cancelled").length

  const fulfillmentRate = total > 0 ? (delivered / total) * 100 : 0
  const returnRate = delivered > 0 ? (returned / delivered) * 100 : 0
  const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0

  // Simplified score for trend
  const vendorScore = Math.round(fulfillmentRate * 0.3 + Math.max(0, (100 - returnRate)) * 0.2 + 50 * 0.2 + 100 * 0.15 + 80 * 0.15)

  return { fulfillmentRate, returnRate, deliverySLA: 80, vendorScore }
}

// ---------------------------------------------------------------------------
// 2. Admin Performance - All Vendors Leaderboard
// ---------------------------------------------------------------------------

export async function getAdminPerformance() {
  const userId = await getUserId()
  if (!userId) return { success: false, error: "Unauthorized" }

  const role = await db.select({ role: userTable.role }).from(userTable).where(eq(userTable.id, userId)).limit(1)
  if (role[0]?.role !== "admin") return { success: false, error: "Access Denied" }

  try {
    // Get all vendors
    const vendors = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        storeName: vendorProfilesTable.storeName,
        approvalStatus: vendorProfilesTable.approvalStatus,
      })
      .from(userTable)
      .innerJoin(vendorProfilesTable, eq(userTable.id, vendorProfilesTable.userId))
      .where(eq(userTable.role, "vendor"))

    const vendorMetrics = await Promise.all(
      vendors.map(async (vendor) => {
        const vendorItems = await db.select().from(orderItemsTable).where(eq(orderItemsTable.vendorId, vendor.id))
        const orderIds = Array.from(new Set(vendorItems.map(i => i.orderId)))

        if (orderIds.length === 0) {
          return {
            ...vendor,
            fulfillmentRate: 0,
            returnRate: 0,
            cancellationRate: 0,
            payoutSuccessRate: 100,
            deliverySLA: 0,
            vendorScore: 0,
            totalOrders: 0,
            alerts: ["No orders yet"],
            isLowPerformer: false,
          }
        }

        const orders = await db.select().from(ordersTable).where(inArray(ordersTable.id, orderIds))
        const totalOrders = orders.length
        const deliveredOrders = orders.filter(o => o.status === "delivered").length
        const returnedOrders = orders.filter(o => o.status === "returned").length
        const cancelledOrders = orders.filter(o => o.status === "cancelled").length

        const fulfillmentRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0
        const returnRate = deliveredOrders > 0 ? (returnedOrders / deliveredOrders) * 100 : 0
        const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0

        // Delivery SLA
        const deliveredWithShipments = await db
          .select({ estimatedDelivery: shipmentsTable.estimatedDelivery, actualDelivery: shipmentsTable.actualDelivery })
          .from(shipmentsTable)
          .where(and(inArray(shipmentsTable.orderId, orderIds), eq(shipmentsTable.status, "delivered")))

        const onTimeDeliveries = deliveredWithShipments.filter(s =>
          s.estimatedDelivery && s.actualDelivery && new Date(s.actualDelivery) <= new Date(s.estimatedDelivery)
        ).length
        const deliverySLA = deliveredWithShipments.length > 0 ? (onTimeDeliveries / deliveredWithShipments.length) * 100 : 0

        // Customer rating
        const vendorProducts = await db.select({ rating: productsTable.rating, reviewCount: productsTable.reviewCount }).from(productsTable).where(eq(productsTable.vendorId, vendor.id))
        const productsWithReviews = vendorProducts.filter(p => p.reviewCount > 0)
        let customerRating = 0
        if (productsWithReviews.length > 0) {
          const totalWeightedRating = productsWithReviews.reduce((sum, p) => sum + (parseFloat(p.rating) * p.reviewCount), 0)
          const totalReviews = productsWithReviews.reduce((sum, p) => sum + p.reviewCount, 0)
          customerRating = totalReviews > 0 ? totalWeightedRating / totalReviews : 0
        }

        // Payout success
        const vendorPayouts = await db.select().from(payoutsTable).where(eq(payoutsTable.vendorId, vendor.id))
        const totalPayouts = vendorPayouts.length
        const paidPayouts = vendorPayouts.filter(p => p.status === "paid").length
        const payoutSuccessRate = totalPayouts > 0 ? (paidPayouts / totalPayouts) * 100 : 100

        // Score
        const fulfillmentScore = fulfillmentRate * 0.30
        const returnScore = Math.max(0, (100 - returnRate)) * 0.20
        const ratingScore = Math.min(100, customerRating * 20) * 0.20
        const payoutScore = payoutSuccessRate * 0.15
        const slaScore = deliverySLA * 0.15
        const vendorScore = Math.round(fulfillmentScore + returnScore + ratingScore + payoutScore + slaScore)

        // Alerts
        const alerts: string[] = []
        if (returnRate > 20) alerts.push("High return rate")
        if (cancellationRate > 15) alerts.push("High cancellation rate")
        if (fulfillmentRate < 80) alerts.push("Low fulfillment rate")
        if (vendorScore < 60) alerts.push("Low vendor score")
        if (deliverySLA < 75) alerts.push("Low on-time delivery")

        return {
          ...vendor,
          fulfillmentRate: Math.round(fulfillmentRate * 10) / 10,
          returnRate: Math.round(returnRate * 10) / 10,
          cancellationRate: Math.round(cancellationRate * 10) / 10,
          payoutSuccessRate: Math.round(payoutSuccessRate * 10) / 10,
          deliverySLA: Math.round(deliverySLA * 10) / 10,
          vendorScore,
          totalOrders,
          alerts,
          isLowPerformer: vendorScore < 60 || returnRate > 20 || fulfillmentRate < 80,
        }
      })
    )

    // Sort by score descending
    vendorMetrics.sort((a, b) => b.vendorScore - a.vendorScore)

    return {
      success: true,
      vendors: vendorMetrics,
      summary: {
        totalVendors: vendors.length,
        lowPerformers: vendorMetrics.filter(v => v.isLowPerformer).length,
        avgScore: Math.round(vendorMetrics.reduce((sum, v) => sum + v.vendorScore, 0) / vendors.length),
      },
    }
  } catch (error: any) {
    console.error("Failed to fetch admin performance:", error)
    return { success: false, error: error.message || "Failed to fetch performance data" }
  }
}
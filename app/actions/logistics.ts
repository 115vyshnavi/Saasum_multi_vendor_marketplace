"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  shipments as shipmentsTable,
  shipmentEvents as shipmentEventsTable,
  orders as ordersTable,
  orderItems as orderItemsTable,
  user as userTable,
  vendorProfiles as vendorProfilesTable,
} from "@/lib/db/schema"
import { eq, and, desc, sql, inArray, ne } from "drizzle-orm"
import { headers } from "next/headers"
import { sendMail } from "@/lib/email"
import { sendTelegramNotification } from "@/lib/telegram"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COURIERS = ["Delhivery", "BlueDart", "Ekart", "DTDC"] as const
type Courier = (typeof COURIERS)[number]

function generateTrackingNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(100000 + Math.random() * 900000)
  return `TRK-${year}-${rand}`
}

function assignCourier(vendorPincode: string | null, orderTotal: number): Courier {
  // Metro pincodes (top cities - simplified heuristics)
  const metroPincodes = ["110001", "400001", "700001", "600001", "560001", "122001", "380001", "302001", "500001", "226001"]
  const isMetro = vendorPincode ? metroPincodes.some(p => vendorPincode.startsWith(p.slice(0, 3))) : false

  if (isMetro) return "Delhivery"
  if (orderTotal >= 5000) return "BlueDart"
  if (orderTotal >= 1000) return "Ekart"
  return "DTDC"
}

function calculateETA(courier: Courier, vendorPincode: string | null): Date {
  const now = new Date()
  const baseDays = vendorPincode
    ? ["110001", "400001", "700001", "600001", "560001"].some(p => vendorPincode.startsWith(p.slice(0, 3)))
      ? 2
      : ["122001", "380001", "302001", "500001", "226001"].some(p => vendorPincode.startsWith(p.slice(0, 3)))
        ? 4
        : 6
    : 5

  const courierModifier: Record<Courier, number> = {
    Delhivery: -1,
    BlueDart: -0.5,
    Ekart: 0,
    DTDC: 1,
  }

  const totalDays = Math.max(2, Math.round(baseDays + courierModifier[courier]))
  const eta = new Date(now)
  eta.setDate(eta.getDate() + totalDays)
  // Set to end of business day
  eta.setHours(18, 0, 0, 0)
  return eta
}

function isDelayed(estimatedDelivery: Date | null, status: string): boolean {
  if (!estimatedDelivery) return false
  if (status === "delivered") return false
  return new Date() > estimatedDelivery
}

async function getUserId() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    return session?.user?.id || null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// 1. Create shipment (called when order is confirmed)
// ---------------------------------------------------------------------------

export async function createShipment(orderId: string) {
  const userId = await getUserId()
  if (!userId) return { success: false, error: "Unauthorized" }

  try {
    // Fetch order with items
    const order = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1)
    if (!order[0]) return { success: false, error: "Order not found" }

    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId))

    // Get vendor info for first item (multi-vendor: one shipment per vendor)
    const vendorIds = Array.from(new Set(items.map(i => i.vendorId)))

    const createdShipments = []

    for (const vendorId of vendorIds) {
      // Check if shipment already exists for this order + vendor
      const existing = await db
        .select()
        .from(shipmentsTable)
        .where(and(eq(shipmentsTable.orderId, orderId), eq(shipmentsTable.vendorId, vendorId)))
        .limit(1)

      if (existing.length > 0) {
        createdShipments.push(existing[0])
        continue
      }

      // Get vendor pincode
      const vendorProfile = await db
        .select({ businessPincode: vendorProfilesTable.businessPincode })
        .from(vendorProfilesTable)
        .where(eq(vendorProfilesTable.userId, vendorId))
        .limit(1)

      const vendorPincode = vendorProfile[0]?.businessPincode || null
      const courier = assignCourier(vendorPincode, parseFloat(order[0].totalAmount))
      const trackingNumber = generateTrackingNumber()
      const estimatedDelivery = calculateETA(courier, vendorPincode)

      const [shipment] = await db
        .insert(shipmentsTable)
        .values({
          orderId,
          vendorId,
          courierPartner: courier,
          trackingNumber,
          status: "confirmed",
          estimatedDelivery,
        })
        .returning()

      // Create initial event
      await db.insert(shipmentEventsTable).values({
        shipmentId: shipment.id,
        status: "confirmed",
        location: vendorPincode || "Origin Facility",
        remarks: "Shipment created and confirmed by seller.",
      })

      createdShipments.push(shipment)

      // Notify vendor
      const vendorUser = await db.select({ email: userTable.email, name: userTable.name }).from(userTable).where(eq(userTable.id, vendorId)).limit(1)
      const vendorEmail = vendorUser[0]?.email
      const vendorName = vendorUser[0]?.name || "Seller"

      if (vendorEmail) {
        sendMail({
          to: vendorEmail,
          subject: `Shipment Confirmed [${trackingNumber}] | SaaSum IQMart`,
          html: `
            <h2 style="color: #1e3a8a;">Shipment Confirmed</h2>
            <p>Hello ${vendorName},</p>
            <p>Your shipment for order <strong>${orderId}</strong> has been confirmed.</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p><strong>Tracking Number:</strong> <code>${trackingNumber}</code></p>
              <p><strong>Courier Partner:</strong> ${courier}</p>
              <p><strong>Estimated Delivery:</strong> ${estimatedDelivery.toLocaleDateString()}</p>
            </div>
            <p>Please prepare the package for pickup.</p>
          `,
        }).catch(err => console.error("Shipment email failed:", err))
      }

      sendTelegramNotification(
        `[SHIPMENT CREATED] Order ${orderId} | Vendor: ${vendorName} | Courier: ${courier} | Tracking: ${trackingNumber}`
      ).catch(err => console.error("Telegram notify failed:", err))
    }

    return { success: true, shipments: createdShipments }
  } catch (error: any) {
    console.error("Failed to create shipment:", error)
    return { success: false, error: error.message || "Failed to create shipment" }
  }
}

// ---------------------------------------------------------------------------
// 2. Update shipment status (vendor / admin action)
// ---------------------------------------------------------------------------

export async function updateShipmentStatus(
  shipmentId: number,
  newStatus: "confirmed" | "courier_assigned" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered",
  location?: string,
  remarks?: string
) {
  const userId = await getUserId()
  if (!userId) return { success: false, error: "Unauthorized" }

  try {
    const shipment = await db.select().from(shipmentsTable).where(eq(shipmentsTable.id, shipmentId)).limit(1)
    if (!shipment[0]) return { success: false, error: "Shipment not found" }

    // Authorization: vendor owns it or admin
    if (shipment[0].vendorId !== userId) {
      const userRole = await db.select({ role: userTable.role }).from(userTable).where(eq(userTable.id, userId)).limit(1)
      if (userRole[0]?.role !== "admin") {
        return { success: false, error: "Access Denied" }
      }
    }

    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    }

    if (newStatus === "delivered") {
      updateData.actualDelivery = new Date()
      // Update order status
      await db
        .update(ordersTable)
        .set({ status: "delivered", deliveredAt: new Date(), updatedAt: new Date() })
        .where(eq(ordersTable.id, shipment[0].orderId))

      // Update order items status
      await db
        .update(orderItemsTable)
        .set({ status: "delivered", updatedAt: new Date() })
        .where(eq(orderItemsTable.orderId, shipment[0].orderId))
    }

    if (location) updateData.currentLocation = location
    if (remarks) updateData.remarks = remarks

    await db.update(shipmentsTable).set(updateData).where(eq(shipmentsTable.id, shipmentId))

    // Create event log
    await db.insert(shipmentEventsTable).values({
      shipmentId,
      status: newStatus,
      location: location || shipment[0].currentLocation || undefined,
      remarks: remarks || undefined,
    })

    // Notifications
    const order = await db.select().from(ordersTable).where(eq(ordersTable.id, shipment[0].orderId)).limit(1)
    const buyerId = order[0]?.userId
    const buyer = buyerId ? await db.select({ email: userTable.email, name: userTable.name }).from(userTable).where(eq(userTable.id, buyerId)).limit(1) : []
    const buyerEmail = buyer[0]?.email
    const buyerName = buyer[0]?.name || "Customer"

    const statusLabels: Record<string, string> = {
      courier_assigned: "Courier Assigned",
      picked_up: "Picked Up",
      in_transit: "In Transit",
      out_for_delivery: "Out for Delivery",
      delivered: "Delivered",
    }

    const label = statusLabels[newStatus] || newStatus

    if (buyerEmail && statusLabels[newStatus]) {
      sendMail({
        to: buyerEmail,
        subject: `Order ${shipment[0].orderId} - ${label} | SaaSum IQMart`,
        html: `
          <h2 style="color: #2563eb;">${label}</h2>
          <p>Hello ${buyerName},</p>
          <p>Your order <strong>${shipment[0].orderId}</strong> has been updated.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p><strong>Tracking Number:</strong> <code>${shipment[0].trackingNumber}</code></p>
            <p><strong>Courier:</strong> ${shipment[0].courierPartner}</p>
            <p><strong>Status:</strong> ${label}</p>
            ${location ? `<p><strong>Current Location:</strong> ${location}</p>` : ""}
          </div>
        `,
      }).catch(err => console.error("Shipment status email failed:", err))
    }

    sendTelegramNotification(
      `[SHIPMENT UPDATE] Order ${shipment[0].orderId} | Status: ${label.toUpperCase()} | Tracking: ${shipment[0].trackingNumber}`
    ).catch(err => console.error("Telegram notify failed:", err))

    return { success: true }
  } catch (error: any) {
    console.error("Failed to update shipment status:", error)
    return { success: false, error: error.message || "Failed to update shipment" }
  }
}

// ---------------------------------------------------------------------------
// 3. Get vendor shipments
// ---------------------------------------------------------------------------

export async function getVendorShipments() {
  const userId = await getUserId()
  if (!userId) return { success: false, error: "Unauthorized" }

  try {
    const list = await db
      .select()
      .from(shipmentsTable)
      .where(eq(shipmentsTable.vendorId, userId))
      .orderBy(desc(shipmentsTable.createdAt))

    const delayedCount = list.filter(s => isDelayed(s.estimatedDelivery, s.status)).length
    const activeCount = list.filter(s => s.status !== "delivered").length
    const deliveredCount = list.filter(s => s.status === "delivered").length

    return {
      success: true,
      shipments: list,
      stats: { active: activeCount, delayed: delayedCount, delivered: deliveredCount },
    }
  } catch (error: any) {
    console.error("Failed to fetch vendor shipments:", error)
    return { success: false, error: error.message || "Failed to fetch shipments" }
  }
}

// ---------------------------------------------------------------------------
// 4. Get admin all shipments
// ---------------------------------------------------------------------------

export async function getAdminShipments() {
  const userId = await getUserId()
  if (!userId) return { success: false, error: "Unauthorized" }

  const role = await db.select({ role: userTable.role }).from(userTable).where(eq(userTable.id, userId)).limit(1)
  if (role[0]?.role !== "admin") return { success: false, error: "Access Denied" }

  try {
    const list = await db
      .select({
        id: shipmentsTable.id,
        orderId: shipmentsTable.orderId,
        vendorId: shipmentsTable.vendorId,
        courierPartner: shipmentsTable.courierPartner,
        trackingNumber: shipmentsTable.trackingNumber,
        status: shipmentsTable.status,
        estimatedDelivery: shipmentsTable.estimatedDelivery,
        actualDelivery: shipmentsTable.actualDelivery,
        currentLocation: shipmentsTable.currentLocation,
        remarks: shipmentsTable.remarks,
        createdAt: shipmentsTable.createdAt,
        updatedAt: shipmentsTable.updatedAt,
        vendorName: userTable.name,
        vendorEmail: userTable.email,
      })
      .from(shipmentsTable)
      .innerJoin(userTable, eq(shipmentsTable.vendorId, userTable.id))
      .orderBy(desc(shipmentsTable.createdAt))

    return { success: true, shipments: list }
  } catch (error: any) {
    console.error("Failed to fetch admin shipments:", error)
    return { success: false, error: error.message || "Failed to fetch shipments" }
  }
}

// ---------------------------------------------------------------------------
// 5. Get shipment events (timeline)
// ---------------------------------------------------------------------------

export async function getShipmentEvents(shipmentId: number) {
  try {
    const events = await db
      .select()
      .from(shipmentEventsTable)
      .where(eq(shipmentEventsTable.shipmentId, shipmentId))
      .orderBy(desc(shipmentEventsTable.timestamp))

    return { success: true, events }
  } catch (error: any) {
    console.error("Failed to fetch shipment events:", error)
    return { success: false, error: error.message || "Failed to fetch events" }
  }
}

// ---------------------------------------------------------------------------
// 6. Get buyer shipments (for /orders page)
// ---------------------------------------------------------------------------

export async function getBuyerShipments() {
  const userId = await getUserId()
  if (!userId) return { success: false, error: "Unauthorized" }

  try {
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, userId))
    const orderIds = orders.map(o => o.id)

    if (orderIds.length === 0) return { success: true, shipments: [] }

    const list = await db
      .select()
      .from(shipmentsTable)
      .where(inArray(shipmentsTable.orderId, orderIds))
      .orderBy(desc(shipmentsTable.createdAt))

    return { success: true, shipments: list }
  } catch (error: any) {
    console.error("Failed to fetch buyer shipments:", error)
    return { success: false, error: error.message || "Failed to fetch shipments" }
  }
}

// ---------------------------------------------------------------------------
// 7. Get shipment by order ID
// ---------------------------------------------------------------------------

export async function getShipmentByOrderId(orderId: string) {
  try {
    const shipment = await db.select().from(shipmentsTable).where(eq(shipmentsTable.orderId, orderId)).limit(1)
    if (shipment.length === 0) return { success: true, shipment: null }

    const events = await db
      .select()
      .from(shipmentEventsTable)
      .where(eq(shipmentEventsTable.shipmentId, shipment[0].id))
      .orderBy(desc(shipmentEventsTable.timestamp))

    return { success: true, shipment: { ...shipment[0], events } }
  } catch (error: any) {
    console.error("Failed to fetch shipment:", error)
    return { success: false, error: error.message || "Failed to fetch shipment" }
  }
}
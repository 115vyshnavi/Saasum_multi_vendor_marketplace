"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  orders as ordersTable,
  orderItems as orderItemsTable,
  vendorProfiles as vendorProfilesTable,
  user as userTable,
} from "@/lib/db/schema"
import { eq, sql, inArray } from "drizzle-orm"
import { headers } from "next/headers"

export type InvoiceDetails = {
  invoiceNumber: string
  invoiceDate: string
  status: "generated" | "refunded"
  order: any
  items: any[]
  vendor: {
    businessName: string
    gstNumber: string | null
    panNumber: string | null
    address: string
    bankDetails: {
      accountNumber: string | null
      ifscCode: string | null
      bankName: string | null
      holderName: string | null
    }
  }
  buyer: {
    name: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
  }
  gstSplit: {
    basePrice: string
    cgst: string
    sgst: string
    totalGst: string
  }
}

// Generate deterministic invoice reference: INV-YYYY-XXXXXX
export async function generateInvoiceNumber(orderId: string, placedDate: Date): Promise<string> {
  let hash = 0
  for (let i = 0; i < orderId.length; i++) {
    hash = (hash * 31 + orderId.charCodeAt(i)) % 1000000
  }
  const xxxxx = String(hash).padStart(6, "0")
  const yyyy = new Date(placedDate).getFullYear()
  return `INV-${yyyy}-${xxxxx}`
}

export async function getInvoiceDetails(orderId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // 1. Fetch order
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .limit(1)

    if (!orders[0]) {
      return { success: false, error: "Order not found" }
    }

    const order = orders[0]

    // 2. Access control: only buyer of the order or admin is allowed
    if (order.userId !== session.user.id && session.user.role !== "admin") {
      return { success: false, error: "Unauthorized access to invoice" }
    }

    // 3. Status restriction: Invoices only allowed for confirmed, shipped, delivered, or returned
    const allowedStatuses = ["confirmed", "shipped", "delivered", "returned"]
    if (!allowedStatuses.includes(order.status)) {
      return {
        success: false,
        error: `Invoices are not generated for orders in '${order.status}' status.`
      }
    }

    // 4. Fetch order items
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId))

    if (items.length === 0) {
      return { success: false, error: "No items found for this order" }
    }

    // 5. Fetch vendor details
    const vendorId = items[0].vendorId
    const vendorProfilesList = await db
      .select()
      .from(vendorProfilesTable)
      .where(eq(vendorProfilesTable.userId, vendorId))
      .limit(1)
    
    const vendorProfile = vendorProfilesList[0]

    // Calculate GST back-calculations (standard 18% GST split: 9% CGST + 9% SGST)
    const subtotal = parseFloat(order.subtotal)
    const basePrice = subtotal / 1.18
    const gstTotal = subtotal - basePrice
    const cgst = gstTotal / 2
    const sgst = gstTotal / 2

    // Determine invoice status (generated or refunded)
    const invoiceStatus = order.invoiceStatus === "refunded" || order.paymentStatus === "refunded" ? "refunded" : "generated"
    
    const invoiceNumber = await generateInvoiceNumber(order.id, order.placedAt)
    const invoiceDate = new Date(order.placedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })

    const details: InvoiceDetails = {
      invoiceNumber,
      invoiceDate,
      status: invoiceStatus,
      order,
      items: items.map((i) => ({
        ...i,
        unitPrice: parseFloat(i.unitPrice),
        totalPrice: parseFloat(i.totalPrice)
      })),
      vendor: {
        businessName: vendorProfile?.businessName || "SaaSum Registered Seller",
        gstNumber: vendorProfile?.gstNumber || null,
        panNumber: vendorProfile?.panNumber || null,
        address: `${vendorProfile?.businessAddress || "SaaSum Marketplace Office"}, ${vendorProfile?.businessCity || "MUMBAI"}, ${vendorProfile?.businessState || "MH"} - ${vendorProfile?.businessPincode || "400001"}`,
        bankDetails: {
          accountNumber: vendorProfile?.bankAccountNumber || null,
          ifscCode: vendorProfile?.bankIfscCode || null,
          bankName: vendorProfile?.bankName || null,
          holderName: vendorProfile?.accountHolderName || null
        }
      },
      buyer: {
        name: order.shippingName,
        phone: order.shippingPhone,
        address: order.shippingAddress,
        city: order.shippingCity,
        state: order.shippingState,
        pincode: order.shippingPincode
      },
      gstSplit: {
        basePrice: basePrice.toFixed(2),
        cgst: cgst.toFixed(2),
        sgst: sgst.toFixed(2),
        totalGst: gstTotal.toFixed(2)
      }
    }

    return { success: true, details }
  } catch (error: any) {
    console.error("Failed to generate invoice details:", error)
    return { success: false, error: error.message || "Failed to fetch invoice details" }
  }
}

export async function getAdminInvoices() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Fetch only orders that are in allowed invoice states (confirmed, shipped, delivered, returned)
    const allowedStatuses = ["confirmed", "shipped", "delivered", "returned"]
    const list = await db
      .select()
      .from(ordersTable)
      .where(inArray(ordersTable.status, allowedStatuses))
      .orderBy(sql`${ordersTable.createdAt} DESC`)

    const invoices = await Promise.all(
      list.map(async (order) => {
        const invoiceNumber = await generateInvoiceNumber(order.id, order.placedAt)
        return {
          orderId: order.id,
          invoiceNumber,
          buyerName: order.shippingName,
          date: order.placedAt,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentStatus: order.paymentStatus,
          invoiceStatus: order.invoiceStatus === "refunded" || order.paymentStatus === "refunded" ? "refunded" : "generated"
        }
      })
    )

    return { success: true, invoices }
  } catch (error: any) {
    console.error("Failed to fetch admin invoices:", error)
    return { success: false, error: error.message || "Failed to fetch invoices" }
  }
}

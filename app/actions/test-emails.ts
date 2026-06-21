"use server"

import {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendCartReminderEmail,
} from "@/lib/email"
import { db } from "@/lib/db"
import { orders as ordersTable } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

export async function triggerTestWelcome(name: string, email: string, role: string) {
  return await sendWelcomeEmail({ email, name, role })
}

export async function triggerTestConfirmation(orderId: string, email: string) {
  return await sendOrderConfirmationEmail(orderId, email)
}

export async function triggerTestShipped(orderId: string, email: string, trackingNumber?: string) {
  return await sendOrderShippedEmail(orderId, email, trackingNumber)
}

export async function triggerTestCartReminder(email: string, name: string) {
  const mockItems = [
    {
      name: "Aero Runner Sneakers",
      price: "129.00",
      quantity: 1,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80",
    },
    {
      name: "Wireless Earbuds Pro",
      price: "159.00",
      quantity: 2,
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&q=80",
    },
  ]
  return await sendCartReminderEmail(email, name, mockItems)
}

export async function getRecentOrdersList() {
  try {
    const list = await db
      .select({
        id: ordersTable.id,
        shippingName: ordersTable.shippingName,
        total: ordersTable.totalAmount,
        status: ordersTable.status,
      })
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(10)
    return list
  } catch (err) {
    console.error("Failed to fetch recent orders list for test-emails console:", err)
    return []
  }
}

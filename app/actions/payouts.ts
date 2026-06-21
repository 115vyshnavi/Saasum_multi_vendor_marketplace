"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  payouts as payoutsTable,
  orders as ordersTable,
  orderItems as orderItemsTable,
  vendorProfiles as vendorProfilesTable,
  user as userTable,
} from "@/lib/db/schema"
import { eq, and, ne, inArray, desc, isNull, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { sendMail } from "@/lib/email"
import { sendTelegramNotification } from "@/lib/telegram"

// Helper to get authenticated user ID
async function getUserId() {
  if (process.env.TEST_VENDOR_USER_BYPASS) {
    return process.env.TEST_VENDOR_USER_BYPASS
  }
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    return session?.user?.id || null
  } catch (e) {
    return null
  }
}

// 1. Get Vendor Ledger System & Performance Metrics
export async function getVendorLedger(vendorId: string) {
  try {
    // 1a. Fetch vendor profile to check commission rate override
    const profile = await db
      .select({ commissionRate: vendorProfilesTable.commissionRate })
      .from(vendorProfilesTable)
      .where(eq(vendorProfilesTable.userId, vendorId))
      .limit(1)

    const commissionRate = profile[0]?.commissionRate 
      ? parseFloat(profile[0].commissionRate) 
      : 10.00 // Default 10% commission

    // 1b. Fetch all order items and their parent orders for this vendor
    const items = await db
      .select({
        id: orderItemsTable.id,
        orderId: orderItemsTable.orderId,
        totalPrice: orderItemsTable.totalPrice,
        payoutId: orderItemsTable.payoutId,
        quantity: orderItemsTable.quantity,
        orderStatus: ordersTable.status,
        paymentStatus: ordersTable.paymentStatus,
        deliveredAt: ordersTable.deliveredAt,
      })
      .from(orderItemsTable)
      .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
      .where(eq(orderItemsTable.vendorId, vendorId))

    // 1c. Calculate historical cumulative statistics
    let totalSalesCount = 0
    let totalRefundsCount = 0
    let grossRevenue = 0
    let platformCommission = 0
    let refundsDeducted = 0

    // For hold period tracking: 7 days ago
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Outstanding eligible items (payoutId is null)
    let eligibleGross = 0
    let eligibleRefunds = 0

    const eligibleItemsToLink: number[] = []
    const refundItemsToLink: number[] = []

    for (const item of items) {
      const price = parseFloat(item.totalPrice)
      const qty = item.quantity || 0
      const isDelivered = item.orderStatus === "delivered"
      const isRefunded = item.orderStatus === "returned" || item.paymentStatus === "refunded"

      if (isDelivered) {
        totalSalesCount += qty
        grossRevenue += price
        platformCommission += price * (commissionRate / 100)

        // Check hold eligibility: delivered at least 7 days ago, not returned/refunded, not payouted
        if (item.payoutId === null) {
          const deliveredDate = item.deliveredAt ? new Date(item.deliveredAt) : null
          if (deliveredDate && deliveredDate <= sevenDaysAgo) {
            eligibleGross += price
            eligibleItemsToLink.push(item.id)
          }
        }
      } else if (isRefunded) {
        totalRefundsCount += qty
        refundsDeducted += price

        // Check if this refund is outstanding (not yet linked to a payout)
        if (item.payoutId === null) {
          eligibleRefunds += price
          refundItemsToLink.push(item.id)
        }
      }
    }

    const netPayout = grossRevenue - platformCommission - refundsDeducted

    // 1d. Fetch payouts history for this vendor
    const payoutsList = await db
      .select()
      .from(payoutsTable)
      .where(eq(payoutsTable.vendorId, vendorId))
      .orderBy(desc(payoutsTable.createdAt))

    const paidPayoutsSum = payoutsList
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)

    const pendingPayoutsSum = payoutsList
      .filter(p => p.status === "pending" || p.status === "processing")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)

    // Outstanding Net Eligible Amount that can be requested right now
    const eligibleCommissionAmount = eligibleGross * (commissionRate / 100)
    let pendingPayoutAmount = eligibleGross - eligibleCommissionAmount - eligibleRefunds
    
    // Clamp to 0 if negative
    if (pendingPayoutAmount < 0) {
      pendingPayoutAmount = 0
    }

    // performance metrics (Module 20 groundwork)
    const totalPayoutsInitiated = payoutsList.length
    const paidPayoutsCount = payoutsList.filter(p => p.status === "paid").length
    const payoutSuccessRate = totalPayoutsInitiated > 0
      ? (paidPayoutsCount / totalPayoutsInitiated) * 100
      : 100.0

    return {
      success: true,
      ledger: {
        totalSales: totalSalesCount,
        grossRevenue: parseFloat(grossRevenue.toFixed(2)),
        commissionRate,
        platformCommission: parseFloat(platformCommission.toFixed(2)),
        refundsDeducted: parseFloat(refundsDeducted.toFixed(2)),
        netPayout: parseFloat(netPayout.toFixed(2)),
        paidPayouts: parseFloat(paidPayoutsSum.toFixed(2)),
        pendingPayouts: parseFloat(pendingPayoutsSum.toFixed(2)),
        unpaidBalance: parseFloat(pendingPayoutAmount.toFixed(2)),
        eligibleGross: parseFloat(eligibleGross.toFixed(2)),
        eligibleCommission: parseFloat(eligibleCommissionAmount.toFixed(2)),
        eligibleRefunds: parseFloat(eligibleRefunds.toFixed(2)),
      },
      payouts: payoutsList,
      metrics: {
        successfulOrdersCount: totalSalesCount,
        refundedOrdersCount: totalRefundsCount,
        payoutSuccessRate: parseFloat(payoutSuccessRate.toFixed(1)),
      },
      eligibleItemsToLink,
      refundItemsToLink,
    }
  } catch (error: any) {
    console.error("Failed to load vendor ledger:", error)
    return { success: false, error: error.message || "Failed to load ledger" }
  }
}

// 2. Initiate a Payout Request (Vendor-initiated)
export async function requestPayout() {
  const vendorId = await getUserId()
  if (!vendorId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    return await db.transaction(async (tx) => {
      // Fetch ledger data within transaction
      const ledgerResult = await getVendorLedger(vendorId)
      if (!ledgerResult.success || !ledgerResult.ledger) {
        throw new Error(ledgerResult.error || "Failed to compute ledger")
      }

      const { unpaidBalance, eligibleCommission, eligibleRefunds } = ledgerResult.ledger
      const { eligibleItemsToLink, refundItemsToLink } = ledgerResult

      if (unpaidBalance <= 0) {
        throw new Error("No payout balance is currently eligible for release (7-day hold period applies).")
      }

      // Check if vendor already has a pending payout to prevent duplicates/stacking
      const existingPending = await tx
        .select()
        .from(payoutsTable)
        .where(
          and(
            eq(payoutsTable.vendorId, vendorId),
            inArray(payoutsTable.status, ["pending", "processing"])
          )
        )
        .limit(1)

      if (existingPending.length > 0) {
        throw new Error("You already have an active payout request in progress.")
      }

      // Create UTR/Remarks template: PAYOUT-YYYY-XXXXXX
      const year = new Date().getFullYear()
      const rand = Math.floor(100000 + Math.random() * 900000)
      const transactionId = `PAYOUT-${year}-${rand}`

      // Create new payout record
      const [insertedPayout] = await tx
        .insert(payoutsTable)
        .values({
          vendorId,
          amount: unpaidBalance.toFixed(2),
          commissionAmount: eligibleCommission.toFixed(2),
          refundAmount: eligibleRefunds.toFixed(2),
          status: "pending",
          transactionId,
          remarks: "Initiated manually by vendor.",
        })
        .returning()

      // Link eligible order items to this payout
      const allItemIdsToLink = [...(eligibleItemsToLink || []), ...(refundItemsToLink || [])]
      if (allItemIdsToLink.length > 0) {
        await tx
          .update(orderItemsTable)
          .set({ payoutId: insertedPayout.id })
          .where(inArray(orderItemsTable.id, allItemIdsToLink))
      }

      // Send Email Notification
      const vendorUser = await tx
        .select({ email: userTable.email, name: userTable.name })
        .from(userTable)
        .where(eq(userTable.id, vendorId))
        .limit(1)

      const vendorEmail = vendorUser[0]?.email
      const vendorName = vendorUser[0]?.name || "Seller"

      if (vendorEmail) {
        const emailContent = `
          <h2 style="color: #1e3a8a;">Payout Initiated</h2>
          <p>Hello ${vendorName},</p>
          <p>We have successfully initiated a payout request for your store balance.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 4px 0; font-weight: 600; color: #64748b;">Transaction ID:</td>
                <td style="padding: 4px 0; text-align: right; font-family: monospace;">${transactionId}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600; color: #64748b;">Net Payout Amount:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #0f172a;">$${unpaidBalance.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600; color: #64748b;">Platform Commission:</td>
                <td style="padding: 4px 0; text-align: right; color: #e11d48;">-$${eligibleCommission.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600; color: #64748b;">Refunds Deducted:</td>
                <td style="padding: 4px 0; text-align: right; color: #e11d48;">-$${eligibleRefunds.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          <p>This request is currently pending admin approval and verification.</p>
        `
        sendMail({
          to: vendorEmail,
          subject: `Payout Initiated [${transactionId}] | SaaSum IQMart`,
          html: emailContent,
        }).catch(err => console.error("Email notify failed:", err))
      }

      // Telegram notification
      sendTelegramNotification(
        `[PAYOUT INITIATED] Vendor ${vendorName} (${vendorId}) requested payout of $${unpaidBalance.toFixed(2)}. TransId: ${transactionId}`
      ).catch(err => console.error("Telegram notify failed:", err))

      return { success: true, payoutId: insertedPayout.id }
    })
  } catch (error: any) {
    console.error("Payout initiation failed:", error)
    return { success: false, error: error.message || "Failed to request payout" }
  }
}

// 3. Admin: Get all payouts
export async function getAdminPayouts() {
  const userId = await getUserId()
  if (!userId) return { success: false, error: "Unauthorized" }

  // Check admin role
  const adminCheck = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)

  if (adminCheck[0]?.role !== "admin") {
    return { success: false, error: "Access Denied: Admins Only" }
  }

  try {
    const list = await db
      .select({
        id: payoutsTable.id,
        vendorId: payoutsTable.vendorId,
        amount: payoutsTable.amount,
        commissionAmount: payoutsTable.commissionAmount,
        refundAmount: payoutsTable.refundAmount,
        status: payoutsTable.status,
        transactionId: payoutsTable.transactionId,
        remarks: payoutsTable.remarks,
        payoutDate: payoutsTable.payoutDate,
        createdAt: payoutsTable.createdAt,
        vendorName: userTable.name,
        vendorEmail: userTable.email,
      })
      .from(payoutsTable)
      .innerJoin(userTable, eq(payoutsTable.vendorId, userTable.id))
      .orderBy(desc(payoutsTable.createdAt))

    return { success: true, payouts: list }
  } catch (error: any) {
    console.error("Failed to load admin payouts:", error)
    return { success: false, error: error.message || "Failed to load payouts" }
  }
}

// 4. Admin: Approve, Reject, or Mark Payout as Paid
export async function updatePayoutStatusAction(
  payoutId: number,
  status: "pending" | "processing" | "paid" | "failed",
  transactionId?: string,
  remarks?: string
) {
  const userId = await getUserId()
  if (!userId) return { success: false, error: "Unauthorized" }

  // Check admin role
  const adminCheck = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)

  if (adminCheck[0]?.role !== "admin") {
    return { success: false, error: "Access Denied" }
  }

  try {
    return await db.transaction(async (tx) => {
      // Fetch payout details
      const payoutResult = await tx
        .select()
        .from(payoutsTable)
        .where(eq(payoutsTable.id, payoutId))
        .limit(1)

      if (!payoutResult[0]) {
        throw new Error("Payout record not found.")
      }

      const payout = payoutResult[0]

      const updateData: Partial<typeof payout> = {
        status,
        updatedAt: new Date(),
      }

      if (status === "paid") {
        updateData.payoutDate = new Date()
      }
      if (transactionId) {
        updateData.transactionId = transactionId
      }
      if (remarks) {
        updateData.remarks = remarks
      }

      // Update payout status
      await tx
        .update(payoutsTable)
        .set(updateData)
        .where(eq(payoutsTable.id, payoutId))

      // If failed/rejected, unlink the order items so they return to outstanding ledger balance
      if (status === "failed") {
        await tx
          .update(orderItemsTable)
          .set({ payoutId: null })
          .where(eq(orderItemsTable.payoutId, payoutId))
      }

      // Fetch vendor details
      const vendorUser = await tx
        .select({ email: userTable.email, name: userTable.name })
        .from(userTable)
        .where(eq(userTable.id, payout.vendorId))
        .limit(1)

      const vendorEmail = vendorUser[0]?.email
      const vendorName = vendorUser[0]?.name || "Seller"
      const txId = transactionId || payout.transactionId || "N/A"

      // Trigger Email Notification
      if (vendorEmail) {
        let subject = ""
        let bodyHtml = ""

        if (status === "processing") {
          subject = `Payout Approved & Processing [${txId}] | SaaSum IQMart`
          bodyHtml = `
            <h2 style="color: #2563eb;">Payout Approved & Processing</h2>
            <p>Hello ${vendorName},</p>
            <p>Your payout request has been approved by the platform administrator and is currently processing.</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <strong>Transaction Reference:</strong> ${txId}<br/>
              <strong>Amount:</strong> $${parseFloat(payout.amount).toFixed(2)}
            </div>
            <p>Funds will be transferred to your registered account shortly.</p>
          `
        } else if (status === "paid") {
          subject = `Payout Released & Paid [${txId}] | SaaSum IQMart`
          bodyHtml = `
            <h2 style="color: #16a34a;">Payout Released & Paid</h2>
            <p>Hello ${vendorName},</p>
            <p>Great news! Your payout has been successfully transferred and marked as paid.</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <strong>Transaction Reference / UTR:</strong> ${txId}<br/>
              <strong>Amount Received:</strong> $${parseFloat(payout.amount).toFixed(2)}<br/>
              <strong>Paid Date:</strong> ${new Date().toLocaleDateString()}
            </div>
          `
        } else if (status === "failed") {
          subject = `Payout Rejected/Failed [${txId}] | SaaSum IQMart`
          bodyHtml = `
            <h2 style="color: #dc2626;">Payout Request Failed / Rejected</h2>
            <p>Hello ${vendorName},</p>
            <p>Your payout request has been rejected or failed processing.</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <strong>Transaction Reference:</strong> ${txId}<br/>
              <strong>Amount:</strong> $${parseFloat(payout.amount).toFixed(2)}<br/>
              <strong>Remarks:</strong> ${remarks || "N/A"}
            </div>
            <p>The billing items have been unlinked and returned to your outstanding store ledger balance. Please contact support.</p>
          `
        }

        if (subject && bodyHtml) {
          sendMail({
            to: vendorEmail,
            subject,
            html: bodyHtml,
          }).catch(err => console.error("Email notify failed:", err))
        }
      }

      // Telegram notification
      sendTelegramNotification(
        `[PAYOUT STATUS CHANGE] Payout ID ${payoutId} for Vendor ${vendorName} set to ${status.toUpperCase()} (UTR/Ref: ${txId}).`
      ).catch(err => console.error("Telegram notify failed:", err))

      return { success: true }
    })
  } catch (error: any) {
    console.error("Payout status update failed:", error)
    return { success: false, error: error.message || "Failed to update payout status" }
  }
}

export async function initiatePayout() {
  return requestPayout()
}

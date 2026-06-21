import nodemailer from "nodemailer"
import fs from "fs"
import path from "path"
import { db } from "@/lib/db"
import { orders as ordersTable, orderItems as orderItemsTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Cache path for Ethereal SMTP test account
const ETHEREAL_CACHE_PATH = "C:\\Users\\user\\.gemini\\antigravity\\brain\\9620f229-457f-4691-993c-53f781ccd8c6\\scratch\\ethereal_account.json"
const EMAIL_LOG_PATH = "C:\\Users\\user\\.gemini\\antigravity\\brain\\9620f229-457f-4691-993c-53f781ccd8c6\\scratch\\sent_emails.log"

// Helper to ensure parent directories exist for a file path
function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath)
  if (fs.existsSync(dirname)) {
    return true
  }
  ensureDirectoryExistence(dirname)
  fs.mkdirSync(dirname)
}

// Get or create Nodemailer transporter
async function getTransporter(): Promise<{ transporter: nodemailer.Transporter; from: string }> {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || "SaaSum Marketplace <no-reply@saasum.com>"

  // If real SMTP settings are configured, use them
  if (host && port && user && pass) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: parseInt(port) === 465, // true for 465, false for 587/other
        auth: { user, pass },
      }),
      from,
    }
  }

  // Otherwise, fall back to Ethereal Mail (caching credentials so it is fast)
  let testAccount: any
  try {
    ensureDirectoryExistence(ETHEREAL_CACHE_PATH)
    if (fs.existsSync(ETHEREAL_CACHE_PATH)) {
      testAccount = JSON.parse(fs.readFileSync(ETHEREAL_CACHE_PATH, "utf-8"))
    } else {
      console.log("Generating Ethereal Mail test account...")
      testAccount = await nodemailer.createTestAccount()
      fs.writeFileSync(ETHEREAL_CACHE_PATH, JSON.stringify(testAccount, null, 2))
    }
  } catch (error) {
    console.error("Failed to load/create Ethereal account cache. Generating on the fly:", error)
    testAccount = await nodemailer.createTestAccount()
  }

  return {
    transporter: nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    }),
    from: `"SaaSum IQMart Test" <${testAccount.user}>`,
  }
}

// Shared responsive branded HTML layout wrapper
export function getBrandedLayout(title: string, previewText: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    /* RESET STYLES */
    body, table, td, a { text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #1e293b; }
    
    /* MOBILE STYLES */
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding: 20px !important; }
      .stack { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .text-center-mobile { text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <!-- Hidden preview text for email clients -->
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${previewText}
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); padding: 32px 40px;" class="mobile-padding">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.05em; color: #ffffff; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      SaaSum <span style="color: #60a5fa;">IQMart</span>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 8px;">
                    <span style="font-size: 12px; font-weight: 500; color: #94a3b8; letter-spacing: 0.1em; text-transform: uppercase;">
                      Multi-Vendor Marketplace
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CONTENT BODY -->
          <tr>
            <td style="padding: 40px;" class="mobile-padding">
              ${contentHtml}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 32px 40px; border-top: 1px solid #e2e8f0; text-align: center;" class="mobile-padding">
              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                &copy; ${new Date().getFullYear()} SaaSum IQMart. All rights reserved.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                You received this transactional email as a registered member or checkout guest of SaaSum Marketplace.
              </p>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px;">
                <tr>
                  <td align="center" style="font-size: 13px;">
                    <a href="${process.env.BETTER_AUTH_URL || "http://localhost:3000"}" style="color: #2563eb; text-decoration: none; font-weight: 600; margin: 0 8px;">Visit Shop</a>
                    <span style="color: #cbd5e1;">&bull;</span>
                    <a href="${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/profile" style="color: #2563eb; text-decoration: none; font-weight: 600; margin: 0 8px;">My Account</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// Low-level email sending helper
export async function sendMail(options: { to: string; subject: string; html: string }): Promise<{ success: boolean; previewUrl?: string | false; messageId?: string }> {
  try {
    const { transporter, from } = await getTransporter()

    const mailOptions = {
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    }

    const info = await transporter.sendMail(mailOptions)
    const previewUrl = nodemailer.getTestMessageUrl(info)

    // Write to a local file for verification and history
    try {
      ensureDirectoryExistence(EMAIL_LOG_PATH)
      const logEntry = `[${new Date().toISOString()}] TO: ${options.to} | SUBJECT: ${options.subject} | MSG_ID: ${info.messageId} | PREVIEW: ${previewUrl || "N/A"}\n`
      fs.appendFileSync(EMAIL_LOG_PATH, logEntry)
    } catch (e) {
      console.error("Failed to append email log file:", e)
    }

    console.log(`Email successfully sent to ${options.to}`)
    if (previewUrl) {
      console.log(`Preview URL: ${previewUrl}`)
    }

    return {
      success: true,
      previewUrl,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error("Email delivery failed:", error)
    return { success: false }
  }
}

// 1. Trigger Welcome Email
export async function sendWelcomeEmail(user: { email: string; name: string; role: string }) {
  const isVendor = user.role === "vendor" || user.role === "brand"
  const shopUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000"
  
  const content = `
    <h2 style="margin-top: 0; font-size: 20px; font-weight: 700; color: #0f172a;">Welcome to the Marketplace, ${user.name}! 🚀</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 12px;">
      We are absolutely thrilled to welcome you to SaaSum IQMart. Your account has been successfully created.
    </p>
    
    <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">Account Details</h3>
      <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Email:</strong> ${user.email}</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #475569;"><strong>Role:</strong> ${user.role.toUpperCase()}</p>
    </div>

    ${isVendor ? `
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        As a seller, you can now set up your business profile, upload products, track orders, and view real-time sales reports from your dashboard. Let's get your products online and in front of buyers!
      </p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
        <tr>
          <td align="center">
            <a href="${shopUrl}/vendor" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
              Open Seller Portal
            </a>
          </td>
        </tr>
      </table>
    ` : `
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        You can now browse thousands of items, add products to your cart, and checkout securely. Discover premium brands and independent vendors, all protected by our buyer safety guarantee.
      </p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
        <tr>
          <td align="center">
            <a href="${shopUrl}/shop" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
              Start Shopping
            </a>
          </td>
        </tr>
      </table>
    `}

    <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
      Need help setting up? Simply reply to this email, and our customer support team will be happy to guide you.
    </p>
  `

  const html = getBrandedLayout(`Welcome to SaaSum IQMart!`, `We are thrilled to welcome you to SaaSum IQMart. Your account has been created.`, content)
  return sendMail({
    to: user.email,
    subject: "Welcome to SaaSum Marketplace! 🚀",
    html,
  })
}

// 2. Trigger Order Confirmation Email
export async function sendOrderConfirmationEmail(orderId: string, email: string) {
  try {
    // Retrieve order and items details directly from the database
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1)
    if (!orders[0]) {
      throw new Error(`Order ${orderId} not found in database for email trigger.`)
    }

    const order = orders[0]
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId))

    const subtotal = parseFloat(order.subtotal)
    const shipping = parseFloat(order.shippingCost)
    const total = parseFloat(order.totalAmount)

    let itemsTableRows = ""
    for (const item of items) {
      itemsTableRows += `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 0; font-size: 14px; color: #334155;">
            <strong>${item.productName}</strong>
            ${item.productSku ? `<br/><span style="font-size: 11px; color: #64748b;">SKU: ${item.productSku}</span>` : ""}
          </td>
          <td style="padding: 12px 0; font-size: 14px; color: #334155; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px 0; font-size: 14px; color: #334155; text-align: right; font-weight: 500;">$${parseFloat(item.unitPrice).toFixed(2)}</td>
        </tr>
      `
    }

    const content = `
      <h2 style="margin-top: 0; font-size: 20px; font-weight: 700; color: #0f172a;">Your Order is Confirmed! 🎉</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        Hi ${order.shippingName}, thank you for shopping at SaaSum IQMart. We have received your order <strong>${orderId}</strong> and are getting it ready for shipment.
      </p>

      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 32px 0 12px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Order Summary</h3>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <thead>
          <tr style="border-bottom: 2px solid #e2e8f0; text-align: left;">
            <th style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b; width: 60%;">Item</th>
            <th style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b; text-align: center; width: 15%;">Qty</th>
            <th style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b; text-align: right; width: 25%;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsTableRows}
        </tbody>
      </table>

      <!-- Order Totals -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px; border-top: 2px solid #f1f5f9; padding-top: 12px;">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Subtotal</td>
          <td style="padding: 6px 0; font-size: 14px; color: #334155; text-align: right; font-weight: 500;">$${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Shipping charges</td>
          <td style="padding: 6px 0; font-size: 14px; color: #334155; text-align: right; font-weight: 500;">$${shipping.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0 6px 0; font-size: 16px; font-weight: 700; color: #0f172a; border-top: 1px solid #e2e8f0;">Total amount</td>
          <td style="padding: 12px 0 6px 0; font-size: 18px; font-weight: 800; color: #1e3a8a; text-align: right; border-top: 1px solid #e2e8f0;">$${total.toFixed(2)}</td>
        </tr>
      </table>

      <!-- Delivery and Payment Information -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px; background-color: #f8fafc; border-radius: 8px;">
        <tr>
          <td style="padding: 20px;" class="mobile-padding">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="stack text-center-mobile" valign="top" width="50%" style="padding-right: 10px; padding-bottom: 16px;">
                  <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">Delivery Address</h4>
                  <p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: #64748b;">
                    <strong>${order.shippingName}</strong><br/>
                    ${order.shippingAddress}<br/>
                    ${order.shippingCity}, ${order.shippingState} - ${order.shippingPincode}<br/>
                    Phone: ${order.shippingPhone}
                  </p>
                </td>
                <td class="stack text-center-mobile" valign="top" width="50%" style="padding-left: 10px; padding-bottom: 16px;">
                  <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">Payment Details</h4>
                  <p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: #64748b;">
                    Method: ${order.paymentMethod}<br/>
                    Status: ${order.paymentStatus.toUpperCase()}<br/>
                    Date: ${new Date(order.placedAt).toLocaleDateString()}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px;">
        <tr>
          <td align="center">
            <a href="${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/order-success/${orderId}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
              Track Order Status
            </a>
          </td>
        </tr>
      </table>
    `

    const html = getBrandedLayout(`Order Confirmation - ${orderId}`, `Hi ${order.shippingName}, your order ${orderId} has been successfully placed at SaaSum IQMart.`, content)
    return await sendMail({
      to: email,
      subject: `Order Confirmed: ${orderId} - SaaSum Marketplace`,
      html,
    })
  } catch (err) {
    console.error(`Failed to trigger order confirmation email for ${orderId}:`, err)
    return { success: false }
  }
}

// 3. Trigger Order Shipped Email
export async function sendOrderShippedEmail(orderId: string, email: string, trackingNumber?: string) {
  try {
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1)
    if (!orders[0]) {
      throw new Error(`Order ${orderId} not found in database for shipping email.`)
    }

    const order = orders[0]
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId))
    const trackNum = trackingNumber || order.trackingNumber || `TRK${Math.floor(1000000000 + Math.random() * 9000000000)}`

    let itemsTableRows = ""
    for (const item of items) {
      itemsTableRows += `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; font-size: 13.5px; color: #334155;">${item.productName}</td>
          <td style="padding: 8px 0; font-size: 13.5px; color: #334155; text-align: center;">${item.quantity}</td>
        </tr>
      `
    }

    const content = `
      <h2 style="margin-top: 0; font-size: 20px; font-weight: 700; color: #0f172a;">Your Order Has Shipped! 🚚</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        Great news, ${order.shippingName}! Your order <strong>${orderId}</strong> has been handed over to our delivery partner and is on its way.
      </p>

      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; text-transform: uppercase; color: #166534; letter-spacing: 0.05em;">Shipping Details</h3>
        <p style="margin: 0; font-size: 14px; color: #166534;"><strong>Carrier:</strong> SaaSum Express</p>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #166534;"><strong>Tracking ID:</strong> <span style="font-family: monospace; font-weight: 700;">${trackNum}</span></p>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #166534;"><strong>Est. Delivery:</strong> 3-5 Business Days</p>
      </div>

      <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 24px 0 8px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">Shipment Package</h3>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <thead>
          <tr style="text-align: left; border-bottom: 1px solid #e2e8f0;">
            <th style="padding-bottom: 6px; font-size: 12px; font-weight: 600; color: #64748b;">Item</th>
            <th style="padding-bottom: 6px; font-size: 12px; font-weight: 600; color: #64748b; text-align: center;">Qty</th>
          </tr>
        </thead>
        <tbody>
          ${itemsTableRows}
        </tbody>
      </table>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px;">
        <tr>
          <td align="center">
            <a href="${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/order-success/${orderId}" style="background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.2);">
              Track Package Live
            </a>
          </td>
        </tr>
      </table>
    `

    const html = getBrandedLayout(`Your Order Has Shipped - ${orderId}`, `Hi ${order.shippingName}, your order ${orderId} has been shipped via SaaSum Express with tracking code ${trackNum}.`, content)
    return await sendMail({
      to: email,
      subject: `Your order ${orderId} has been shipped! 🚚`,
      html,
    })
  } catch (err) {
    console.error(`Failed to trigger order shipped email for ${orderId}:`, err)
    return { success: false }
  }
}

// 4. Trigger Cart Reminder Email
export async function sendCartReminderEmail(email: string, name: string, items: any[]) {
  const shopUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000"

  let itemsHtml = ""
  for (const item of items) {
    itemsHtml += `
      <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
        <img src="${item.image || "/placeholder.svg"}" alt="${item.name}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 6px; margin-right: 12px; background-color: #f1f5f9; border: 1px solid #e2e8f0;"/>
        <div style="flex: 1;">
          <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">${item.name}</h4>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">Qty: ${item.quantity} &bull; Price: $${parseFloat(item.price).toFixed(2)}</p>
        </div>
      </div>
    `
  }

  const content = `
    <h2 style="margin-top: 0; font-size: 20px; font-weight: 700; color: #0f172a;">Did you forget something? 🛒</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Hi ${name}, we noticed you left some items in your shopping cart. Don't miss out on these fantastic products! We have reserved them for a limited time.
    </p>

    <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 32px 0 12px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Left in Your Cart</h3>
    <div style="margin-bottom: 24px;">
      ${itemsHtml}
    </div>

    <p style="font-size: 15.5px; line-height: 1.5; color: #334155;">
      Checkout is quick and secure. Simply click the button below to resume your shopping and finalize your order.
    </p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${shopUrl}/cart" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
            Complete Your Checkout
          </a>
        </td>
      </tr>
    </table>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 24px;">
      <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5; text-align: center;">
        🔒 <strong>Buyer Protection Guarantee:</strong> Shop with confidence. All orders are secure and backed by our money-back policy.
      </p>
    </div>
  `

  const html = getBrandedLayout(`Items Left in Cart`, `Hi ${name}, we noticed you left some items in your shopping cart. Complete your checkout to secure them.`, content)
  return await sendMail({
    to: email,
    subject: "Did you forget something? 🛒 - SaaSum Marketplace",
    html,
  })
}

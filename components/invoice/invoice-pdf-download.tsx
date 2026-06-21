"use client"

import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { Printer } from "lucide-react"
import type { InvoiceDetails } from "@/app/actions/invoice"

export function downloadInvoicePDF(details: InvoiceDetails) {
  const doc = new jsPDF()
  const { order, items, vendor, buyer, gstSplit, invoiceNumber, invoiceDate, status } = details

  const primaryColor: [number, number, number] = [30, 58, 138]
  const accentColor: [number, number, number] = [59, 130, 246]
  const textColor: [number, number, number] = [30, 41, 59]
  const mutedColor: [number, number, number] = [100, 116, 139]

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, 210, 40, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text("SaaSum IQMart", 15, 22)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(200, 220, 255)
  doc.text("Premium Multi-vendor SaaS Marketplace", 15, 30)
  doc.text("support@saasum.com", 15, 36)

  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2])
  doc.roundedRect(160, 12, 35, 16, 3, 3, "F")
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("TAX INVOICE", 177.5, 20, { align: "center" })

  doc.setTextColor(textColor[0], textColor[1], textColor[2])
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Invoice Details", 160, 50)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text(invoiceNumber, 160, 58)

  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
  doc.setFontSize(9)
  doc.text(`Invoice Date: ${invoiceDate}`, 160, 66)
  doc.text(`Order Ref: ${order.id}`, 160, 72)
  doc.text(`Payment: ${order.paymentMethod || "COD"}`, 160, 78)

  if (status === "refunded") {
    doc.setTextColor(180, 100, 200)
    doc.setFontSize(60)
    doc.setFont("helvetica", "bold")
    doc.text("REFUNDED", 105, 150, { align: "center", angle: 45 })
  }

  let yPos = 95

  doc.setFillColor(240, 245, 255)
  doc.roundedRect(15, yPos, 85, 45, 2, 2, "F")

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("SOLD BY (SELLER)", 20, yPos + 8)

  doc.setTextColor(textColor[0], textColor[1], textColor[2])
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(vendor.businessName, 20, yPos + 18)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
  const vendorAddressLines = doc.splitTextToSize(vendor.address, 75)
  doc.text(vendorAddressLines, 20, yPos + 26)

  if (vendor.gstNumber) {
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFont("helvetica", "bold")
    doc.text(`GSTIN: ${vendor.gstNumber}`, 20, yPos + 26 + vendorAddressLines.length * 5 + 2)
  }
  if (vendor.panNumber) {
    doc.setFont("helvetica", "bold")
    doc.text(`PAN: ${vendor.panNumber}`, 20, yPos + 26 + vendorAddressLines.length * 5 + 8)
  }

  doc.setFillColor(245, 250, 255)
  doc.roundedRect(110, yPos, 85, 45, 2, 2, "F")

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("BILLED TO (BUYER)", 115, yPos + 8)

  doc.setTextColor(textColor[0], textColor[1], textColor[2])
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(buyer.name, 115, yPos + 18)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
  const buyerAddressLines = doc.splitTextToSize(buyer.address, 75)
  doc.text(buyerAddressLines, 115, yPos + 26)
  doc.text(`${buyer.city}, ${buyer.state} - ${buyer.pincode}`, 115, yPos + 26 + buyerAddressLines.length * 5 + 2)
  doc.text(`Mobile: ${buyer.phone}`, 115, yPos + 26 + buyerAddressLines.length * 5 + 8)

  yPos = 155

  const tableData = items.map((item, index) => {
    const total = item.totalPrice
    const base = total / 1.18
    const cgstVal = (total - base) / 2
    const sgstVal = (total - base) / 2

    return [
      index + 1,
      item.productName,
      item.productSku,
      item.quantity.toString(),
      `$${(base / item.quantity).toFixed(2)}`,
      "18%",
      `CGST: $${cgstVal.toFixed(2)}\nSGST: $${sgstVal.toFixed(2)}`,
      `$${total.toFixed(2)}`,
    ]
  })

  autoTable(doc, {
    startY: yPos,
    head: [["#", "Item Description", "SKU", "Qty", "Unit Price\n(Excl. GST)", "GST\nRate", "GST Split\n(9%+9%)", "Total Price"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [240, 245, 255],
      textColor: [mutedColor[0], mutedColor[1], mutedColor[2]],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: {
      textColor: [textColor[0], textColor[1], textColor[2]],
      fontSize: 9,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { halign: "center", cellWidth: 25 },
      3: { halign: "center", cellWidth: 15 },
      4: { halign: "right", cellWidth: 30 },
      5: { halign: "center", cellWidth: 20 },
      6: { halign: "left", cellWidth: 35 },
      7: { halign: "right", cellWidth: 30, fontStyle: "bold" },
    },
    margin: { left: 15, right: 15 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  if (vendor.bankDetails?.accountNumber) {
    doc.setFillColor(250, 250, 255)
    doc.roundedRect(15, yPos, 85, 35, 2, 2, "F")

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("BANK SETTLEMENT DETAILS", 20, yPos + 8)

    doc.setTextColor(80, 80, 80)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(`Bank: ${vendor.bankDetails.bankName}`, 20, yPos + 16)
    doc.text(`A/C Holder: ${vendor.bankDetails.holderName}`, 20, yPos + 22)
    doc.text(`A/C Number: ${vendor.bankDetails.accountNumber}`, 20, yPos + 28)
    doc.text(`IFSC: ${vendor.bankDetails.ifscCode}`, 20, yPos + 34)
  }

  doc.setFillColor(250, 252, 255)
  doc.roundedRect(110, yPos, 85, 50, 2, 2, "F")

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("INVOICE SUMMARY", 115, yPos + 8)

  doc.setTextColor(80, 80, 80)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")

  const summaryItems = [
    ["Taxable Value (Base)", `$${gstSplit.basePrice}`],
    ["CGST (9.0%)", `$${gstSplit.cgst}`],
    ["SGST (9.0%)", `$${gstSplit.sgst}`],
    ["Shipping Cost", `$${parseFloat(order.shippingCost).toFixed(2)}`],
  ]

  summaryItems.forEach(([label, value], i) => {
    const itemY = yPos + 18 + i * 7
    doc.text(label, 115, itemY)
    doc.text(value, 190, itemY, { align: "right" })
  })

  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2])
  doc.setLineWidth(0.5)
  doc.line(115, yPos + 46, 190, yPos + 46)

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Grand Total", 115, yPos + 53)
  doc.text(`$${parseFloat(order.totalAmount).toFixed(2)}`, 190, yPos + 53, { align: "right" })

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 280, 210, 17, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text(
    status === "refunded"
      ? "This invoice has been REFUNDED due to order cancellation."
      : "This is a computer-generated invoice and does not require a signature.",
    105,
    288,
    { align: "center" }
  )

  doc.text("GST Declaration: Standard 18% GST split equally into 9% CGST and 9% SGST.", 105, 294, {
    align: "center",
  })

  doc.save(`Invoice-${invoiceNumber}.pdf`)
}

export function InvoicePDFDownload({ details }: { details: InvoiceDetails }) {
  return (
    <button
      onClick={() => downloadInvoicePDF(details)}
      className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold px-4 text-xs shadow-md transition-all hover:bg-primary/95 cursor-pointer"
    >
      <Printer className="size-4 mr-1.5" />
      Download PDF / Print
    </button>
  )
}
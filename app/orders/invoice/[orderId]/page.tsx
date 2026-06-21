import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Printer, ArrowLeft, ShieldAlert, BadgeCheck, RotateCcw } from "lucide-react"
import { getInvoiceDetails } from "@/app/actions/invoice"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InvoicePDFDownload } from "@/components/invoice/invoice-pdf-download"

type InvoicePageProps = {
  params: Promise<{ orderId: string }>
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { orderId } = await params
  const result = await getInvoiceDetails(orderId)

  // 1. Ownership & status validation
  if (!result.success || !result.details) {
    if (result.error === "Unauthorized access to invoice") {
      notFound()
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30">
        <Card className="border border-border rounded-3xl p-6 text-center space-y-5 max-w-md shadow-sm bg-card">
          <span className="flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-500 mx-auto border border-rose-100">
            <ShieldAlert className="size-6" />
          </span>
          <div className="space-y-1.5">
            <h3 className="font-bold text-lg text-foreground">Invoice Unavailable</h3>
            <p className="text-sm text-muted-foreground">
              {result.error || "Invoices can only be generated for paid or confirmed transactions."}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button size="sm" variant="outline" render={<Link href="/orders" />}>
              <ArrowLeft className="size-4" /> Back to Orders
            </Button>
            <Button size="sm" render={<Link href="/shop" />}>
              Return to Shop
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const { details } = result
  const { order, items, vendor, buyer, gstSplit } = details

  return (
    <div className="min-h-screen bg-muted/20 print:bg-white text-slate-800 antialiased py-8 px-4 print:p-0">
      
      {/* Floating Control Header (hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center bg-card border border-border p-4 rounded-3xl shadow-sm print:hidden">
        <Button variant="outline" className="h-9 gap-1.5 rounded-xl" render={<Link href="/orders" />}>
          <ArrowLeft className="size-4" />
          Back to Orders
        </Button>
        
        <div className="flex items-center gap-3">
          {details.status === "refunded" && (
            <Badge className="bg-purple-100 text-purple-800 font-bold border-none py-1 px-3 rounded-full flex items-center gap-1">
              <RotateCcw className="size-3.5" /> REFUNDED
            </Badge>
          )}
          <InvoicePDFDownload details={details} />
        </div>
      </div>

      {/* Actual A4 Printable Invoice Sheet */}
      <div className="relative overflow-hidden max-w-4xl mx-auto bg-card border border-border/80 rounded-[2rem] p-8 md:p-12 shadow-sm print:border-0 print:shadow-none print:p-0 print:max-w-full print:rounded-none bg-white">
        
        {/* Large Refunded Diagonal Watermark Overlay */}
        {details.status === "refunded" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-[0.08] print:opacity-[0.06]">
            <span className="text-[90px] md:text-[120px] font-black uppercase tracking-widest text-purple-900 border-[12px] md:border-[16px] border-purple-900 px-6 md:px-10 py-2 md:py-4 rounded-[30px] md:rounded-[40px] rotate-[-25deg]">
              Refunded
            </span>
          </div>
        )}
        
        {/* Row 1: Brand Info & Status Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-border/60 pb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight text-primary font-sans">
                SaaSum <span className="text-foreground">IQMart</span>
              </span>
              <Badge className="bg-primary/8 text-primary border-none font-bold text-[10px] rounded-full uppercase tracking-wider px-2 py-0.5">
                Tax Invoice
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
              Premium Multi-vendor SaaS Marketplace. Official Receipt of purchase.
            </p>
            <p className="text-xs text-primary font-semibold mt-2 font-mono">
              support@saasum.com
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Invoice Details</p>
            <p className="font-mono font-extrabold text-lg text-foreground tracking-tight">{details.invoiceNumber}</p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Invoice Date: <span className="font-medium text-foreground">{details.invoiceDate}</span></p>
              <p>Order Reference: <span className="font-mono font-medium text-foreground">{order.id}</span></p>
              <p>Payment: <span className="font-semibold text-foreground uppercase">{order.paymentMethod || "COD"}</span></p>
            </div>
          </div>
        </div>

        {/* Row 2: Billing & Shipping Address Splitting */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-border/60 text-sm">
          {/* Seller / Vendor Details */}
          <div className="space-y-2">
            <h4 className="text-[10px] text-muted-foreground uppercase font-extrabold tracking-wider">Sold By (Seller)</h4>
            <div className="space-y-1">
              <p className="font-bold text-foreground text-base">{vendor.businessName}</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{vendor.address}</p>
              {vendor.gstNumber && (
                <p className="text-xs text-foreground font-semibold">
                  GSTIN: <span className="font-mono">{vendor.gstNumber}</span>
                </p>
              )}
              {vendor.panNumber && (
                <p className="text-xs text-foreground font-semibold">
                  PAN: <span className="font-mono">{vendor.panNumber}</span>
                </p>
              )}
            </div>
          </div>

          {/* Buyer Details */}
          <div className="space-y-2 sm:text-right sm:items-end flex flex-col">
            <h4 className="text-[10px] text-muted-foreground uppercase font-extrabold tracking-wider">Billed To (Buyer)</h4>
            <div className="space-y-1">
              <p className="font-bold text-foreground text-base">{buyer.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs sm:ml-auto">{buyer.address}</p>
              <p className="text-xs text-muted-foreground">{buyer.city}, {buyer.state} - {buyer.pincode}</p>
              <p className="text-xs text-foreground font-semibold">
                Mobile: <span className="font-mono">{buyer.phone}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Row 3: Product Line Items Table */}
        <div className="py-8">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th className="px-3 py-3">Item Description</th>
                <th className="px-3 py-3 w-28">SKU</th>
                <th className="px-3 py-3 w-12 text-center">Qty</th>
                <th className="px-3 py-3 w-24 text-right">Unit Price (Excl. GST)</th>
                <th className="px-3 py-3 w-20 text-center">GST Rate</th>
                <th className="px-3 py-3 w-24 text-right">GST Split (9%+9%)</th>
                <th className="px-3 py-3 w-24 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {items.map((item, index) => {
                const total = item.totalPrice
                const base = total / 1.18
                const cgstVal = (total - base) / 2
                const sgstVal = (total - base) / 2

                return (
                  <tr key={item.id} className="align-middle">
                    <td className="px-3 py-4 text-center text-muted-foreground font-medium">{index + 1}</td>
                    <td className="px-3 py-4 font-semibold text-foreground">
                      {item.productName}
                    </td>
                    <td className="px-3 py-4 font-mono text-[11px] text-muted-foreground">{item.productSku}</td>
                    <td className="px-3 py-4 text-center font-bold text-foreground">{item.quantity}</td>
                    <td className="px-3 py-4 text-right font-medium text-foreground">${(base / item.quantity).toFixed(2)}</td>
                    <td className="px-3 py-4 text-center text-muted-foreground">18%</td>
                    <td className="px-3 py-4 text-right font-medium text-muted-foreground">
                      CGST: ${(cgstVal).toFixed(2)}<br/>
                      SGST: ${(sgstVal).toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-right font-bold text-foreground">${total.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Row 4: Pricing Summaries Breakdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border/60 pt-8 text-sm">
          {/* Payment Status & Disclaimers */}
          <div className="space-y-4">
            {vendor.bankDetails.accountNumber && (
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/40 text-xs">
                <span className="font-extrabold uppercase text-[10px] tracking-wider text-muted-foreground block mb-1">
                  Bank Settlement Details
                </span>
                <div className="text-slate-600 space-y-0.5 font-medium">
                  <p>Bank: <span className="text-foreground font-semibold">{vendor.bankDetails.bankName}</span></p>
                  <p>A/C Holder: <span className="text-foreground font-semibold">{vendor.bankDetails.holderName}</span></p>
                  <p>A/C Number: <span className="text-foreground font-semibold font-mono">{vendor.bankDetails.accountNumber}</span></p>
                  <p>IFSC Code: <span className="text-foreground font-semibold font-mono">{vendor.bankDetails.ifscCode}</span></p>
                </div>
              </div>
            )}

            <div className="text-[10px] text-muted-foreground leading-relaxed">
              <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">GST Declaration</p>
              <p>
                The tax rates indicated are standard 18% integrated GST split equally into 9% Central GST (CGST) and 9% State GST (SGST) in accordance with the Goods and Services Tax guidelines.
              </p>
              <p className="font-bold text-primary mt-2">
                * {details.status === "refunded" ? "This invoice has been REFUNDED due to order cancellation." : "This is a computer-generated invoice and does not require a signature."}
              </p>
            </div>
          </div>

          {/* Billing Calculations details */}
          <div className="space-y-3 bg-muted/20 p-6 rounded-3xl border border-border/40 self-start">
            <h4 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider border-b border-border/40 pb-2">
              Invoice Summary
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-medium text-slate-600">
                <span>Taxable Value (Base)</span>
                <span className="font-mono font-semibold text-foreground">${gstSplit.basePrice}</span>
              </div>
              <div className="flex justify-between font-medium text-slate-600">
                <span>CGST (9.0%)</span>
                <span className="font-mono font-semibold text-foreground">${gstSplit.cgst}</span>
              </div>
              <div className="flex justify-between font-medium text-slate-600">
                <span>SGST (9.0%)</span>
                <span className="font-mono font-semibold text-foreground">${gstSplit.sgst}</span>
              </div>
              <div className="flex justify-between font-medium text-slate-600">
                <span>Shipping Cost</span>
                <span className="font-mono font-semibold text-foreground">${parseFloat(order.shippingCost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold border-t border-border/40 pt-3 text-foreground">
                <span>Grand Total</span>
                <span className="text-primary font-mono">${parseFloat(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Custom Global CSS overrides specifically for printer layouts */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            header, footer, nav, aside {
              display: none !important;
            }
            .SiteNavbar, .SiteFooter {
              display: none !important;
            }
            main {
              margin: 0 !important;
              padding: 0 !important;
              max-width: 100% !important;
            }
          }
        `
      }} />

    </div>
  )
}

"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Image as ImageIcon, Loader2, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { submitReturnRequest } from "@/app/actions/returns"
import Link from "next/link"

type ReturnFormClientProps = {
  orderId: string
}

export function ReturnFormClient({ orderId }: ReturnFormClientProps) {
  const router = useRouter()
  const [reason, setReason] = useState("Damaged product")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Simulate file upload by generating a local mock URL
  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages = [...images]
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      // Simulating a path in our system
      const mockUrl = `/uploads/proof-${Date.now()}-${file.name}`
      newImages.push(mockUrl)
    }
    setImages(newImages)
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await submitReturnRequest(orderId, reason, description, images)
      if (res.success) {
        setSuccess(true)
      } else {
        setError(res.error || "Failed to submit return request")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="border border-border/80 rounded-[2rem] p-8 max-w-xl mx-auto text-center shadow-lg bg-card">
        <CardContent className="space-y-6 pt-6">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mx-auto border border-emerald-100">
            <CheckCircle2 className="size-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-2xl text-foreground tracking-tight">Return Requested</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your return request for order <span className="font-mono font-bold text-foreground">{orderId}</span> has been submitted successfully.
            </p>
            <p className="text-xs text-muted-foreground">
              We have notified the vendor to review your request. You can track its status in your order history.
            </p>
          </div>
          <div className="flex gap-4 justify-center pt-2">
            <Button size="sm" variant="outline" render={<Link href="/orders" />}>
              Go to Orders
            </Button>
            <Button size="sm" render={<Link href="/shop" />}>
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border/80 rounded-[2rem] shadow-lg bg-card max-w-2xl mx-auto">
      <CardContent className="p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-border/60 pb-6">
          <Button variant="outline" size="icon" className="rounded-xl size-9" render={<Link href="/orders" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="font-extrabold text-xl text-foreground tracking-tight">Request Order Return</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Order Ref: <span className="font-mono font-semibold">{orderId}</span></p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-2xl">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reason Selection */}
          <div className="space-y-2">
            <label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Return Reason
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            >
              <option value="Damaged product">Damaged product</option>
              <option value="Wrong item received">Wrong item received</option>
              <option value="Defective product">Defective product</option>
              <option value="Quality issue">Quality issue</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description Text Area */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Description / Additional Details
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details about why you want to return this product..."
              className="w-full p-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              required
            />
          </div>

          {/* Proof Images Upload */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Optional Proof Images
            </span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Fake upload box */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl p-4 cursor-pointer hover:bg-muted/10 transition-all aspect-square text-center">
                <ImageIcon className="size-6 text-muted-foreground mb-1.5" />
                <span className="text-[10px] font-bold text-foreground">Upload Image</span>
                <span className="text-[9px] text-muted-foreground mt-0.5">JPG, PNG</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleSimulatedUpload}
                  className="hidden"
                />
              </label>

              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square border border-border rounded-2xl overflow-hidden bg-muted/20 flex flex-col justify-center items-center p-3 text-center">
                  <ImageIcon className="size-7 text-primary mb-1" />
                  <span className="text-[8px] text-muted-foreground truncate w-full px-1">
                    {img.split("/").pop()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 size-5 bg-background border border-border text-foreground hover:bg-muted rounded-full flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border/60 pt-6">
            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Submitting Request...
                </>
              ) : (
                "Submit Return Request"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

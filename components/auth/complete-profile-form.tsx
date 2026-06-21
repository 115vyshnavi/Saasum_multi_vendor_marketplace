"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import Image from "next/image"
import { AlertCircle, Camera, Loader2 } from "lucide-react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { completeProfile } from "@/app/actions/profile"

export function CompleteProfileForm({ name, redirectTo }: { name: string; redirectTo: string }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(typeof reader.result === "string" ? reader.result : null)
    reader.readAsDataURL(file)
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    setLoading(true)
    try {
      await completeProfile({
        phone: String(form.get("phone") || "").trim(),
        address: String(form.get("address") || "").trim(),
        city: String(form.get("city") || "").trim(),
        state: String(form.get("state") || "").trim(),
        pincode: String(form.get("pincode") || "").trim(),
        image,
      })
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setLoading(false)
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    }
  }

  return (
    <AuthLayout
      eyebrow="One last step"
      title="Complete your profile"
      subtitle="Add your photo and delivery details so we can personalize your experience."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Profile picture */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-border">
              {image ? (
                <Image src={image || "/placeholder.svg"} alt="Profile preview" width={80} height={80} className="size-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-muted-foreground">{initials || "?"}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Upload profile picture"
              className="absolute -bottom-1 -right-1 inline-flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105"
            >
              <Camera className="size-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onPickImage} />
          </div>
          <div>
            <p className="text-sm font-medium">Profile picture</p>
            <p className="text-xs text-muted-foreground">PNG or JPG. Optional but recommended.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" name="phone" type="tel" required placeholder="+1 (555) 000-0000" autoComplete="tel" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" required placeholder="Street address" autoComplete="street-address" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" required placeholder="City" autoComplete="address-level2" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" required placeholder="State" autoComplete="address-level1" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input id="pincode" name="pincode" required placeholder="Postal / ZIP code" autoComplete="postal-code" />
        </div>

        <Button type="submit" className="h-11 text-sm" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {loading ? "Saving..." : "Save and continue"}
        </Button>
      </form>
    </AuthLayout>
  )
}

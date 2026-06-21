"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { RoleToggle, type Role } from "@/components/auth/role-toggle"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

export default function SignupPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>("buyer")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = new FormData(e.currentTarget)
    const name = String(form.get("name") || "").trim()
    const email = String(form.get("email") || "")
      .trim()
      .toLowerCase()
    const password = String(form.get("password") || "")

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setLoading(true)
    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
      // Custom field declared in lib/auth.ts additionalFields.
      role,
      callbackURL: "/complete-profile",
    } as Parameters<typeof authClient.signUp.email>[0])

    if (signUpError) {
      setLoading(false)
      const code = signUpError.code ?? ""
      const status = signUpError.status
      if (code === "USER_ALREADY_EXISTS" || status === 422) {
        setError("Account already exists. Please log in.")
      } else {
        setError(signUpError.message || "Could not create your account. Please try again.")
      }
      return
    }

    // New accounts always complete their profile before entering the app.
    router.push("/complete-profile")
    router.refresh()
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      subtitle="Join millions buying and selling on Saasum IQMart."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <RoleToggle value={role} onChange={setRole} />

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" required placeholder="Your full name" autoComplete="name" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
        </div>

        {role === "vendor" || role === "brand" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="store">{role === "brand" ? "Brand name" : "Store name"}</Label>
            <Input id="store" name="store" placeholder={role === "brand" ? "Your brand name" : "Your store name"} />
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" name="password" required placeholder="Create a password" autoComplete="new-password" />
          <p className="text-xs text-muted-foreground">Use 8+ characters with a mix of letters and numbers.</p>
        </div>

        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input type="checkbox" required className="mt-0.5 size-4 rounded border-border accent-primary" />
          <span>
            I agree to the{" "}
            <Link href="/" className="font-medium text-primary hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <Button type="submit" className="h-11 text-sm" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {loading ? "Creating account..." : `Create ${role} account`}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

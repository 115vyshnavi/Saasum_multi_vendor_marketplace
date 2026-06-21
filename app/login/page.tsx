"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") || "")
      .trim()
      .toLowerCase()
    const password = String(form.get("password") || "")

    setLoading(true)
    const { error: signInError } = await authClient.signIn.email({ email, password })

    if (signInError) {
      setLoading(false)
      // Better Auth returns a generic invalid-credentials error for both an
      // unknown email and a wrong password (to avoid leaking which emails are
      // registered). Surface a clear message either way.
      const code = signInError.code ?? ""
      if (code === "INVALID_EMAIL_OR_PASSWORD" || signInError.status === 401) {
        setError("Invalid credentials. Check your email and password, or sign up first.")
      } else {
        setError(signInError.message || "Could not sign you in. Please try again.")
      }
      return
    }

    // Resolve the right landing page server-side based on role / profile state.
    router.push("/post-auth")
    router.refresh()
  }

  return (
    <AuthLayout eyebrow="Welcome back" title="Log in to Saasum IQMart" subtitle="Continue shopping or manage your store.">
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="password" name="password" required placeholder="••••••••" autoComplete="current-password" />
        </div>

        <Button type="submit" className="h-11 text-sm" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {loading ? "Signing in..." : "Log in"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New to Saasum IQMart?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

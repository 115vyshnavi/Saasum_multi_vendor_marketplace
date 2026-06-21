"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, CheckCircle2, Loader2, MailCheck } from "lucide-react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState("")

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 900)
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title={sent ? "Check your inbox" : "Reset your password"}
      subtitle={
        sent
          ? undefined
          : "Enter the email linked to your account and we'll send you a reset link."
      }
    >
      {sent ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <span className="mt-0.5 inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MailCheck className="size-5" />
            </span>
            <div className="text-sm">
              <p className="font-medium">Reset link sent</p>
              <p className="mt-1 text-muted-foreground">
                We sent a password reset link to{" "}
                <span className="font-medium text-foreground">{email || "your email"}</span>. It expires in 30
                minutes.
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" /> Check your spam folder if you don&apos;t see it.
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" /> The link works only once.
            </li>
          </ul>

          <Button variant="outline" className="h-11 text-sm" onClick={() => setSent(false)}>
            Use a different email
          </Button>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-4" /> Back to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button type="submit" className="h-11 text-sm" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {loading ? "Sending..." : "Send reset link"}
          </Button>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-4" /> Back to log in
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}

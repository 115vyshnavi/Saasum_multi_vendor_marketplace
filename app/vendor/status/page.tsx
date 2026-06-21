import Link from "next/link"
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  FileCheck,
  HelpCircle,
  Hourglass,
  Mail,
  ShieldCheck,
} from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StatusTimeline } from "@/components/vendor/status-timeline"

const statusCards = [
  {
    label: "Documents",
    value: "Verified",
    hint: "4 of 4 approved",
    icon: FileCheck,
    tone: "success" as const,
  },
  {
    label: "Review stage",
    value: "In progress",
    hint: "Compliance team",
    icon: Hourglass,
    tone: "warning" as const,
  },
  {
    label: "Est. decision",
    value: "1–2 days",
    hint: "Mar 14 – Mar 15",
    icon: CalendarClock,
    tone: "neutral" as const,
  },
]

const toneStyles = {
  success: "bg-primary/10 text-primary",
  warning: "bg-accent/20 text-accent-foreground",
  neutral: "bg-muted text-muted-foreground",
}

export default function VendorStatusPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Application status</h1>
            <p className="mt-1 text-muted-foreground">Atelier Nord · submitted Mar 12, 2025</p>
          </div>
          <Badge variant="secondary" className="h-7 gap-1.5 px-3 text-sm">
            <Clock className="size-3.5" /> Under review
          </Badge>
        </div>

        {/* Hero status banner */}
        <Card className="mt-6 border-0 bg-primary text-primary-foreground ring-0">
          <CardContent className="flex flex-col gap-4 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary-foreground/15">
                <ShieldCheck className="size-6" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Your application is being reviewed</h2>
                <p className="mt-0.5 text-sm text-primary-foreground/80">
                  Most applications are approved within 1–2 business days. We&apos;ll email you the moment there&apos;s an update.
                </p>
              </div>
            </div>
            <Button variant="secondary" className="h-10 shrink-0 px-4">
              <Mail /> Notify me
            </Button>
          </CardContent>
        </Card>

        {/* Status cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {statusCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="flex items-start justify-between gap-3 py-1">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight">{card.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{card.hint}</p>
                </div>
                <span className={`flex size-10 items-center justify-center rounded-lg ${toneStyles[card.tone]}`}>
                  <card.icon className="size-5" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Timeline + help */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Review progress</CardTitle>
              <CardDescription>Track each stage of your seller verification.</CardDescription>
            </CardHeader>
            <CardContent>
              <StatusTimeline />
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>While you wait</CardTitle>
              <CardDescription>Get a head start on your store.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Prepare product photos and descriptions for a faster launch.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Set up your payout method in account settings.
                </p>
              </div>
              <Button variant="outline" className="mt-1 w-full" render={<Link href="/vendor/onboarding" />}>
                <HelpCircle /> Edit application
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

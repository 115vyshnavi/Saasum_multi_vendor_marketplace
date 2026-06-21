import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { OnboardingForm } from "@/components/vendor/onboarding-form"

export default function VendorOnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
        <div className="mt-4 mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Become a seller</h1>
          <p className="mt-1 text-pretty text-muted-foreground">
            Complete your vendor profile to start selling on Saasum IQMart. It only takes a few minutes.
          </p>
        </div>
        <OnboardingForm />
      </main>
    </div>
  )
}

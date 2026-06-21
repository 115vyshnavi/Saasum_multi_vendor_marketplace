import Link from "next/link"
import { ArrowRight, BarChart3, ClipboardList, Package, Rocket, Store, Wallet } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Reveal } from "@/components/reveal"

const benefits = [
  { icon: Wallet, title: "Zero setup fees", desc: "Open your storefront for free and pay only when you sell." },
  { icon: BarChart3, title: "Live analytics", desc: "Track sales, traffic, and conversion in real time." },
  { icon: Rocket, title: "Fast payouts", desc: "Get paid quickly with secure, scheduled settlements." },
]

const quickLinks = [
  {
    icon: ClipboardList,
    title: "Start onboarding",
    desc: "Complete your seller profile and verification.",
    href: "/vendor/onboarding",
    cta: "Begin setup",
  },
  {
    icon: Package,
    title: "Manage products",
    desc: "Add, edit, and organize your catalog.",
    href: "/vendor/products",
    cta: "Open catalog",
  },
  {
    icon: ClipboardList,
    title: "Manage orders",
    desc: "Track customer orders, manage shipments, and update tracking references.",
    href: "/vendor/orders",
    cta: "View orders",
  },
  {
    icon: Wallet,
    title: "Manage Payouts",
    desc: "Monitor your store ledger, review platform commission fees, and request payouts.",
    href: "/vendor/payouts",
    cta: "Disburse funds",
  },
  {
    icon: Store,
    title: "Application status",
    desc: "Track your vendor approval progress.",
    href: "/vendor/status",
    cta: "View status",
  },
]

export default function VendorPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNavbar authenticated />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-[-30%] size-[40rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
          </div>
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Store className="size-3.5" /> Sell on Saasum IQMart
            </span>
            <h1 className="mt-5 max-w-2xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Turn your products into a thriving business
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Reach millions of buyers with powerful seller tools, transparent fees, and the support you need to grow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="h-11 px-6 text-sm shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5"
                render={<Link href="/vendor/onboarding" />}
              >
                Become a seller
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-11 px-6 text-sm" render={<Link href="/vendor/products" />}>
                View seller dashboard
              </Button>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {benefits.map((b) => {
                const Icon = b.icon
                return (
                  <div key={b.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold">{b.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tight">Everything you need to sell</h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Jump straight into the tools that move your business forward.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {quickLinks.map((q) => {
              const Icon = q.icon
              return (
                <Card key={q.title} className="flex flex-col transition-shadow hover:shadow-lg">
                  <CardContent className="flex flex-1 flex-col py-2">
                    <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-6" />
                    </span>
                    <h3 className="mt-6 text-xl font-semibold">{q.title}</h3>
                    <p className="mt-2 flex-1 text-pretty text-muted-foreground">{q.desc}</p>
                    <Button variant="outline" className="mt-6 h-11 w-full" render={<Link href={q.href} />}>
                      {q.cta}
                      <ArrowRight className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

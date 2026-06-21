import { CreditCard, Gauge, Headphones, PackageCheck, ShieldCheck, Truck } from "lucide-react"
import { Reveal } from "@/components/reveal"

const features = [
  {
    icon: ShieldCheck,
    title: "Enterprise security",
    desc: "Bank-grade encryption, fraud protection, and verified sellers on every order.",
  },
  {
    icon: Truck,
    title: "Fast, tracked delivery",
    desc: "Real-time tracking and reliable logistics from cart to doorstep.",
  },
  {
    icon: Gauge,
    title: "Seller analytics",
    desc: "Understand your customers with live dashboards and actionable insights.",
  },
  {
    icon: CreditCard,
    title: "Flexible payments",
    desc: "Cards, wallets, and pay-later — checkout the way your customers prefer.",
  },
  {
    icon: PackageCheck,
    title: "Easy returns",
    desc: "Hassle-free returns and refunds backed by Saasum IQMart buyer protection.",
  },
  {
    icon: Headphones,
    title: "24/7 support",
    desc: "Real humans ready to help buyers and sellers around the clock.",
  },
]

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-y border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-medium text-primary">The Saasum advantage</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Commerce that feels effortless, on both sides of the cart
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <Reveal key={f.title} delay={i * 0.05}>
                <div className="h-full rounded-2xl border border-border bg-background p-6 shadow-sm transition-shadow hover:shadow-md">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

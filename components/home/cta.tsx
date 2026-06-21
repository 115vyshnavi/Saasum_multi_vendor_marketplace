import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/reveal"

const stats = [
  { value: "2M+", label: "Active buyers" },
  { value: "180k", label: "Sellers" },
  { value: "99.98%", label: "Uptime" },
  { value: "120+", label: "Countries" },
]

export function CallToAction() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-primary px-6 py-14 text-primary-foreground sm:px-12">
          <div className="pointer-events-none absolute -right-10 -top-10 size-60 rounded-full bg-primary-foreground/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 left-10 size-60 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Your next big move starts here
              </h2>
              <p className="mt-4 max-w-md text-pretty text-primary-foreground/80">
                Join a marketplace built for momentum. Shop, sell, and scale — all from one premium account.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-11 px-6 text-sm"
                  render={<Link href="/signup" />}
                >
                  Create free account
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 border-primary-foreground/30 bg-transparent px-6 text-sm text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  render={<Link href="/login" />}
                >
                  Log in
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-5 backdrop-blur-sm"
                >
                  <p className="text-3xl font-semibold">{s.value}</p>
                  <p className="mt-1 text-sm text-primary-foreground/75">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

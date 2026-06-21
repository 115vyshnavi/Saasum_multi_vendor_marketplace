"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Check, Crown, ShoppingBag, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/reveal"

const roles = [
  {
    id: "buyer",
    href: "/shop",
    icon: ShoppingBag,
    title: "For Smart Buyers",
    description: "Discover curated products from trusted sellers.",
    perks: ["Personalized feed", "1-tap reorder", "Buyer protection"],
    accent: "primary" as const,
  },
  {
    id: "vendor",
    href: "/vendor/onboarding",
    icon: Store,
    title: "For Ambitious Vendors",
    description: "Launch, manage, and scale your business.",
    perks: ["No setup fees", "Powerful analytics", "Fast payouts"],
    accent: "accent" as const,
  },
  {
    id: "brand",
    href: "/brand",
    icon: Crown,
    title: "For Growing Brands",
    description: "Build a premium digital storefront.",
    perks: ["Custom branding", "Verified badge", "Priority placement"],
    accent: "primary" as const,
  },
]

export function RoleSelection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-primary">Built for everyone</p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          One marketplace, every ambition
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          From first purchase to flagship brand — Saasum IQMart moves at the speed of your goals.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role, i) => {
          const Icon = role.icon
          return (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-xl"
            >
              <div
                className={cn(
                  "absolute -right-16 -top-16 size-44 rounded-full blur-2xl transition-opacity opacity-60 group-hover:opacity-100",
                  role.accent === "primary" ? "bg-primary/10" : "bg-accent/15",
                )}
              />
              <span
                className={cn(
                  "inline-flex size-12 items-center justify-center rounded-2xl",
                  role.accent === "primary"
                    ? "bg-primary/10 text-primary"
                    : "bg-accent/15 text-accent-foreground",
                )}
              >
                <Icon className="size-6" />
              </span>
              <h3 className="mt-6 text-xl font-semibold">{role.title}</h3>
              <p className="mt-2 text-pretty text-muted-foreground">{role.description}</p>

              <ul className="mt-6 flex flex-col gap-3">
                {role.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2.5 text-sm">
                    <span
                      className={cn(
                        "inline-flex size-5 items-center justify-center rounded-full",
                        role.accent === "primary"
                          ? "bg-primary/10 text-primary"
                          : "bg-accent/20 text-accent-foreground",
                      )}
                    >
                      <Check className="size-3" />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-2">
                <Button
                  className="h-11 w-full px-6 text-sm"
                  variant={role.accent === "primary" ? "default" : "outline"}
                  render={<Link href={role.href} />}
                >
                  Continue as {role.id}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

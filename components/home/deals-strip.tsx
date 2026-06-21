"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { ArrowRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

function pad(n: number) {
  return n.toString().padStart(2, "0")
}

export function DealsStrip() {
  // Counts down to the next midnight for a live "flash sale" feel.
  const [remaining, setRemaining] = useState<{ h: number; m: number; s: number }>({ h: 0, m: 0, s: 0 })

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const end = new Date(now)
      end.setHours(24, 0, 0, 0)
      const diff = Math.max(0, end.getTime() - now.getTime())
      setRemaining({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const units = [
    { label: "Hrs", value: remaining.h },
    { label: "Min", value: remaining.m },
    { label: "Sec", value: remaining.s },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-foreground px-6 py-6 text-background sm:flex-row sm:justify-between sm:px-8"
      >
        <div className="flex items-center gap-3 text-center sm:text-left">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Zap className="size-5" />
          </span>
          <div>
            <p className="text-lg font-semibold">Flash Sale — up to 70% off</p>
            <p className="text-sm text-background/70">Today&apos;s lightning deals end soon. Don&apos;t miss out.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {units.map((u) => (
              <div key={u.label} className="w-14 rounded-xl bg-background/10 py-2 text-center">
                <p className="font-mono text-xl font-semibold tabular-nums">{pad(u.value)}</p>
                <p className="text-[10px] uppercase tracking-wide text-background/60">{u.label}</p>
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            className="hidden h-11 gap-1.5 px-5 md:inline-flex"
            render={<Link href="/login" />}
          >
            Shop deals <ArrowRight className="size-4" />
          </Button>
        </div>
      </motion.div>
    </section>
  )
}

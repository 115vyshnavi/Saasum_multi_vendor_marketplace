"use client"

import { motion } from "motion/react"
import { ArrowDownRight, ArrowUpRight, Boxes, Layers, TriangleAlert, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { inventoryStats } from "@/lib/inventory"

export function InventoryStats() {
  const { totalSkus, totalUnits, stockValue, lowOrOut } = inventoryStats()

  const stats = [
    {
      label: "Stock value",
      value: `$${(stockValue / 1000).toFixed(1)}k`,
      change: "+8.4%",
      up: true,
      icon: Wallet,
      tone: "primary" as const,
    },
    {
      label: "Total units",
      value: totalUnits.toLocaleString(),
      change: "+3.1%",
      up: true,
      icon: Boxes,
      tone: "primary" as const,
    },
    {
      label: "Active SKUs",
      value: totalSkus.toLocaleString(),
      change: "+2",
      up: true,
      icon: Layers,
      tone: "primary" as const,
    },
    {
      label: "Low / out of stock",
      value: lowOrOut.toLocaleString(),
      change: "+3",
      up: false,
      icon: TriangleAlert,
      tone: "warn" as const,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s, i) => {
        const Icon = s.icon
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card>
              <CardContent className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</p>
                  <span
                    className={cn(
                      "mt-2 inline-flex items-center gap-1 text-xs font-medium",
                      s.up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
                    )}
                  >
                    {s.up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                    {s.change}
                    <span className="text-muted-foreground">this week</span>
                  </span>
                </div>
                <span
                  className={cn(
                    "inline-flex size-10 items-center justify-center rounded-xl",
                    s.tone === "warn"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="size-5" />
                </span>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

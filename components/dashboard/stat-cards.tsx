"use client"

import { motion } from "motion/react"
import { ArrowDownRight, ArrowUpRight, DollarSign, Package, ShoppingCart, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCards({ stats }: { stats?: Array<{ label: string; value: string; change: string; up: boolean; icon: any }> }) {
  const defaultStats = [
    { label: "Total revenue", value: "—", change: "No data", up: true, icon: DollarSign },
    { label: "Orders", value: "—", change: "No data", up: true, icon: ShoppingCart },
    { label: "Customers", value: "—", change: "No data", up: true, icon: Users },
    { label: "Returns", value: "—", change: "No data", up: false, icon: Package },
  ]

  const displayStats = stats && stats.length > 0 ? stats : defaultStats

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {displayStats.map((s, i) => {
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
                      s.up ? "text-primary" : "text-destructive",
                    )}
                  >
                    {s.up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                    {s.change}
                    <span className="text-muted-foreground">vs last month</span>
                  </span>
                </div>
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
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

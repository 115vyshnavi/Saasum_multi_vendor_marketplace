"use client"

import { motion } from "motion/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { categoryStock, stockMovement } from "@/lib/inventory"

const ease = [0.22, 1, 0.36, 1] as const

const categoryColors = ["bg-primary", "bg-sky-400", "bg-emerald-500", "bg-amber-500"]

export function StockMovementChart() {
  const max = Math.max(...stockMovement.flatMap((d) => [d.inbound, d.outbound]))
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Stock movement</CardTitle>
            <CardDescription>Units received vs shipped over the last 14 days</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-primary" /> Inbound
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-sky-400" /> Outbound
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1.5 sm:gap-2">
          {stockMovement.map((d, i) => (
            <div key={d.d} className="group flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-48 w-full items-end justify-center gap-0.5">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.inbound / max) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.03, ease }}
                  className="w-1/2 rounded-t-sm bg-primary/85 transition-colors group-hover:bg-primary"
                  title={`Inbound ${d.inbound}`}
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.outbound / max) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.03 + 0.04, ease }}
                  className="w-1/2 rounded-t-sm bg-sky-400/85 transition-colors group-hover:bg-sky-400"
                  title={`Outbound ${d.outbound}`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.d}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function CategoryDistribution() {
  const total = categoryStock.reduce((sum, c) => sum + c.units, 0)
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Stock by category</CardTitle>
        <CardDescription>Units on hand across departments</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {categoryStock.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ width: 0 }}
              animate={{ width: `${(c.units / total) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.08, ease }}
              className={categoryColors[i % categoryColors.length]}
              title={`${c.name}: ${c.units}`}
            />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {categoryStock.map((c, i) => (
            <div key={c.name} className="flex items-center gap-3">
              <span className={`size-2.5 shrink-0 rounded-sm ${categoryColors[i % categoryColors.length]}`} />
              <span className="min-w-0 flex-1 truncate text-sm">{c.name}</span>
              <span className="text-sm font-medium tabular-nums">{c.units.toLocaleString()}</span>
              <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                {Math.round((c.units / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

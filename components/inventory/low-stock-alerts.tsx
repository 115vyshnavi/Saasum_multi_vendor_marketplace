"use client"

import Image from "next/image"
import { motion } from "motion/react"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { lowStockItems, stockLevel, stockLevelMeta } from "@/lib/inventory"

const ease = [0.22, 1, 0.36, 1] as const

export function LowStockAlerts() {
  const items = lowStockItems()

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="size-4 text-amber-500" />
              Low stock alerts
            </CardTitle>
            <CardDescription>Items at or below their reorder point</CardDescription>
          </div>
          <span className="inline-flex h-6 items-center justify-center rounded-full bg-amber-500/15 px-2.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            {items.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item, i) => {
          const meta = stockLevelMeta[stockLevel(item)]
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease }}
              className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3"
            >
              <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
                <Image src={item.image || "/placeholder.svg"} alt={item.name} fill sizes="44px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  SKU {item.sku} · Reorder at {item.reorderPoint}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={cn("text-sm font-semibold tabular-nums", item.stock === 0 ? "text-destructive" : "text-amber-600 dark:text-amber-400")}>
                  {item.stock} left
                </span>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", meta.className)}>
                  <span className={cn("size-1.5 rounded-full", meta.dot)} />
                  {meta.label}
                </span>
              </div>
            </motion.div>
          )
        })}
        <Button variant="outline" className="mt-1 h-10 w-full text-sm">
          Create purchase order
        </Button>
      </CardContent>
    </Card>
  )
}

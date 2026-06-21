"use client"

import { motion } from "motion/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
  { m: "Jan", v: 42 },
  { m: "Feb", v: 55 },
  { m: "Mar", v: 48 },
  { m: "Apr", v: 67 },
  { m: "May", v: 72 },
  { m: "Jun", v: 61 },
  { m: "Jul", v: 84 },
  { m: "Aug", v: 78 },
  { m: "Sep", v: 92 },
]

export function SalesOverview() {
  const max = Math.max(...data.map((d) => d.v))
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Sales overview</CardTitle>
        <CardDescription>Revenue performance over the last 9 months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 sm:gap-3">
          {data.map((d, i) => (
            <div key={d.m} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-56 w-full items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.v / max) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full rounded-t-md bg-primary/80 transition-colors hover:bg-primary"
                  title={`${d.m}: $${d.v}k`}
                />
              </div>
              <span className="text-xs text-muted-foreground">{d.m}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

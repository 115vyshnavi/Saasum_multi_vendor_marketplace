"use client"

import { ArrowDownLeft, ArrowUpRight, RotateCcw, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { stockTransactions, txnMeta, type StockTxn } from "@/lib/inventory"

function TxnIcon({ type }: { type: StockTxn["type"] }) {
  const map = {
    inbound: ArrowDownLeft,
    outbound: ArrowUpRight,
    adjustment: SlidersHorizontal,
    return: RotateCcw,
  } as const
  const Icon = map[type]
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
        type === "inbound" || type === "return"
          ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
          : type === "adjustment"
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            : "bg-primary/10 text-primary",
      )}
    >
      <Icon className="size-4" />
    </span>
  )
}

export function TransactionHistory() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Transaction history</CardTitle>
            <CardDescription>Recent stock movements across all SKUs</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View all
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-5 py-3">Type</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-5 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {stockTransactions.map((txn) => (
                <tr key={txn.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <TxnIcon type={txn.type} />
                      <Badge className={cn("h-5", txnMeta[txn.type].className)}>{txnMeta[txn.type].label}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="truncate font-medium">{txn.product}</p>
                    <p className="truncate text-xs text-muted-foreground">SKU {txn.sku}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{txn.ref}</td>
                  <td className="px-4 py-3 text-muted-foreground">{txn.by}</td>
                  <td
                    className={cn(
                      "px-4 py-3 font-semibold tabular-nums",
                      txn.qty > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
                    )}
                  >
                    {txn.qty > 0 ? `+${txn.qty}` : txn.qty}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">{txn.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

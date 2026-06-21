import { Download, Plus } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { Button } from "@/components/ui/button"
import { InventoryStats } from "@/components/inventory/inventory-stats"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { LowStockAlerts } from "@/components/inventory/low-stock-alerts"
import { TransactionHistory } from "@/components/inventory/transaction-history"
import { CategoryDistribution, StockMovementChart } from "@/components/inventory/inventory-charts"

export const metadata = {
  title: "Inventory · Saasum IQMart",
  description: "Track stock levels, low-stock alerts, analytics, and transaction history across fulfilment centres.",
}

export default function InventoryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Inventory</h1>
            <p className="mt-1 text-muted-foreground">
              Monitor stock health, replenishment, and movement in real time.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-10 px-4 text-sm">
              <Download className="size-4" /> Export
            </Button>
            <Button className="h-10 px-4 text-sm">
              <Plus className="size-4" /> New purchase order
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <InventoryStats />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <StockMovementChart />
          </div>
          <CategoryDistribution />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <InventoryTable />
          </div>
          <LowStockAlerts />
        </div>

        <div className="mt-6">
          <TransactionHistory />
        </div>
      </main>
    </div>
  )
}

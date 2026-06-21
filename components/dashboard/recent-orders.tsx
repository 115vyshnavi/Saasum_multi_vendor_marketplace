import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Status = "Delivered" | "Shipped" | "Processing" | "Cancelled"

const orders: { id: string; customer: string; item: string; total: string; status: Status }[] = [
  { id: "#NM-7821", customer: "Marcus Lee", item: "Aero Runner Sneakers", total: "$129.00", status: "Delivered" },
  { id: "#NM-7820", customer: "Priya Nair", item: "Linen Overshirt", total: "$84.50", status: "Shipped" },
  { id: "#NM-7819", customer: "Tom Becker", item: "Wireless Earbuds Pro", total: "$159.00", status: "Processing" },
  { id: "#NM-7818", customer: "Sara Kim", item: "Ceramic Mug Set", total: "$42.00", status: "Delivered" },
  { id: "#NM-7817", customer: "Diego Alvarez", item: "Canvas Backpack", total: "$76.00", status: "Cancelled" },
]

const statusStyles: Record<Status, string> = {
  Delivered: "bg-primary/10 text-primary",
  Shipped: "bg-accent/20 text-accent-foreground",
  Processing: "bg-muted text-muted-foreground",
  Cancelled: "bg-destructive/10 text-destructive",
}

export function RecentOrders() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
        <CardDescription>Your latest store activity</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="hidden px-6 py-3 font-medium sm:table-cell">Item</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40">
                  <td className="px-6 py-3.5 font-medium">{o.id}</td>
                  <td className="px-6 py-3.5">{o.customer}</td>
                  <td className="hidden px-6 py-3.5 text-muted-foreground sm:table-cell">{o.item}</td>
                  <td className="px-6 py-3.5 font-medium">{o.total}</td>
                  <td className="px-6 py-3.5 text-right">
                    <Badge className={cn("border-transparent font-medium", statusStyles[o.status])}>
                      {o.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

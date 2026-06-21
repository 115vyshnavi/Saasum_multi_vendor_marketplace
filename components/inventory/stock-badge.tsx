import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { stockLevel, stockLevelMeta, type InventoryItem } from "@/lib/inventory"

export function StockBadge({
  item,
  className,
}: {
  item: Pick<InventoryItem, "stock" | "reorderPoint">
  className?: string
}) {
  const level = stockLevel(item)
  const meta = stockLevelMeta[level]
  return (
    <Badge className={cn("h-6 gap-1.5 px-2", meta.className, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </Badge>
  )
}

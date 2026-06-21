export type StockLevel = "in-stock" | "low-stock" | "out-of-stock" | "overstock"

export type InventoryItem = {
  id: string
  name: string
  image: string
  sku: string
  category: string
  warehouse: string
  stock: number
  reserved: number
  reorderPoint: number
  price: number
  sold30d: number
  updated: string
}

export type StockTxn = {
  id: string
  sku: string
  product: string
  type: "inbound" | "outbound" | "adjustment" | "return"
  qty: number
  by: string
  ref: string
  time: string
}

export function stockLevel(item: Pick<InventoryItem, "stock" | "reorderPoint">): StockLevel {
  if (item.stock === 0) return "out-of-stock"
  if (item.stock <= item.reorderPoint) return "low-stock"
  if (item.stock > item.reorderPoint * 6) return "overstock"
  return "in-stock"
}

export const stockLevelMeta: Record<StockLevel, { label: string; className: string; dot: string }> = {
  "in-stock": {
    label: "In stock",
    className: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  "low-stock": {
    label: "Low stock",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  "out-of-stock": {
    label: "Out of stock",
    className: "bg-destructive/12 text-destructive",
    dot: "bg-destructive",
  },
  overstock: {
    label: "Overstock",
    className: "bg-primary/12 text-primary",
    dot: "bg-primary",
  },
}

export const txnMeta: Record<StockTxn["type"], { label: string; className: string }> = {
  inbound: { label: "Inbound", className: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" },
  outbound: { label: "Outbound", className: "bg-primary/12 text-primary" },
  adjustment: { label: "Adjustment", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  return: { label: "Return", className: "bg-secondary text-secondary-foreground" },
}

export const inventoryItems: InventoryItem[] = [
  {
    id: "i1",
    name: "Aura Wireless Headphones",
    image: "/products/headphones.png",
    sku: "AUR-HP-01",
    category: "Electronics",
    warehouse: "Mumbai FC",
    stock: 184,
    reserved: 22,
    reorderPoint: 40,
    price: 129,
    sold30d: 412,
    updated: "2h ago",
  },
  {
    id: "i2",
    name: "Pulse Fitness Smartwatch",
    image: "/products/smartwatch.png",
    sku: "PLS-SW-02",
    category: "Electronics",
    warehouse: "Delhi FC",
    stock: 42,
    reserved: 14,
    reorderPoint: 45,
    price: 89,
    sold30d: 388,
    updated: "5h ago",
  },
  {
    id: "i3",
    name: "Stride Running Sneakers",
    image: "/products/sneakers.png",
    sku: "STR-SN-03",
    category: "Fashion",
    warehouse: "Bengaluru FC",
    stock: 9,
    reserved: 6,
    reorderPoint: 30,
    price: 74,
    sold30d: 256,
    updated: "1h ago",
  },
  {
    id: "i4",
    name: "Halo Tortoise Sunglasses",
    image: "/products/sunglasses.png",
    sku: "HAL-SG-04",
    category: "Fashion",
    warehouse: "Bengaluru FC",
    stock: 0,
    reserved: 0,
    reorderPoint: 25,
    price: 45,
    sold30d: 98,
    updated: "30m ago",
  },
  {
    id: "i5",
    name: "Trek Canvas Backpack",
    image: "/products/backpack.png",
    sku: "TRK-BP-05",
    category: "Sports & Outdoors",
    warehouse: "Mumbai FC",
    stock: 67,
    reserved: 9,
    reorderPoint: 35,
    price: 59,
    sold30d: 174,
    updated: "3h ago",
  },
  {
    id: "i6",
    name: "Brew Pro Espresso Maker",
    image: "/products/coffee-maker.png",
    sku: "BRW-EM-06",
    category: "Home & Kitchen",
    warehouse: "Delhi FC",
    stock: 23,
    reserved: 4,
    reorderPoint: 30,
    price: 219,
    sold30d: 142,
    updated: "6h ago",
  },
  {
    id: "i7",
    name: "Lumen Smart Desk Lamp",
    image: "/products/headphones.png",
    sku: "LUM-DL-07",
    category: "Home & Kitchen",
    warehouse: "Mumbai FC",
    stock: 512,
    reserved: 18,
    reorderPoint: 40,
    price: 39,
    sold30d: 95,
    updated: "8h ago",
  },
  {
    id: "i8",
    name: "Nimbus Yoga Mat",
    image: "/products/backpack.png",
    sku: "NMB-YM-08",
    category: "Sports & Outdoors",
    warehouse: "Bengaluru FC",
    stock: 12,
    reserved: 3,
    reorderPoint: 20,
    price: 29,
    sold30d: 210,
    updated: "45m ago",
  },
]

export const stockTransactions: StockTxn[] = [
  {
    id: "t1",
    sku: "AUR-HP-01",
    product: "Aura Wireless Headphones",
    type: "inbound",
    qty: 120,
    by: "Pixel Forge",
    ref: "PO-48213",
    time: "Today, 9:42 AM",
  },
  {
    id: "t2",
    sku: "STR-SN-03",
    product: "Stride Running Sneakers",
    type: "outbound",
    qty: -34,
    by: "Order fulfilment",
    ref: "ORD-99821",
    time: "Today, 8:15 AM",
  },
  {
    id: "t3",
    sku: "HAL-SG-04",
    product: "Halo Tortoise Sunglasses",
    type: "outbound",
    qty: -12,
    by: "Order fulfilment",
    ref: "ORD-99810",
    time: "Yesterday, 6:30 PM",
  },
  {
    id: "t4",
    sku: "NMB-YM-08",
    product: "Nimbus Yoga Mat",
    type: "adjustment",
    qty: -5,
    by: "Cycle count",
    ref: "ADJ-00412",
    time: "Yesterday, 3:11 PM",
  },
  {
    id: "t5",
    sku: "PLS-SW-02",
    product: "Pulse Fitness Smartwatch",
    type: "return",
    qty: 7,
    by: "Customer return",
    ref: "RET-20194",
    time: "Yesterday, 1:05 PM",
  },
  {
    id: "t6",
    sku: "BRW-EM-06",
    product: "Brew Pro Espresso Maker",
    type: "inbound",
    qty: 60,
    by: "Kettle & Co.",
    ref: "PO-48198",
    time: "Mar 14, 11:20 AM",
  },
  {
    id: "t7",
    sku: "TRK-BP-05",
    product: "Trek Canvas Backpack",
    type: "outbound",
    qty: -28,
    by: "Order fulfilment",
    ref: "ORD-99744",
    time: "Mar 14, 9:02 AM",
  },
]

// 14-day stock movement (units in / out)
export const stockMovement = [
  { d: "01", inbound: 80, outbound: 62 },
  { d: "02", inbound: 40, outbound: 71 },
  { d: "03", inbound: 120, outbound: 58 },
  { d: "04", inbound: 0, outbound: 84 },
  { d: "05", inbound: 60, outbound: 66 },
  { d: "06", inbound: 90, outbound: 95 },
  { d: "07", inbound: 30, outbound: 78 },
  { d: "08", inbound: 110, outbound: 70 },
  { d: "09", inbound: 50, outbound: 88 },
  { d: "10", inbound: 70, outbound: 64 },
  { d: "11", inbound: 130, outbound: 102 },
  { d: "12", inbound: 20, outbound: 90 },
  { d: "13", inbound: 95, outbound: 73 },
  { d: "14", inbound: 60, outbound: 81 },
]

export const categoryStock = [
  { name: "Electronics", units: 738 },
  { name: "Fashion", units: 21 },
  { name: "Home & Kitchen", units: 535 },
  { name: "Sports & Outdoors", units: 79 },
]

export function inventoryStats() {
  const totalSkus = inventoryItems.length
  const totalUnits = inventoryItems.reduce((sum, i) => sum + i.stock, 0)
  const stockValue = inventoryItems.reduce((sum, i) => sum + i.stock * i.price, 0)
  const lowOrOut = inventoryItems.filter((i) => {
    const lvl = stockLevel(i)
    return lvl === "low-stock" || lvl === "out-of-stock"
  }).length
  return { totalSkus, totalUnits, stockValue, lowOrOut }
}

export function lowStockItems() {
  return inventoryItems
    .filter((i) => {
      const lvl = stockLevel(i)
      return lvl === "low-stock" || lvl === "out-of-stock"
    })
    .sort((a, b) => a.stock - b.stock)
}

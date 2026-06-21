export type ProductStatus = "active" | "draft" | "pending" | "rejected"

export type ProductVariant = {
  id: string
  name: string
  sku: string
  price: number
  stock: number
}

export type Product = {
  id: string
  name: string
  image: string
  category: string
  price: number
  compareAt?: number
  stock: number
  status: ProductStatus
  rating: number
  reviews: number
  sales: number
  sku: string
  vendor: string
  submitted: string
  variants?: number
}

export type DatabaseProduct = {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  price: string
  compareAtPrice: string | null
  stock: number
  sku: string
  rating: string
  reviewCount: number
  images: string[] | null
  status: ProductStatus
  isActive: boolean
  createdAt: Date
  category: {
    id: number
    name: string
    slug: string
  } | null
  vendor: {
    id: string
    name: string
  } | null
}

export const statusMeta: Record<ProductStatus, { label: string; className: string; dot: string }> = {
  active: { label: "Active", className: "bg-primary/12 text-primary", dot: "bg-primary" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  pending: { label: "Pending review", className: "bg-accent/25 text-accent-foreground", dot: "bg-accent-foreground" },
  rejected: { label: "Rejected", className: "bg-destructive/12 text-destructive", dot: "bg-destructive" },
}

export const stockTone = (stock: number) =>
  stock === 0
    ? "text-destructive"
    : stock < 15
      ? "text-accent-foreground"
      : "text-muted-foreground"

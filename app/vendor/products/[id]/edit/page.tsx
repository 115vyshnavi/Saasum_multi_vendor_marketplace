import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { ProductWizard } from "@/components/products/product-wizard"
import { getProduct } from "@/lib/products"

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = getProduct(id)
  if (!product) notFound()

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/vendor/products" className="transition-colors hover:text-foreground">
            Products
          </Link>
          <ChevronRight className="size-4" />
          <span className="truncate font-medium text-foreground">{product.name}</span>
        </nav>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Edit product</h1>
        <p className="mt-1 text-muted-foreground">
          Update details, media, pricing, and inventory for this listing.
        </p>

        <div className="mt-8">
          <ProductWizard product={product} />
        </div>
      </main>
    </div>
  )
}

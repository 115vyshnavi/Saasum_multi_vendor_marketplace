import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { ProductWizard } from "@/components/products/product-wizard"

export default function NewProductPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/vendor/products" className="transition-colors hover:text-foreground">
            Products
          </Link>
          <ChevronRight className="size-4" />
          <span className="font-medium text-foreground">Add product</span>
        </nav>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Add a new product</h1>
        <p className="mt-1 text-muted-foreground">
          Complete the steps below to list a new product on the marketplace.
        </p>

        <div className="mt-8">
          <ProductWizard />
        </div>
      </main>
    </div>
  )
}

import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Hero } from "@/components/home/hero"
import { Categories } from "@/components/home/categories"
import { DealsStrip } from "@/components/home/deals-strip"
import { Trending } from "@/components/home/trending"
import { RoleSelection } from "@/components/home/role-selection"
import { Features } from "@/components/home/features"
import { CallToAction } from "@/components/home/cta"
import { getActiveProducts, getCategories } from "@/lib/products"

export default async function HomePage() {
  // Fetch real data from database
  const [products, categories] = await Promise.all([
    getActiveProducts(),
    getCategories()
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNavbar />
      <main className="flex-1">
        <Hero />
        <Categories categories={categories} />
        <DealsStrip />
        <Trending products={products} />
        <RoleSelection />
        <Features />
        <CallToAction />
      </main>
      <SiteFooter />
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion } from "motion/react"
import { Check, Search, ShoppingBag, Star } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { type DatabaseProduct } from "@/lib/products-shared"
import { useCart } from "@/components/cart-provider"

const ease = [0.22, 1, 0.36, 1] as const

type BuyerPageProps = {
  initialProducts: DatabaseProduct[]
  categories: Array<{ id: number; name: string; slug: string; description: string | null; image: string | null }>
}

export default function BuyerPageClient({ initialProducts, categories }: BuyerPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { cartItems, addToCart, removeFromCart } = useCart()
  const [query, setQuery] = useState("")

  const currentCategorySlug = searchParams.get("category")
  const active = useMemo(() => {
    if (!currentCategorySlug) return "All"
    const cat = categories.find(c => c.slug === currentCategorySlug)
    return cat ? cat.name : "All"
  }, [currentCategorySlug, categories])

  const filters = ["All", ...categories.map(cat => cat.name)]

  const products = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchCat = active === "All" || p.category?.name === active
      const matchQuery = p.name.toLowerCase().includes(query.trim().toLowerCase())
      return matchCat && matchQuery
    })
  }, [active, query, initialProducts])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNavbar authenticated />
      <main className="flex-1">
        <section className="border-b border-border bg-card/40">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <p className="text-sm font-medium text-primary">Marketplace</p>
            <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Discover products from trusted sellers
            </h1>
            <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
              Hand-picked items across every category, backed by buyer protection on every order.
            </p>

            <div className="mt-6 flex max-w-2xl items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for products, brands, categories..."
                  className="h-12 pl-9 pr-4 text-base shadow-lg"
                  aria-label="Search products"
                />
                {query && (
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-card shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground px-2 py-1">
                        {products.length} results for "{query}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <Button render={<Link href="/signup" />} className="h-12 px-6">Sign up to buy</Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? 'product' : 'products'} found
              {active !== "All" && ` in ${active}`}
              {query && ` matching "${query}"`}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  if (f === "All") {
                    params.delete("category")
                  } else {
                    const cat = categories.find(c => c.name === f)
                    if (cat) {
                      params.set("category", cat.slug)
                    }
                  }
                  router.push(`${pathname}?${params.toString()}`)
                }}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-all hover:scale-105",
                  active === f
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:shadow-sm",
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {products.length === 0 ? (
            <p className="mt-16 text-center text-muted-foreground">No products match your search.</p>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p, i) => {
                const inCart = cartItems.some((item) => item.id === p.id)
                const price = parseFloat(p.price)
                const comparePrice = p.compareAtPrice ? parseFloat(p.compareAtPrice) : null
                const discount = comparePrice ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0
                
                return (
                  <motion.article
                    key={p.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease }}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <Link href={`/product/${p.id}`} className="relative aspect-[4/3] overflow-hidden bg-secondary">
                      <Image
                        src={(p.images && p.images[0]) || "/placeholder.svg"}
                        alt={p.name}
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {discount > 0 && (
                        <span className="absolute right-3 top-3 rounded-full bg-destructive px-2 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                          -{discount}%
                        </span>
                      )}
                    </Link>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-muted-foreground">{p.category?.name}</p>
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{parseFloat(p.rating).toFixed(1)}</span>
                        </div>
                      </div>
                      <h3 className="mt-1.5 line-clamp-1 text-sm font-semibold leading-snug">
                        <Link href={`/product/${p.id}`}>{p.name}</Link>
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">by {p.vendor?.name}</p>

                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-lg font-semibold">${price.toFixed(2)}</span>
                        {comparePrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${comparePrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <Button
                        className="mt-4 h-9 w-full"
                        variant={inCart ? "outline" : "default"}
                        onClick={() => {
                          if (inCart) {
                            removeFromCart(p.id)
                          } else {
                            addToCart({
                              id: p.id,
                              name: p.name,
                              price: price,
                              image: (p.images && p.images[0]) || "/placeholder.svg",
                              vendorName: p.vendor?.name,
                            })
                          }
                        }}
                      >
                        {inCart ? (
                          <>
                            <Check className="size-4" /> Added
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="size-4" /> Add to cart
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
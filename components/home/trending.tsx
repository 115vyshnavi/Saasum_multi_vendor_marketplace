"use client"

import Image from "next/image"
import { motion } from "motion/react"
import { Check, Heart, ShoppingCart, Star } from "lucide-react"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-provider"
import { type DatabaseProduct } from "@/lib/products-shared"

type TrendingProps = {
  products: DatabaseProduct[]
}

const ease = [0.22, 1, 0.36, 1] as const

export function Trending({ products }: TrendingProps) {
  const { cartItems, addToCart, removeFromCart } = useCart()
  // Show only first 6 products for trending section
  const trendingProducts = products.slice(0, 6)

  return (
    <section className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <Reveal className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-accent-foreground">
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-accent-foreground">Trending now</span>
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Handpicked deals shoppers love
            </h2>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-3">
          {trendingProducts.map((product, i) => {
            const inCart = cartItems.some((item) => item.id === product.id)
            const price = parseFloat(product.price)
            const comparePrice = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null
            const discount = comparePrice ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0
            
            return (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.06, ease }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                  <Image
                    src={(product.images && product.images[0]) || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 30vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {discount > 0 && (
                    <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground shadow-sm">
                      -{discount}%
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Add ${product.name} to wishlist`}
                    className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur transition-colors hover:text-destructive"
                  >
                    <Heart className="size-4" />
                  </button>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3.5 fill-accent text-accent" />
                    <span className="font-medium text-foreground">{parseFloat(product.rating).toFixed(1)}</span>
                    <span>({product.reviewCount.toLocaleString()})</span>
                  </div>
                  <h3 className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">by {product.vendor?.name}</p>

                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold">${price.toFixed(2)}</span>
                      {comparePrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${comparePrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={inCart ? "outline" : "default"}
                      className="h-9 gap-1.5 px-3 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100"
                      aria-label={inCart ? `Remove ${product.name} from cart` : `Add ${product.name} to cart`}
                      onClick={() => {
                        if (inCart) {
                          removeFromCart(product.id)
                        } else {
                          addToCart({
                            id: product.id,
                            name: product.name,
                            price: price,
                            image: (product.images && product.images[0]) || "/placeholder.svg",
                            vendorName: product.vendor?.name,
                          })
                        }
                      }}
                    >
                      {inCart ? (
                        <>
                          <Check className="size-4" />
                          <span className="hidden sm:inline">Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="size-4" />
                          <span className="hidden sm:inline">Add</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

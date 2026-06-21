"use client"

import Image from "next/image"
import Link from "next/link"
import { Check, ShoppingCart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-provider"
import { motion } from "motion/react"

interface RecommendationProduct {
  id: string
  name: string
  price: string
  compareAtPrice: string | null
  rating: string
  reviewCount: number
  images: string[] | null
  brand: string | null
  vendorName?: string
  vendor?: {
    name: string
  }
}

interface RecommendationsProps {
  products: RecommendationProduct[]
  title: string
}

const ease = [0.22, 1, 0.36, 1] as const

export function Recommendations({ products, title }: RecommendationsProps) {
  const { cartItems, addToCart, removeFromCart } = useCart()

  if (products.length === 0) return null

  return (
    <section className="mt-16 border-t border-border pt-12">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      
      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product, i) => {
          const inCart = cartItems.some((item) => item.id === product.id)
          const price = parseFloat(product.price)
          const comparePrice = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null
          const discount = comparePrice ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0
          const vendorName = product.vendor?.name || product.vendorName || "SaaSum Seller"

          return (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05, ease }}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                <Link href={`/product/${product.id}`} className="absolute inset-0 z-10">
                  <Image
                    src={(product.images && product.images[0]) || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 20vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
                {discount > 0 && (
                  <span className="absolute left-2.5 top-2.5 z-20 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground shadow-sm">
                    -{discount}%
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-3.5">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Star className="size-3 fill-accent text-accent" />
                  <span className="font-medium text-foreground">{parseFloat(product.rating || "0").toFixed(1)}</span>
                  <span>({product.reviewCount || 0})</span>
                </div>
                
                <h3 className="mt-1 line-clamp-1 text-xs font-semibold leading-snug hover:text-accent">
                  <Link href={`/product/${product.id}`}>{product.name}</Link>
                </h3>
                
                <p className="mt-0.5 text-[10px] text-muted-foreground">by {vendorName}</p>

                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold">${price.toFixed(2)}</span>
                    {comparePrice && (
                      <span className="text-[10px] text-muted-foreground line-through">
                        ${comparePrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant={inCart ? "outline" : "default"}
                    className="h-8 w-8 p-0"
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
                          vendorName: vendorName,
                        })
                      }
                    }}
                  >
                    {inCart ? <Check className="size-3.5" /> : <ShoppingCart className="size-3.5" />}
                  </Button>
                </div>
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}

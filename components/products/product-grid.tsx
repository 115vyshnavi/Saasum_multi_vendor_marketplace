"use client"

import { motion } from "motion/react"
import { ProductCard } from "@/components/products/product-card"
import type { Product } from "@/lib/products-shared"

const ease = [0.22, 1, 0.36, 1] as const

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05, ease }}
        >
          <ProductCard product={p} />
        </motion.div>
      ))}
    </div>
  )
}

"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { Reveal } from "@/components/reveal"

type Category = {
  id: number
  name: string
  slug: string
  description: string | null
  image: string | null
}

type CategoriesProps = {
  categories: Category[]
}

const ease = [0.22, 1, 0.36, 1] as const

export function Categories({ categories }: CategoriesProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <Reveal className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Browse the marketplace</p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Shop by category</h2>
        </div>
        <Link
          href="/shop"
          className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:inline-flex"
        >
          View all <ArrowRight className="size-4" />
        </Link>
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((category, i) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.03, ease }}
          >
            <Link
              href={`/shop?category=${category.slug}`}
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-white to-gray-50 shadow-sm transition-all hover:scale-105 hover:shadow-xl dark:from-gray-800 dark:to-gray-900"
            >
              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/5 to-sky-100/50 dark:from-primary/10 dark:to-sky-900/20">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={`${category.name} category`}
                    fill
                    sizes="(min-width: 1024px) 16vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <span className="text-4xl font-bold text-primary/20">
                      {category.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-bold text-foreground">{category.name}</p>
                {category.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{category.description}</p>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

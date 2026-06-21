"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Flame, ShieldCheck, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

const ease = [0.22, 1, 0.36, 1] as const

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50/30 to-background dark:from-sky-950/20 dark:via-blue-950/10 dark:to-background">
      {/* Animated sky-blue background effects */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-pulse-glow absolute left-1/2 top-[-15%] size-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-sky-400/40 via-blue-400/30 to-primary/20 blur-[120px]" />
        <div className="animate-pulse-glow absolute right-[-10%] top-[20%] size-[35rem] rounded-full bg-gradient-to-br from-blue-400/30 via-sky-300/20 to-primary/10 blur-[100px]" style={{ animationDelay: '1s' }} />
        <div className="animate-pulse-glow absolute bottom-[-10%] left-[-5%] size-[40rem] rounded-full bg-gradient-to-br from-primary/20 via-sky-400/20 to-blue-300/10 blur-[100px]" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent,var(--background)_70%)]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 pb-20 pt-20 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pb-28 lg:pt-28">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold text-primary shadow-premium"
          >
            <Flame className="size-4 text-primary" />
            <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent font-bold">
              New season is live
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="mt-6 text-balance text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Buy smarter.
            <br />
            Sell faster.
            <br />
            <span className="gradient-text">Scale bigger.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            Premium multi-vendor marketplace built for modern commerce. Experience seamless shopping with AI-powered recommendations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Button
              size="lg"
              className="h-12 px-8 text-base shadow-xl shadow-primary/30 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/40"
              render={<Link href="/signup" />}
            >
              Get started free
              <ArrowRight className="size-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-12 px-8 text-base glass transition-all hover:-translate-y-1" 
              render={<Link href="/shop" />}
            >
              Explore marketplace
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-muted-foreground"
          >
            <span className="inline-flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="size-4 text-primary" />
              </span>
              Secure checkout
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-amber-500/10">
                <Star className="size-4 fill-amber-400 text-amber-400" />
              </span>
              4.9/5 from 12k+ reviews
            </span>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease }}
            className="mt-12 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 border-t border-border/50 pt-8 sm:grid-cols-4"
          >
            {[
              { value: "1.2M+", label: "Happy buyers" },
              { value: "85K+", label: "Trusted sellers" },
              { value: "4.9★", label: "Avg. rating" },
              { value: "24h", label: "Express delivery" },
            ].map((s) => (
              <div key={s.label} className="space-y-1">
                <dt className="text-3xl font-bold tracking-tight gradient-text">{s.value}</dt>
                <dd className="text-xs text-muted-foreground font-medium">{s.label}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="relative"
        >
          <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-tr from-primary/30 via-sky-400/20 to-purple-500/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-2xl shadow-primary/20 ring-1 ring-white/10">
            <Image
              src="/hero-commerce.png"
              alt="Saasum IQMart shopping experience preview"
              width={900}
              height={760}
              className="h-auto w-full object-cover"
              priority
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease }}
            className="absolute -bottom-6 -left-4 hidden rounded-2xl glass p-5 shadow-2xl backdrop-blur-xl sm:block"
          >
            <p className="text-xs text-muted-foreground font-medium">Monthly revenue</p>
            <p className="text-2xl font-bold gradient-text">$48,920</p>
            <p className="text-xs font-semibold text-primary">+18.2% this month</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

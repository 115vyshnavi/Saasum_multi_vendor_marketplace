"use client"

import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { motion } from "motion/react"
import { ArrowLeft, Quote } from "lucide-react"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"

const ease = [0.22, 1, 0.36, 1] as const

export function AuthLayout({
  children,
  eyebrow,
  title,
  subtitle,
}: {
  children: ReactNode
  eyebrow?: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="relative flex flex-col px-5 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="w-full max-w-sm"
          >
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Back to home
            </Link>

            {eyebrow ? <p className="text-sm font-medium text-primary">{eyebrow}</p> : null}
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-2 text-pretty text-muted-foreground">{subtitle}</p> : null}

            <div className="mt-8">{children}</div>
          </motion.div>
        </div>
      </div>

      {/* Brand side */}
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <Image
          src="/auth-visual.png"
          alt=""
          fill
          aria-hidden="true"
          className="object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease }}
          className="absolute inset-x-0 bottom-0 p-10 text-primary-foreground"
        >
          <Quote className="size-8 opacity-70" />
          <p className="mt-4 max-w-md text-balance text-2xl font-medium leading-snug">
            Saasum IQMart helped us launch our store and reach customers in 40 countries within the first month.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary-foreground/15 text-sm font-semibold">
              LM
            </div>
            <div>
              <p className="text-sm font-medium">Lena Müller</p>
              <p className="text-sm text-primary-foreground/70">Founder, Atelier Nord</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

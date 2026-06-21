"use client"

import { motion } from "motion/react"
import { Crown, ShoppingBag, Store } from "lucide-react"
import { cn } from "@/lib/utils"

const options = [
  { id: "buyer", label: "Buyer", icon: ShoppingBag },
  { id: "vendor", label: "Vendor", icon: Store },
  { id: "brand", label: "Brand", icon: Crown },
] as const

export type Role = (typeof options)[number]["id"]

// Single source of truth for post-auth routing by role.
export const roleRedirects: Record<Role, string> = {
  buyer: "/shop",
  vendor: "/vendor",
  brand: "/brand",
}

export function RoleToggle({ value, onChange }: { value: Role; onChange: (v: Role) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-border bg-muted/50 p-1">
      {options.map((o) => {
        const Icon = o.icon
        const active = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              "relative flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="role-toggle-pill"
                className="absolute inset-0 rounded-lg bg-card shadow-sm ring-1 ring-border"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon className="relative size-4" />
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

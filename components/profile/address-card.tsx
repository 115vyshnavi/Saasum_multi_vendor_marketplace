"use client"

import { motion } from "motion/react"
import { Home, MapPin, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Address = {
  id: string
  label: string
  type: "home" | "work" | "other"
  name: string
  line1: string
  line2: string
  phone: string
  default?: boolean
}

export function AddressCard({ address, index = 0 }: { address: Address; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {address.type === "home" ? <Home className="size-4" /> : <MapPin className="size-4" />}
          </span>
          <div>
            <p className="text-sm font-semibold">{address.label}</p>
            {address.default ? (
              <Badge variant="secondary" className="mt-0.5">
                Default
              </Badge>
            ) : null}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded-md p-1 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Address options"
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MapPin /> Set as default
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 space-y-1 text-sm">
        <p className="font-medium">{address.name}</p>
        <p className="text-muted-foreground">{address.line1}</p>
        <p className="text-muted-foreground">{address.line2}</p>
        <p className="text-muted-foreground">{address.phone}</p>
      </div>

      <div className="mt-5 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Pencil className="size-3.5" /> Edit
        </Button>
        {!address.default ? (
          <Button variant="ghost" size="sm" className="flex-1">
            Set default
          </Button>
        ) : null}
      </div>
    </motion.div>
  )
}

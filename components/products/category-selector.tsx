"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronsUpDown, Search, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

const categories = [
  "Electronics",
  "Fashion",
  "Home & Kitchen",
  "Sports & Outdoors",
  "Beauty",
  "Books"
]

export function CategorySelector({
  value,
  onChange,
}: {
  value?: string
  onChange?: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(value ?? "")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const filtered = categories.filter((c) => c.toLowerCase().includes(query.toLowerCase()))

  const choose = (c: string) => {
    setSelected(c)
    onChange?.(c)
    setOpen(false)
    setQuery("")
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <Tag className="size-4 text-muted-foreground" />
          <span className={cn(selected ? "text-foreground" : "text-muted-foreground")}>
            {selected || "Select a category"}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories"
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto p-1" role="listbox">
            {filtered.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected === c}
                  onClick={() => choose(c)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  {c}
                  {selected === c && <Check className="size-4 text-primary" />}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-2.5 py-6 text-center text-sm text-muted-foreground">No categories found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

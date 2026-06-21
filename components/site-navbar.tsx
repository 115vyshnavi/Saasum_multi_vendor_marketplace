"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Menu, Search, ShoppingBag, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserDropdown } from "@/components/user-dropdown"
import { authClient } from "@/lib/auth-client"
import { useCart } from "@/components/cart-provider"

const baseLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Sell", href: "/vendor" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inventory", href: "/inventory" },
  { label: "About", href: "/#features" },
]

const authedLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Sell", href: "/vendor" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Account", href: "/profile" },
  { label: "About", href: "/#features" },
]

export function SiteNavbar({ authenticated }: { authenticated?: boolean }) {
  const { cartCount } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  // Derive auth state from the real session. The optional `authenticated`
  // prop can still force a state (e.g. for static marketing pages).
  const { data: session, isPending } = authClient.useSession()
  const isAuthed = authenticated ?? Boolean(session?.user)
  const sessionUser = session?.user as
    | { name?: string | null; email?: string | null; image?: string | null; role?: string | null }
    | undefined

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const isAdmin = sessionUser?.role === "admin"
  const links = isAuthed
    ? isAdmin
      ? [...authedLinks, { label: "Logistics", href: "/admin/logistics" }, { label: "Performance", href: "/admin/performance" }]
      : authedLinks
    : isAdmin
      ? [...baseLinks, { label: "Logistics", href: "/admin/logistics" }, { label: "Performance", href: "/admin/performance" }]
      : baseLinks

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-background/0",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            className="hidden sm:inline-flex"
            render={<Link href="/shop" />}
          >
            <Search className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cart"
            className="relative hidden sm:inline-flex"
            render={<Link href="/cart" />}
          >
            <ShoppingBag className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                {cartCount}
              </span>
            )}
          </Button>
          <ThemeToggle />

          {isAuthed ? (
            <div className="ml-1">
              <UserDropdown user={sessionUser} />
            </div>
          ) : isPending ? (
            <div className="ml-1 size-9 animate-pulse rounded-full bg-muted" aria-hidden="true" />
          ) : (
            <div className="ml-1 hidden items-center gap-2 sm:flex">
              <Button variant="ghost" render={<Link href="/login" />}>
                Log in
              </Button>
              <Button render={<Link href="/signup" />}>Get started</Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            {!isAuthed && (
              <div className="mt-2 flex flex-col gap-2">
                <Button variant="outline" render={<Link href="/login" />}>
                  Log in
                </Button>
                <Button render={<Link href="/signup" />}>Get started</Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

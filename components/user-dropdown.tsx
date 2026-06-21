"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LayoutDashboard, Loader2, LogOut, Package, Settings, Store, User, Wallet } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"

type SessionUser = {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
}

export function UserDropdown({ user }: { user?: SessionUser }) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  // Prefer the server-provided user, fall back to the live client session.
  const { data: session } = authClient.useSession()
  const current = user ?? (session?.user as SessionUser | undefined)

  const name = current?.name?.trim() || "Account"
  const email = current?.email ?? ""
  const avatarUrl = current?.image ?? undefined
  const role = current?.role ?? "buyer"

  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"

  const dashboardHref = role === "vendor" ? "/vendor" : role === "brand" ? "/brand" : "/shop"

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await authClient.signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    }
    // Use hard redirect to ensure session cookie is fully cleared
    window.location.href = "/login"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full p-0.5 outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open account menu"
      >
        <Avatar size="default">
          {avatarUrl ? <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={name} /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar size="lg">
            {avatarUrl ? <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={name} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            {email ? <p className="truncate text-xs text-muted-foreground">{email}</p> : null}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={dashboardHref} />}>
          <LayoutDashboard /> {role === "buyer" ? "Shop" : "Dashboard"}
        </DropdownMenuItem>
        {(role === "vendor" || role === "brand") && (
          <DropdownMenuItem render={<Link href="/vendor/payouts" />}>
            <Wallet /> Payout Ledger
          </DropdownMenuItem>
        )}
        {role === "admin" && (
          <DropdownMenuItem render={<Link href="/admin/payouts" />}>
            <Wallet /> Payout Settlements
          </DropdownMenuItem>
        )}
        <DropdownMenuItem render={<Link href="/profile" />}>
          <User /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/orders" />}>
          <Package /> Orders
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/profile" />}>
          <Settings /> Settings
        </DropdownMenuItem>
        {role === "buyer" ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/vendor/onboarding" />}>
              <Store /> Become a seller
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? <Loader2 className="animate-spin" /> : <LogOut />} Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

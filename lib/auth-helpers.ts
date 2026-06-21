import "server-only"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profile as profileTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

export type Role = "buyer" | "vendor" | "brand"

// Single source of truth for post-auth routing by role.
export const roleRedirects: Record<Role, string> = {
  buyer: "/shop",
  vendor: "/vendor",
  brand: "/brand",
}

export function redirectForRole(role: string | null | undefined): string {
  return roleRedirects[(role as Role) ?? "buyer"] ?? "/shop"
}

/** Returns the current Better Auth session, or null when signed out. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

/** Returns the current user, or null when signed out. */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

/** Returns the profile row for the current user, or null. */
export async function getCurrentProfile(userId: string) {
  const rows = await db.select().from(profileTable).where(eq(profileTable.userId, userId)).limit(1)
  return rows[0] ?? null
}

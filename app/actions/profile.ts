"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profile as profileTable, user as userTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

export type ProfileInput = {
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  image?: string | null
}

export async function completeProfile(input: ProfileInput) {
  const userId = await getUserId()

  // Upsert the profile row scoped to the current user.
  const existing = await db.select().from(profileTable).where(eq(profileTable.userId, userId)).limit(1)

  if (existing[0]) {
    await db
      .update(profileTable)
      .set({
        phone: input.phone,
        address: input.address,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        image: input.image ?? null,
        updatedAt: new Date(),
      })
      .where(eq(profileTable.userId, userId))
  } else {
    await db.insert(profileTable).values({
      userId,
      phone: input.phone,
      address: input.address,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      image: input.image ?? null,
    })
  }

  // Mark the user record as having a complete profile (+ store avatar).
  await db
    .update(userTable)
    .set({ profileComplete: true, image: input.image ?? null, updatedAt: new Date() })
    .where(eq(userTable.id, userId))

  revalidatePath("/profile")
  revalidatePath("/complete-profile")
  return { ok: true as const }
}

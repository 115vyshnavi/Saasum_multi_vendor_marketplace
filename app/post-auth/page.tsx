import { redirect } from "next/navigation"
import { getCurrentUser, redirectForRole } from "@/lib/auth-helpers"

// Server-side landing resolver. After sign-in we send users here so routing
// decisions (role + profile completion) happen with the real session.
export default async function PostAuthPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const u = user as typeof user & { role?: string; profileComplete?: boolean }
  if (!u.profileComplete) redirect("/complete-profile")
  redirect(redirectForRole(u.role))
}

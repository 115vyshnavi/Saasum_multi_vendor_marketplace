import { redirect } from "next/navigation"
import { getCurrentUser, redirectForRole } from "@/lib/auth-helpers"
import { CompleteProfileForm } from "@/components/auth/complete-profile-form"

export default async function CompleteProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const u = user as typeof user & { role?: string; profileComplete?: boolean }
  // Already finished onboarding — send them to their landing page.
  if (u.profileComplete) redirect(redirectForRole(u.role))

  return <CompleteProfileForm name={user.name ?? ""} redirectTo={redirectForRole(u.role)} />
}

import React from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getVendorReturnRequests } from "@/app/actions/returns"
import { VendorReturnsClient } from "./vendor-returns-client"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function VendorReturnsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    redirect("/login?callbackUrl=/vendor/returns")
  }

  // Authorize: vendor or admin
  const isVendor = session.user.role === "vendor" || session.user.role === "brand"
  const isAdmin = session.user.role === "admin"
  if (!isVendor && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/20">
        <SiteNavbar />
        <main className="flex-1 py-12 px-4 max-w-md mx-auto w-full flex flex-col justify-center">
          <Card className="border border-border/80 rounded-[2rem] p-8 text-center shadow-lg bg-card space-y-6">
            <CardContent className="space-y-5 pt-6">
              <span className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 mx-auto border border-rose-100">
                <ShieldAlert className="size-7" />
              </span>
              <div className="space-y-2">
                <h3 className="font-extrabold text-xl text-foreground tracking-tight">Access Denied</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Only vendors or admins are authorized to access the vendor returns panel.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Button size="sm" variant="outline" render={<Link href="/" />}>
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const res = await getVendorReturnRequests()
  const initialReturns = res.success ? res.returns || [] : []

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <SiteNavbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full py-10 px-4">
        <VendorReturnsClient initialReturns={initialReturns} />
      </main>

      <SiteFooter />
    </div>
  )
}

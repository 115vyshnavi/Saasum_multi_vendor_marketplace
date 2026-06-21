"use client"

import { useState } from "react"
import Image from "next/image"
import { Camera, MapPin, Plus, ShieldCheck, User } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PasswordInput } from "@/components/auth/password-input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddressCard, type Address } from "@/components/profile/address-card"
import { useSession } from "@/lib/auth-client"

export default function ProfilePage() {
  const { data: session, isPending } = useSession()
  const user = session?.user
  const [addresses, setAddresses] = useState<Address[]>([])

  if (isPending) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/30">
        <SiteNavbar authenticated />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading profile...
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!user && !isPending) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/30">
        <SiteNavbar authenticated />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Please log in to view your profile.
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const displayName = user?.name || user?.email?.split("@")[0] || "User"
  const userEmail = user?.email || ""
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "N/A"

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header card */}
        <Card>
          <CardContent className="flex flex-col items-center gap-5 py-2 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="size-20 overflow-hidden rounded-full ring-2 ring-border">
                <Image
                  src="/avatars/user.png"
                  alt={displayName}
                  width={80}
                  height={80}
                  className="size-full object-cover"
                />
              </div>
              <button
                type="button"
                aria-label="Change photo"
                className="absolute -bottom-1 -right-1 inline-flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105"
              >
                <Camera className="size-3.5" />
              </button>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-xl font-semibold tracking-tight">{displayName}</h1>
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="size-3" /> Verified
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{userEmail} · Member since {memberSince}</p>
            </div>
            <Button variant="outline" className="h-10 px-4 text-sm">
              Sign out
            </Button>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="h-10">
            <TabsTrigger value="profile">
              <User /> Profile
            </TabsTrigger>
            <TabsTrigger value="addresses">
              <MapPin /> Addresses
            </TabsTrigger>
            <TabsTrigger value="security">
              <ShieldCheck /> Security
            </TabsTrigger>
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal information</CardTitle>
                <CardDescription>Update your account details and contact info.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="image">Profile Image URL</Label>
                    <Input id="image" defaultValue={user?.image || ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={userEmail} />
                  </div>
                   <div className="flex flex-col gap-2 sm:col-span-2">
                     <Label htmlFor="bio">Bio</Label>
                     <Input id="bio" placeholder="Tell us about yourself" />
                   </div>
                  <div className="flex justify-end gap-2 sm:col-span-2">
                    <Button variant="outline" type="button" className="h-10 px-4 text-sm">
                      Cancel
                    </Button>
                    <Button type="submit" className="h-10 px-4 text-sm">
                      Save changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses */}
          <TabsContent value="addresses" className="mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Saved addresses</h2>
                <p className="text-sm text-muted-foreground">Manage your delivery destinations.</p>
              </div>
              <Button className="h-10 px-4 text-sm">
                <Plus className="size-4" /> Add address
              </Button>
            </div>
            {addresses.length === 0 ? (
              <Card className="mt-5">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No addresses saved yet. Add your first address to get started.
                </CardContent>
              </Card>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {addresses.map((a, i) => (
                  <AddressCard key={a.id} address={a} index={i} />
                ))}
              </div>
            )}
            <button
              type="button"
              className="mt-4 flex min-h-44 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted">
                <Plus className="size-5" />
              </span>
              Add new address
            </button>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Password & security</CardTitle>
                <CardDescription>Keep your account safe with a strong password.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="flex max-w-md flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="current">Current password</Label>
                    <PasswordInput id="current" placeholder="••••••••" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="new">New password</Label>
                    <PasswordInput id="new" placeholder="Create a new password" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="confirm">Confirm new password</Label>
                    <PasswordInput id="confirm" placeholder="Re-enter new password" />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" className="h-10 px-4 text-sm">
                      Update password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

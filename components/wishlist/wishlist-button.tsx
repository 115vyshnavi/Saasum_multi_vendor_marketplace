"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { toggleWishlist } from "@/app/actions/wishlist"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

export function WishlistButton({ productId }: { productId: string }) {
  const { data: session } = useSession()
  const [inWishlist, setInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (!session?.user) return
    
    setLoading(true)
    const result = await toggleWishlist(productId)
    if (result.success) {
      setInWishlist(result.inWishlist || false)
    }
    setLoading(false)
  }

  if (!session?.user) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-3 right-3 z-10 bg-white/80 hover:bg-white"
      onClick={handleToggle}
      disabled={loading}
    >
      <Heart
        className={`size-5 transition-colors ${
          inWishlist ? "fill-red-500 text-red-500" : "text-gray-600"
        }`}
      />
    </Button>
  )
}
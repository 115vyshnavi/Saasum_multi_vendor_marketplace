import { SiteNavbar } from "@/components/site-navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, Trash2 } from "lucide-react"
import Link from "next/link"
import { getWishlist, moveToCart } from "@/app/actions/wishlist"

export default async function WishlistPage() {
  const result = await getWishlist()

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteNavbar authenticated />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My Wishlist</h1>
        <p className="mt-1 text-muted-foreground">Products you've saved for later</p>

        {!result.success ? (
          <Card className="mt-8">
            <CardContent className="py-8 text-center text-muted-foreground">
              Please log in to view your wishlist.
            </CardContent>
          </Card>
        ) : !result.items || result.items.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Heart className="size-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Your wishlist is empty</p>
              <p className="mt-1">Save products you love by clicking the heart icon.</p>
              <Button className="mt-4" render={<Link href="/shop" />}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((item: any) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-square bg-muted/50 relative">
                  {item.product.images && item.product.images[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium line-clamp-2">{item.product.name}</h3>
                  <p className="mt-1 text-lg font-semibold text-primary">
                    ${parseFloat(item.product.price).toFixed(2)}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <form action="/api/wishlist/move-to-cart" method="POST" className="flex-1">
                      <input type="hidden" name="productId" value={item.productId} />
                      <Button type="submit" className="w-full" size="sm">
                        <ShoppingCart className="size-4 mr-1.5" />
                        Move to Cart
                      </Button>
                    </form>
                    <Button variant="outline" size="sm" render={<Link href={`/product/${item.productId}`} />}>
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
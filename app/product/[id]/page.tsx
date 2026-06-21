import Image from "next/image"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { getProduct } from "@/lib/products"
import { AddToCartButton } from "@/components/cart/add-to-cart-button"
import { getRelatedProducts, getCustomersAlsoBought } from "@/app/actions/recommendations"
import { Recommendations } from "@/components/recommendations"
import { WishlistButton } from "@/components/wishlist/wishlist-button"
import { getReviews, getProductQuestions } from "@/app/actions/reviews"
import { Star, MessageSquare, ThumbsUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return (
      <div className="min-h-screen">
        <SiteNavbar />
        <main className="mx-auto max-w-7xl px-4 py-20">Product not found</main>
        <SiteFooter />
      </div>
    )
  }

  const [relatedProducts, coBoughtProducts, reviewsResult, questionsResult] = await Promise.all([
    getRelatedProducts(product.id, 8),
    getCustomersAlsoBought(product.id, 8),
    getReviews(product.id),
    getProductQuestions(product.id),
  ])

  const price = parseFloat(product.price)
  const compare = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNavbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-secondary">
              <Image
                src={(product.images && product.images[0]) || "/placeholder.svg"}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <WishlistButton productId={product.id} />
            </div>
            <div className="mt-6">
              <h1 className="text-2xl font-semibold">{product.name}</h1>
              <p className="mt-3 text-sm text-muted-foreground">{product.shortDescription || product.description}</p>
            </div>
          </div>

          <aside className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">by {product.vendor?.name || 'Unknown'}</p>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-semibold">${price.toFixed(2)}</span>
              {compare && <span className="text-sm text-muted-foreground line-through">${compare.toFixed(2)}</span>}
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium">Stock</p>
              <p className="mt-1 text-sm text-muted-foreground">{product.stock} available</p>
            </div>
            <AddToCartButton product={product} className="mt-6 w-full" />
          </aside>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Customer Reviews</h2>
          {reviewsResult.success && reviewsResult.reviews && reviewsResult.reviews.length > 0 ? (
            <div className="space-y-4">
              {reviewsResult.reviews.map((review: any) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{review.userName || "Anonymous"}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`size-4 ${
                                star <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <h3 className="font-medium mt-3">{review.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{review.reviewText}</p>
                    {review.verifiedPurchase && (
                      <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Verified Purchase
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No reviews yet. Be the first to review this product!
              </CardContent>
            </Card>
          )}
        </div>

        {/* Q&A Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Questions & Answers</h2>
          {questionsResult.success && questionsResult.questions && questionsResult.questions.length > 0 ? (
            <div className="space-y-4">
              {questionsResult.questions.map((q: any) => (
                <Card key={q.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="size-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{q.userName || "Anonymous"} asked:</p>
                        <p className="mt-1">{q.question}</p>
                        {q.answer && (
                          <div className="mt-4 pl-4 border-l-2 border-primary">
                            <p className="text-sm font-medium text-primary">
                              {q.answererName || "Seller"} answered:
                            </p>
                            <p className="mt-1 text-sm">{q.answer}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No questions yet. Ask a question about this product!
              </CardContent>
            </Card>
          )}
        </div>

        <Recommendations products={relatedProducts} title="Related Products" />
        <Recommendations products={coBoughtProducts} title="Customers Also Bought" />
      </main>
      <SiteFooter />
    </div>
  )
}

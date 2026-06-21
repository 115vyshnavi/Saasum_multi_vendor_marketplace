"use client"

import { useCart } from "@/components/cart-provider"
import { Button } from "@/components/ui/button"
import { Check, ShoppingBag } from "lucide-react"
import { type DatabaseProduct } from "@/lib/products-shared"

type AddToCartButtonProps = {
  product: DatabaseProduct
  className?: string
}

export function AddToCartButton({ product, className }: AddToCartButtonProps) {
  const { cartItems, addToCart, removeFromCart } = useCart()
  
  const inCart = cartItems.some((item) => item.id === product.id)
  const price = parseFloat(product.price)

  const handleClick = () => {
    if (inCart) {
      removeFromCart(product.id)
    } else {
      addToCart({
        id: product.id,
        name: product.name,
        price: price,
        image: (product.images && product.images[0]) || "/placeholder.svg",
        vendorName: product.vendor?.name || undefined,
      })
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant={inCart ? "outline" : "default"}
      className={className}
    >
      {inCart ? (
        <>
          <Check className="size-4" /> Added to cart
        </>
      ) : (
        <>
          <ShoppingBag className="size-4" /> Add to cart
        </>
      )}
    </Button>
  )
}

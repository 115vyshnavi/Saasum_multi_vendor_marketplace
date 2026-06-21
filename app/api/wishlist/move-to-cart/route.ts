import { NextResponse } from "next/server"
import { moveToCart } from "@/app/actions/wishlist"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 })
    }

    const result = await moveToCart(productId)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error moving to cart:", error)
    return NextResponse.json({ success: false, error: "Failed to move to cart" }, { status: 500 })
  }
}
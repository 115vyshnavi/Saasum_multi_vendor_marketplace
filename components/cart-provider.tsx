"use client"

import { createContext, useContext, useEffect, useState, useMemo, useRef } from "react"
import { authClient } from "@/lib/auth-client"
import { fetchDbCart, syncCart } from "@/app/actions/cart"

export type CartItem = {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  vendorName?: string
}

type CartContextType = {
  cartItems: CartItem[]
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
  updateQuantity: (id: string, quantity: number) => void
  removeFromCart: (id: string) => void
  clearCart: () => void
  cartCount: number
  cartSubtotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const { data: session, isPending } = authClient.useSession()
  const userId = session?.user?.id
  const hasSynced = useRef(false)

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("saasum_cart")
      if (saved) {
        setCartItems(JSON.parse(saved))
      }
    } catch (e) {
      console.error("Failed to load local cart", e)
    }
    setIsLoaded(true)
  }, [])

  // 2. Auth Sync logic - only run once when user logs in
  useEffect(() => {
    if (!isLoaded || isPending || !userId || hasSynced.current) return

    const loadAndSyncCart = async () => {
      try {
        // Fetch database cart
        const dbItems = await fetchDbCart()
        
        // Get current local cart
        const localItems = cartItems
        
        // Compute merged cart
        const merged = [...dbItems]
        localItems.forEach((localItem) => {
          const index = merged.findIndex((i) => i.id === localItem.id)
          if (index > -1) {
            // If exists in both, sum quantities
            merged[index].quantity += localItem.quantity
          } else {
            merged.push(localItem)
          }
        })

        // Update state with merged cart
        setCartItems(merged)
        
        // Sync merged cart to DB and LocalStorage
        syncCart(
          merged.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
            price: i.price,
          }))
        )
        localStorage.setItem("saasum_cart", JSON.stringify(merged))
        
        hasSynced.current = true
      } catch (error) {
        console.error("Failed to sync cart after merge:", error)
      }
    }

    loadAndSyncCart()
  }, [userId, isPending, isLoaded]) // Removed cartItems from dependencies

  // 3. Helper to update state and sync
  const updateCartState = (newItems: CartItem[]) => {
    setCartItems(newItems)
    try {
      localStorage.setItem("saasum_cart", JSON.stringify(newItems))
    } catch (e) {
      console.error("Failed to write to localStorage", e)
    }

    if (userId) {
      syncCart(
        newItems.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          price: i.price,
        }))
      )
    }
  }

  const addToCart = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const qty = item.quantity ?? 1
    const existingIndex = cartItems.findIndex((i) => i.id === item.id)
    if (existingIndex > -1) {
      const updated = [...cartItems]
      updated[existingIndex].quantity += qty
      updateCartState(updated)
    } else {
      updateCartState([...cartItems, { ...item, quantity: qty }])
    }
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    const updated = cartItems.map((item) =>
      item.id === id ? { ...item, quantity } : item
    )
    updateCartState(updated)
  }

  const removeFromCart = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id)
    updateCartState(updated)
  }

  const clearCart = () => {
    updateCartState([])
  }

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }, [cartItems])

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cartItems])

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

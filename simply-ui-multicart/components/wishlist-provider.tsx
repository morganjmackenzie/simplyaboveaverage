"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { Product } from "@/components/cart-provider"

type WishlistContextType = {
  items: Product[]
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  getItemsCount: () => number
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Product[]>([])

  // Load wishlist from localStorage on initial render
  useEffect(() => {
    const savedWishlist = localStorage.getItem("wishlist")
    if (savedWishlist) {
      try {
        setItems(JSON.parse(savedWishlist))
      } catch (error) {
        console.error("Failed to parse wishlist from localStorage:", error)
      }
    }
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(items))
  }, [items])

  const addToWishlist = (product: Product) => {
    setItems((prevItems) => {
      // Check if the product is already in the wishlist
      if (prevItems.some((item) => item.id === product.id)) {
        return prevItems
      }

      return [...prevItems, product]
    })
  }

  const removeFromWishlist = (productId: string) => {
    setItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.id !== productId)

      return newItems
    })
  }

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.id === productId)
  }

  const getItemsCount = () => {
    return items.length
  }

  const clearWishlist = () => {
    setItems([])
  }

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        getItemsCount,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}

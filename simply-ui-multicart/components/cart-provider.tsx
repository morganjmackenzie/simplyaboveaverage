"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

// Update the Product type to match your Supabase schema
export type Product = {
  id: string
  product_title: string
  vendor: string
  price: number
  size?: string
  color?: string
  length?: string
  inseam?: string
  available: boolean
  image_url: string
  product_url: string
  variant_title?: string
  description?: string
  product_id: string
  variant_id?: string
  primary_category?: string
  subcategory?: string
}

// Update CartItem type to use the new Product type
export type CartItem = Product & {
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getItemsCount: () => number
  getSubtotal: () => number
  getBrandItems: (vendor: string) => CartItem[]
  getBrandSubtotal: (vendor: string) => number
  getUniqueBrands: () => string[]
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items))
  }, [items])

  const addToCart = (product: Product) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id)

      if (existingItem) {
        return prevItems.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      } else {
        return [...prevItems, { ...product, quantity: 1 }]
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setItems((prevItems) => prevItems.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
  }

  const getItemsCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getSubtotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getBrandItems = (vendor: string) => {
    // Ensure we're strictly matching the vendor name
    return items.filter((item) => item.vendor === vendor)
  }

  const getBrandSubtotal = (vendor: string) => {
    return getBrandItems(vendor).reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getUniqueBrands = () => {
    return [...new Set(items.map((item) => item.vendor))]
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemsCount,
        getSubtotal,
        getBrandItems,
        getBrandSubtotal,
        getUniqueBrands,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

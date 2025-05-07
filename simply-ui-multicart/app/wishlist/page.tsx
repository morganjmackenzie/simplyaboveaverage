"use client"

import { useWishlist } from "@/components/wishlist-provider"
import { useCart } from "@/components/cart-provider"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [isClearing, setIsClearing] = useState(false)

  const handleClearWishlist = () => {
    if (items.length === 0) return

    if (isClearing) {
      clearWishlist()
      setIsClearing(false)
    } else {
      setIsClearing(true)
      // Auto-reset after 3 seconds if not confirmed
      setTimeout(() => setIsClearing(false), 3000)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="inline-flex items-center text-sm hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to shopping
          </Link>
        </div>
        <h1 className="text-2xl font-bold">My Wishlist</h1>
        <Button
          variant="outline"
          size="sm"
          className={isClearing ? "bg-red-50 text-red-600 border-red-200" : ""}
          onClick={handleClearWishlist}
          disabled={items.length === 0}
        >
          {isClearing ? (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Confirm Clear
            </>
          ) : (
            "Clear Wishlist"
          )}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-medium mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-6">Save items you love by clicking the heart icon on products.</p>
          <Link href="/">
            <Button>Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((product) => (
            <div key={product.id} className="bg-gray-50 rounded-lg overflow-hidden">
              {/* Image with remove button */}
              <div className="relative">
                <div className="relative h-96 w-full">
                  <Image
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.product_title}
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  className="absolute top-2 right-2 h-10 w-10 bg-white bg-opacity-70 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all text-red-500"
                  onClick={() => removeFromWishlist(product.id)}
                  aria-label="Remove from wishlist"
                >
                  <Heart className="h-6 w-6 fill-current" />
                </button>
              </div>

              {/* Product details */}
              <div className="p-4 space-y-2">
                <h3 className="font-medium text-xl">{product.product_title}</h3>
                <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>

                {product.color && <p className="text-gray-500">{product.color}</p>}

                {product.size && <p className="text-gray-500">Size {product.size}</p>}

                {/* Add to cart button */}
                <Button
                  onClick={() => addToCart(product)}
                  className="w-full mt-4 h-12 text-lg bg-[#8D6E63] hover:bg-[#795548] whitespace-nowrap px-4"
                  disabled={!product.available}
                >
                  {product.available ? (
                    <div className="flex items-center justify-center w-full">
                      <ShoppingCart className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span>Add to Cart</span>
                    </div>
                  ) : (
                    <span>Out of Stock</span>
                  )}
                </Button>

                {/* Remove button */}
                <Button variant="outline" className="w-full mt-2" onClick={() => removeFromWishlist(product.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

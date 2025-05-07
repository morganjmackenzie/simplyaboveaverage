"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useCart, type Product } from "@/components/cart-provider"
import { useWishlist } from "@/components/wishlist-provider"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, X } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface SearchResultsProps {
  query: string
  onClearSearch: () => void
}

export function SearchResults({ query, onClearSearch }: SearchResultsProps) {
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use this ref to prevent multiple simultaneous searches
  const searchInProgressRef = useRef(false)

  // Use this ref to track the latest search parameters
  const latestSearchParamsRef = useRef({ query })

  useEffect(() => {
    // Update the latest search params ref
    latestSearchParamsRef.current = { query }

    // Skip empty searches
    if (!query) return

    // Skip if a search is already in progress
    if (searchInProgressRef.current) return

    async function searchProducts() {
      // Set the search in progress flag
      searchInProgressRef.current = true
      setLoading(true)
      setError(null)

      try {
        // Get the latest search parameters
        const { query: currentQuery } = latestSearchParamsRef.current

        // Parse the query to extract potential filters
        const queryLower = currentQuery.toLowerCase()

        // Extract potential color
        const colorTerms = [
          "black",
          "white",
          "red",
          "blue",
          "green",
          "yellow",
          "purple",
          "pink",
          "brown",
          "gray",
          "grey",
        ]
        const colorMatch = colorTerms.find((color) => queryLower.includes(color))

        // Extract potential size
        const sizeMatch = queryLower.match(/size (\d+)/i) || queryLower.match(/\b(\d+)\b/g)
        const size = sizeMatch ? sizeMatch[1] : null

        // Extract specific measurements
        // Pattern for "XX in/inch inseam" or "inseam XX in/inch"
        const inseamPattern1 = /(\d+)[\s-]*(in|inch|inches)?[\s-]*inseam/i
        const inseamPattern2 = /inseam[\s-]*(\d+)[\s-]*(in|inch|inches)?/i
        const inseamMatch = queryLower.match(inseamPattern1) || queryLower.match(inseamPattern2)
        const inseam = inseamMatch ? inseamMatch[1] : null

        // Pattern for "XX in/inch length" or "length XX in/inch"
        const lengthPattern1 = /(\d+)[\s-]*(in|inch|inches)?[\s-]*length/i
        const lengthPattern2 = /length[\s-]*(\d+)[\s-]*(in|inch|inches)?/i
        const lengthMatch = queryLower.match(lengthPattern1) || queryLower.match(lengthPattern2)
        const length = lengthMatch ? lengthMatch[1] : null

        // Extract potential product type
        const productTypes = [
          "heels",
          "shoes",
          "boots",
          "sneakers",
          "sandals",
          "shirt",
          "pants",
          "jeans",
          "dress",
          "skirt",
          "jacket",
          "coat",
        ]
        const productMatch = productTypes.find((type) => queryLower.includes(type))

        console.log("Extracted search parameters:", {
          color: colorMatch,
          size,
          inseam,
          length,
          productType: productMatch,
        })

        // Build the Supabase query
        let supabaseQuery = supabase.from("products").select("*")

        // Apply filters from query text
        if (colorMatch) {
          supabaseQuery = supabaseQuery.ilike("color", `%${colorMatch}%`)
        }

        if (size) {
          supabaseQuery = supabaseQuery.or(`size.ilike.%${size}%,size.eq.${size}`)
        }

        // Apply specific measurement filters
        if (inseam) {
          supabaseQuery = supabaseQuery.or(
            `inseam.ilike.%${inseam}%,inseam.eq.${inseam},description.ilike.%inseam ${inseam}%,description.ilike.%${inseam} inseam%`,
          )
        }

        if (length) {
          supabaseQuery = supabaseQuery.or(
            `length.ilike.%${length}%,length.eq.${length},description.ilike.%length ${length}%,description.ilike.%${length} length%`,
          )
        }

        if (productMatch) {
          // For product types like "jeans", search in multiple fields
          // Use primary_category instead of category
          supabaseQuery = supabaseQuery.or(
            `product_title.ilike.%${productMatch}%,description.ilike.%${productMatch}%,primary_category.ilike.%${productMatch}%,subcategory.ilike.%${productMatch}%`,
          )
        }

        // If there's a query text but no specific filters were extracted, do a general search
        if (currentQuery.trim() && !colorMatch && !size && !inseam && !length && !productMatch) {
          supabaseQuery = supabaseQuery.or(`product_title.ilike.%${currentQuery}%,description.ilike.%${currentQuery}%`)
        }

        console.log("Executing search query...")

        // Execute the query
        const { data, error } = await supabaseQuery

        if (error) throw error

        console.log(`Search returned ${data?.length || 0} results`)

        if (data) {
          setProducts(data as Product[])
        } else {
          setProducts([])
        }
      } catch (err) {
        console.error("Error searching products:", err)
        setError("Failed to search products. Please try again.")
      } finally {
        setLoading(false)
        // Reset the search in progress flag after a short delay
        setTimeout(() => {
          searchInProgressRef.current = false
        }, 500)
      }
    }

    searchProducts()
  }, [query])

  // Toggle wishlist item
  const toggleWishlist = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Searching for products...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" onClick={onClearSearch} className="mt-4">
          Clear Search
        </Button>
      </div>
    )
  }

  if (products.length === 0 && query) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No products found matching your criteria.</p>
        <Button variant="outline" onClick={onClearSearch} className="mt-4">
          Clear Search
        </Button>
      </div>
    )
  }

  if (!query) {
    return null
  }

  // Determine what to display in the heading
  const headingText = `Search Results for "${query}"`

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">{headingText}</h2>
        <Button variant="outline" size="sm" onClick={onClearSearch} className="flex items-center gap-1">
          <X className="h-4 w-4" />
          Clear Search
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-gray-50 rounded-lg overflow-hidden">
            {/* Image with wishlist icon */}
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
                className={`absolute top-2 right-2 h-10 w-10 bg-white bg-opacity-70 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all ${
                  isInWishlist(product.id) ? "text-black" : "text-gray-600"
                }`}
                onClick={() => toggleWishlist(product)}
                aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`h-6 w-6 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Product details */}
            <div className="p-4 space-y-2">
              <h3 className="font-medium text-xl">{product.product_title}</h3>
              <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>

              {product.color && <p className="text-gray-500">{product.color}</p>}

              {product.size && <p className="text-gray-500">Size {product.size}</p>}

              {/* Show inseam if available */}
              {product.inseam && <p className="text-gray-500">Inseam: {product.inseam}</p>}

              {/* Show length if available */}
              {product.length && <p className="text-gray-500">Length: {product.length}</p>}

              {/* Add to cart button - fixed height and no text wrapping */}
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
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

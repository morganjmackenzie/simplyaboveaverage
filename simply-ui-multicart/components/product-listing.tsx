"use client"

import { useCart, type Product } from "@/components/cart-provider"
import { useWishlist } from "@/components/wishlist-provider"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Heart, MoreHorizontal, ShoppingCart } from "lucide-react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProductListing() {
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [productsPerPage, setProductsPerPage] = useState(12)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)

        // First, get the total count of products
        const { count, error: countError } = await supabase.from("products").select("*", { count: "exact", head: true })

        if (countError) {
          throw countError
        }

        if (count !== null) {
          setTotalProducts(count)
          setTotalPages(Math.ceil(count / productsPerPage))
        }

        // Calculate pagination parameters
        const from = (currentPage - 1) * productsPerPage
        const to = from + productsPerPage - 1

        // Fetch the products for the current page
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .range(from, to)
          .order("id", { ascending: true })

        if (error) {
          throw error
        }

        if (data) {
          setProducts(data as Product[])
        }
      } catch (err) {
        console.error("Error fetching products:", err)
        setError("Failed to load products. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [currentPage, productsPerPage])

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Handle products per page change
  const handleProductsPerPageChange = (value: string) => {
    const newProductsPerPage = Number.parseInt(value)
    setProductsPerPage(newProductsPerPage)
    // Reset to first page when changing products per page
    setCurrentPage(1)
    // Save preference to localStorage
    localStorage.setItem("productsPerPage", value)
  }

  // Load saved preference on initial render
  useEffect(() => {
    const savedProductsPerPage = localStorage.getItem("productsPerPage")
    if (savedProductsPerPage) {
      setProductsPerPage(Number.parseInt(savedProductsPerPage))
    }
  }, [])

  // Toggle wishlist item
  const toggleWishlist = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5 // Show at most 5 page numbers

    if (totalPages <= maxPagesToShow) {
      // If we have 5 or fewer pages, show all of them
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first page
      pageNumbers.push(1)

      // Calculate start and end of page numbers to show
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the beginning or end
      if (currentPage <= 3) {
        end = 4
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3
      }

      // Add ellipsis if needed
      if (start > 2) {
        pageNumbers.push("ellipsis1")
      }

      // Add the page numbers
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pageNumbers.push("ellipsis2")
      }

      // Always show last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg overflow-hidden">
            <div className="relative">
              <Skeleton className="h-96 w-full" />
              <div className="absolute top-2 right-2">
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
            <div className="p-4 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-12 w-full mt-4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No products found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
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

      {/* Pagination controls and products per page selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Products per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select value={productsPerPage.toString()} onValueChange={handleProductsPerPageChange}>
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="12" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex h-10 items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-1 pl-2.5 ${
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
              </PaginationItem>

              {getPageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === "ellipsis1" || page === "ellipsis2" ? (
                    <span aria-hidden className="flex h-9 w-9 items-center justify-center">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More pages</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page as number)}
                      className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        currentPage === page
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                      }`}
                      aria-current={currentPage === page ? "page" : undefined}
                    >
                      {page}
                    </button>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex h-10 items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-1 pr-2.5 ${
                    currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* Products count */}
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * productsPerPage + 1}-{Math.min(currentPage * productsPerPage, totalProducts)} of{" "}
          {totalProducts} products
        </div>
      </div>
    </div>
  )
}

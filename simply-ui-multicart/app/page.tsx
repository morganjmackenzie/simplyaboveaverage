"use client"

import { useState, useCallback } from "react"
import ProductListing from "@/components/product-listing"
import { SearchBar } from "@/components/search-bar"
import { SearchResults } from "@/components/search-results"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  // Use useCallback to prevent unnecessary re-renders
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setHasSearched(true)
  }, [])

  // Clear search and show all products again
  const handleClearSearch = useCallback(() => {
    setSearchQuery("")
    setHasSearched(false)
  }, [])

  return (
    <main>
      <SearchBar onSearch={handleSearch} />

      <div className="container mx-auto px-4 py-8">
        {hasSearched ? (
          <div>
            <SearchResults query={searchQuery} onClearSearch={handleClearSearch} />
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Products</h2>
            <ProductListing />
          </div>
        )}
      </div>
    </main>
  )
}

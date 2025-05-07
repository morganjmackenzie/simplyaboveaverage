"use client"

import type React from "react"
import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  onSearch: (query: string) => void
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("")

  // Handle form submission (Enter key or Search button click)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Only search if there's a query
    if (query.trim()) {
      console.log("Searching for:", query)
      onSearch(query)
    }
  }

  return (
    <div className="w-full bg-muted/30 py-4">
      <div className="container mx-auto px-4">
        <form onSubmit={handleSubmit} className="flex w-full max-w-3xl mx-auto items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for products like 'red shoes size 7'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 py-6 text-base"
            />
          </div>
          <Button type="submit" className="px-4 py-2 h-auto">
            Search
          </Button>
        </form>
      </div>
    </div>
  )
}

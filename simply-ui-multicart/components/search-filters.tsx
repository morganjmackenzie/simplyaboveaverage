"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Filter, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { SimpleDropdown, SimpleDropdownTrigger } from "@/components/ui/simple-dropdown"

export interface FilterOptions {
  priceRange: [number, number]
  categories: string[]
  colors: string[]
  sizes: string[]
  inStock: boolean
}

interface SearchFiltersProps {
  onFilterChange: (filters: FilterOptions) => void
  initialFilters?: Partial<FilterOptions>
  isMobile?: boolean
}

export function SearchFilters({ onFilterChange, initialFilters, isMobile = false }: SearchFiltersProps) {
  // Get min and max price from products
  const [minMaxPrice, setMinMaxPrice] = useState<[number, number]>([0, 500])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableColors, setAvailableColors] = useState<string[]>([])
  const [availableSizes, setAvailableSizes] = useState<string[]>([])

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: initialFilters?.priceRange || [0, 500],
    categories: initialFilters?.categories || [],
    colors: initialFilters?.colors || [],
    sizes: initialFilters?.sizes || [],
    inStock: initialFilters?.inStock || false,
  })

  // For mobile: temporary filter state that only applies when user clicks "Apply"
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters)

  // Count active filters
  const countActiveFilters = () => {
    let count = 0
    if (filters.categories.length > 0) count++
    if (filters.colors.length > 0) count++
    if (filters.sizes.length > 0) count++
    if (filters.inStock) count++
    // Only count price if it's not the default range
    if (filters.priceRange[0] > minMaxPrice[0] || filters.priceRange[1] < minMaxPrice[1]) count++
    return count
  }

  // Add this state variable
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  // Fetch filter options from database
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        // Get min and max price
        const { data: priceData } = await supabase.from("products").select("price").order("price", { ascending: true })

        if (priceData && priceData.length > 0) {
          const prices = priceData.map((item) => item.price)
          const minPrice = Math.floor(Math.min(...prices))
          const maxPrice = Math.ceil(Math.max(...prices))
          setMinMaxPrice([minPrice, maxPrice])
          setFilters((prev) => ({
            ...prev,
            priceRange: initialFilters?.priceRange || [minPrice, maxPrice],
          }))
          setTempFilters((prev) => ({
            ...prev,
            priceRange: initialFilters?.priceRange || [minPrice, maxPrice],
          }))
        }

        // Get unique categories - use primary_category instead of category
        const { data: categoryData } = await supabase
          .from("products")
          .select("primary_category")
          .not("primary_category", "is", null)

        if (categoryData) {
          const categories = [...new Set(categoryData.map((item) => item.primary_category))].filter(Boolean)
          setAvailableCategories(categories as string[])
        }

        // Get unique colors
        const { data: colorData } = await supabase.from("products").select("color").not("color", "is", null)

        if (colorData) {
          const colors = [...new Set(colorData.map((item) => item.color))].filter(Boolean)
          setAvailableColors(colors as string[])
        }

        // Get unique sizes
        const { data: sizeData } = await supabase.from("products").select("size").not("size", "is", null)

        if (sizeData) {
          const sizes = [...new Set(sizeData.map((item) => item.size))].filter(Boolean)
          setAvailableSizes(sizes as string[])
        }
      } catch (error) {
        console.error("Error fetching filter options:", error)
      }
    }

    fetchFilterOptions()
  }, [initialFilters])

  // Update parent component when filters change
  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  // Add this effect to update the active filters count
  useEffect(() => {
    setActiveFiltersCount(countActiveFilters())
  }, [filters])

  // Update temp filters when sheet opens
  const handleSheetOpen = () => {
    setTempFilters(filters)
  }

  // Apply temp filters when user clicks "Apply Filters"
  const applyFilters = () => {
    setFilters(tempFilters)
  }

  // Handle filter changes for desktop view
  const handlePriceChange = (value: number[]) => {
    setFilters((prev) => ({
      ...prev,
      priceRange: [value[0], value[1]],
    }))
  }

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      categories: checked ? [...prev.categories, category] : prev.categories.filter((c) => c !== category),
    }))
  }

  const handleColorChange = (color: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      colors: checked ? [...prev.colors, color] : prev.colors.filter((c) => c !== color),
    }))
  }

  const handleSizeChange = (size: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      sizes: checked ? [...prev.sizes, size] : prev.sizes.filter((s) => s !== size),
    }))
  }

  const handleInStockChange = (checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      inStock: checked,
    }))
  }

  // Handle temp filter changes for mobile view
  const handleTempPriceChange = (value: number[]) => {
    setTempFilters((prev) => ({
      ...prev,
      priceRange: [value[0], value[1]],
    }))
  }

  const handleTempCategoryChange = (category: string, checked: boolean) => {
    setTempFilters((prev) => ({
      ...prev,
      categories: checked ? [...prev.categories, category] : prev.categories.filter((c) => c !== category),
    }))
  }

  const handleTempColorChange = (color: string, checked: boolean) => {
    setTempFilters((prev) => ({
      ...prev,
      colors: checked ? [...prev.colors, color] : prev.colors.filter((c) => c !== color),
    }))
  }

  const handleTempSizeChange = (size: string, checked: boolean) => {
    setTempFilters((prev) => ({
      ...prev,
      sizes: checked ? [...prev.sizes, size] : prev.sizes.filter((s) => s !== size),
    }))
  }

  const handleTempInStockChange = (checked: boolean) => {
    setTempFilters((prev) => ({
      ...prev,
      inStock: checked,
    }))
  }

  const resetFilters = () => {
    setFilters({
      priceRange: minMaxPrice,
      categories: [],
      colors: [],
      sizes: [],
      inStock: false,
    })
  }

  const resetTempFilters = () => {
    setTempFilters({
      priceRange: minMaxPrice,
      categories: [],
      colors: [],
      sizes: [],
      inStock: false,
    })
  }

  const filterContent = (
    <div className="flex flex-wrap items-center gap-4">
      {/* Price Range */}
      <SimpleDropdown
        trigger={
          <SimpleDropdownTrigger>
            Price
            {(filters.priceRange[0] > minMaxPrice[0] || filters.priceRange[1] < minMaxPrice[1]) && (
              <span className="ml-1 text-xs bg-secondary rounded-sm px-1">
                ${filters.priceRange[0]}-${filters.priceRange[1]}
              </span>
            )}
          </SimpleDropdownTrigger>
        }
        className="w-80"
      >
        <div className="space-y-4 p-2">
          <h3 className="font-medium text-sm">Price Range</h3>
          <Slider
            defaultValue={[filters.priceRange[0], filters.priceRange[1]]}
            min={minMaxPrice[0]}
            max={minMaxPrice[1]}
            step={1}
            value={[filters.priceRange[0], filters.priceRange[1]]}
            onValueChange={handlePriceChange}
            className="my-6"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm">${filters.priceRange[0]}</span>
            <span className="text-sm">${filters.priceRange[1]}</span>
          </div>
        </div>
      </SimpleDropdown>

      {/* Categories */}
      <SimpleDropdown
        trigger={
          <SimpleDropdownTrigger>
            Categories
            {filters.categories.length > 0 && (
              <span className="ml-1 text-xs bg-secondary rounded-sm px-1">{filters.categories.length}</span>
            )}
          </SimpleDropdownTrigger>
        }
        className="w-80"
      >
        <div className="space-y-2 max-h-[200px] overflow-y-auto p-2">
          {availableCategories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={(checked) => handleCategoryChange(category, checked === true)}
              />
              <Label htmlFor={`category-${category}`} className="text-sm">
                {category}
              </Label>
            </div>
          ))}
          {availableCategories.length === 0 && <p className="text-sm text-muted-foreground">No categories available</p>}
        </div>
      </SimpleDropdown>

      {/* Colors */}
      <SimpleDropdown
        trigger={
          <SimpleDropdownTrigger>
            Colors
            {filters.colors.length > 0 && (
              <span className="ml-1 text-xs bg-secondary rounded-sm px-1">{filters.colors.length}</span>
            )}
          </SimpleDropdownTrigger>
        }
        className="w-80"
      >
        <div className="space-y-2 max-h-[200px] overflow-y-auto p-2">
          {availableColors.map((color) => (
            <div key={color} className="flex items-center space-x-2">
              <Checkbox
                id={`color-${color}`}
                checked={filters.colors.includes(color)}
                onCheckedChange={(checked) => handleColorChange(color, checked === true)}
              />
              <Label htmlFor={`color-${color}`} className="text-sm capitalize">
                {color}
              </Label>
            </div>
          ))}
          {availableColors.length === 0 && <p className="text-sm text-muted-foreground">No colors available</p>}
        </div>
      </SimpleDropdown>

      {/* Sizes */}
      <SimpleDropdown
        trigger={
          <SimpleDropdownTrigger>
            Sizes
            {filters.sizes.length > 0 && (
              <span className="ml-1 text-xs bg-secondary rounded-sm px-1">{filters.sizes.length}</span>
            )}
          </SimpleDropdownTrigger>
        }
        className="w-80"
      >
        <div className="space-y-2 max-h-[200px] overflow-y-auto p-2">
          {availableSizes.map((size) => (
            <div key={size} className="flex items-center space-x-2">
              <Checkbox
                id={`size-${size}`}
                checked={filters.sizes.includes(size)}
                onCheckedChange={(checked) => handleSizeChange(size, checked === true)}
              />
              <Label htmlFor={`size-${size}`} className="text-sm">
                {size}
              </Label>
            </div>
          ))}
          {availableSizes.length === 0 && <p className="text-sm text-muted-foreground">No sizes available</p>}
        </div>
      </SimpleDropdown>

      {/* Availability */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="in-stock"
          checked={filters.inStock}
          onCheckedChange={(checked) => handleInStockChange(checked === true)}
        />
        <Label htmlFor="in-stock" className="text-sm">
          In Stock Only
        </Label>
      </div>

      {/* Reset Filters */}
      <Button variant="ghost" onClick={resetFilters} size="sm" className="h-8 px-2">
        <X className="h-4 w-4 mr-1" />
        Clear
      </Button>
    </div>
  )

  const activeFilterCount = activeFiltersCount

  // Mobile view uses a sheet/drawer
  if (isMobile) {
    return (
      <Sheet onOpenChange={(open) => open && handleSheetOpen()}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 text-xs bg-secondary rounded-sm px-1">{activeFilterCount}</span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Narrow down your search results with these filters.</SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-6">
            {/* Price Range */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Price Range</h3>
              <Slider
                defaultValue={[tempFilters.priceRange[0], tempFilters.priceRange[1]]}
                min={minMaxPrice[0]}
                max={minMaxPrice[1]}
                step={1}
                value={[tempFilters.priceRange[0], tempFilters.priceRange[1]]}
                onValueChange={handleTempPriceChange}
                className="my-6"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm">${tempFilters.priceRange[0]}</span>
                <span className="text-sm">${tempFilters.priceRange[1]}</span>
              </div>
            </div>

            <Separator />

            {/* Categories */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Categories</h3>
              <div className="space-y-2">
                {availableCategories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mobile-category-${category}`}
                      checked={tempFilters.categories.includes(category)}
                      onCheckedChange={(checked) => handleTempCategoryChange(category, checked === true)}
                    />
                    <Label htmlFor={`mobile-category-${category}`} className="text-sm">
                      {category}
                    </Label>
                  </div>
                ))}
                {availableCategories.length === 0 && (
                  <p className="text-sm text-muted-foreground">No categories available</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Colors */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Colors</h3>
              <div className="space-y-2">
                {availableColors.map((color) => (
                  <div key={color} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mobile-color-${color}`}
                      checked={tempFilters.colors.includes(color)}
                      onCheckedChange={(checked) => handleTempColorChange(color, checked === true)}
                    />
                    <Label htmlFor={`mobile-color-${color}`} className="text-sm capitalize">
                      {color}
                    </Label>
                  </div>
                ))}
                {availableColors.length === 0 && <p className="text-sm text-muted-foreground">No colors available</p>}
              </div>
            </div>

            <Separator />

            {/* Sizes */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Sizes</h3>
              <div className="space-y-2">
                {availableSizes.map((size) => (
                  <div key={size} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mobile-size-${size}`}
                      checked={tempFilters.sizes.includes(size)}
                      onCheckedChange={(checked) => handleTempSizeChange(size, checked === true)}
                    />
                    <Label htmlFor={`mobile-size-${size}`} className="text-sm">
                      {size}
                    </Label>
                  </div>
                ))}
                {availableSizes.length === 0 && <p className="text-sm text-muted-foreground">No sizes available</p>}
              </div>
            </div>

            <Separator />

            {/* Availability */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Availability</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mobile-in-stock"
                  checked={tempFilters.inStock}
                  onCheckedChange={(checked) => handleTempInStockChange(checked === true)}
                />
                <Label htmlFor="mobile-in-stock" className="text-sm">
                  In Stock Only
                </Label>
              </div>
            </div>
          </div>
          <SheetFooter className="flex flex-row gap-2 justify-between">
            <Button variant="outline" onClick={resetTempFilters} className="flex-1">
              Reset Filters
            </Button>
            <SheetClose asChild>
              <Button className="flex-1" onClick={applyFilters}>
                Apply Filters
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop view shows filters directly
  return <div className="w-full">{filterContent}</div>
}

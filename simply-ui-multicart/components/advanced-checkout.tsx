"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clipboard, Check, ShoppingCart, RefreshCw, Save } from "lucide-react"
import Image from "next/image"
import type { CartItem } from "./cart-provider"
import { generateCartUrl, generateAllCartUrls } from "@/lib/cart-url-generator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

interface AdvancedCheckoutProps {
  vendor: string
  items: CartItem[]
  onClose: () => void
  open: boolean
}

// Load saved vendor formats from localStorage
const getSavedVendorFormats = (): Record<string, string> => {
  if (typeof window === "undefined") return {}

  try {
    const saved = localStorage.getItem("vendorFormats")
    return saved ? JSON.parse(saved) : {}
  } catch (error) {
    console.error("Error loading saved vendor formats:", error)
    return {}
  }
}

// Save a vendor format to localStorage
const saveVendorFormat = (vendor: string, format: string) => {
  if (typeof window === "undefined") return

  try {
    const savedFormats = getSavedVendorFormats()
    savedFormats[vendor.toLowerCase()] = format
    localStorage.setItem("vendorFormats", JSON.stringify(savedFormats))
  } catch (error) {
    console.error("Error saving vendor format:", error)
  }
}

export function AdvancedCheckout({ vendor, items, onClose, open }: AdvancedCheckoutProps) {
  const [activeTab, setActiveTab] = useState("cart")
  const [copied, setCopied] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<string>("default")
  const [customUrl, setCustomUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [savedFormats, setSavedFormats] = useState<Record<string, string>>({})

  // Generate the default cart URL
  const defaultCartUrl = generateCartUrl(vendor, items)

  // Generate all possible cart URL formats
  const allCartUrls = generateAllCartUrls(vendor, items)

  // Load saved formats on mount
  useEffect(() => {
    setSavedFormats(getSavedVendorFormats())
  }, [])

  // Check if we have a saved format for this vendor
  useEffect(() => {
    const vendorLower = vendor.toLowerCase()
    if (savedFormats[vendorLower]) {
      // If we have a saved format, use it as the default
      setSelectedFormat(savedFormats[vendorLower])
    }
  }, [vendor, savedFormats])

  // Generate a simple shopping list
  const shoppingList = items
    .map((item) => `${item.product_title} - ${item.size || ""} ${item.color || ""} (Qty: ${item.quantity})`)
    .join("\n")

  const handleCopyList = () => {
    navigator.clipboard.writeText(shoppingList)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveFormat = () => {
    saveVendorFormat(vendor, selectedFormat)
    setSavedFormats(getSavedVendorFormats())
    toast({
      title: "Format Saved",
      description: `The selected format has been saved for ${vendor}.`,
    })
  }

  const handleCheckout = () => {
    setIsLoading(true)

    // Use the selected format or custom URL
    let checkoutUrl = defaultCartUrl

    if (selectedFormat === "custom" && customUrl) {
      checkoutUrl = customUrl
    } else if (selectedFormat !== "default" && allCartUrls[selectedFormat]) {
      checkoutUrl = allCartUrls[selectedFormat]
    }

    // Open the checkout URL in a new tab
    window.open(checkoutUrl, "_blank")

    // Simulate a delay to show loading state
    setTimeout(() => {
      setIsLoading(false)
      onClose()
    }, 1000)
  }

  // Determine if we should show vendor-specific guidance
  const vendorLower = vendor.toLowerCase()
  const isSpecialVendor =
    vendorLower.includes("dolce vita") || vendorLower.includes("elwood") || vendorLower.includes("amalli talli")

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Checkout with {vendor}</DialogTitle>
          <DialogDescription>Choose how you'd like to complete your purchase from {vendor}.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="cart" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cart">Cart Link</TabsTrigger>
            <TabsTrigger value="formats">URL Formats</TabsTrigger>
            <TabsTrigger value="items">Items Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="cart" className="py-4">
            <div className="space-y-4">
              {isSpecialVendor && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 text-sm">
                  <p className="font-medium">Special instructions for {vendor}</p>
                  <p className="mt-1">
                    We've added specific support for {vendor}. If the cart link doesn't work, please try the
                    "Alternative" format in the URL Formats tab.
                  </p>
                </div>
              )}

              <p>
                Click the button below to open {vendor}'s website with your cart prefilled. If the cart is empty when
                you arrive, try a different URL format from the "URL Formats" tab.
              </p>

              <div className="bg-muted p-3 rounded-md overflow-x-auto">
                <code className="text-xs break-all">{defaultCartUrl}</code>
              </div>

              <div className="flex justify-center">
                <Button onClick={handleCheckout} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Opening Cart...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Open Cart at {vendor}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="formats" className="py-4">
            <div className="space-y-4">
              <p>
                Different stores use different URL formats for cart links. If the default doesn't work, try one of these
                alternatives:
              </p>

              <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="default" id="default" />
                  <Label htmlFor="default">Default Format</Label>
                  {savedFormats[vendorLower] === "default" && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded ml-2">Saved</span>
                  )}
                </div>

                {Object.entries(allCartUrls).map(([format, url]) => (
                  <div key={format} className="flex items-start space-x-2">
                    <RadioGroupItem value={format} id={format} className="mt-1" />
                    <div className="grid gap-1.5 w-full">
                      <div className="flex items-center">
                        <Label htmlFor={format} className="font-medium">
                          {format.includes("alternative")
                            ? "Alternative Format"
                            : format.includes("standard")
                              ? "Standard Format"
                              : `Format ${format}`}
                        </Label>
                        {savedFormats[vendorLower] === format && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded ml-2">Saved</span>
                        )}
                      </div>
                      <code className="text-xs break-all bg-muted p-1 rounded block">{url}</code>
                    </div>
                  </div>
                ))}

                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="custom" id="custom" className="mt-1" />
                  <div className="grid gap-1.5 w-full">
                    <Label htmlFor="custom" className="font-medium">
                      Custom URL
                    </Label>
                    <input
                      type="text"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="Enter custom cart URL..."
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </RadioGroup>

              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={handleSaveFormat} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Save Format for {vendor}
                </Button>
                <Button onClick={handleCheckout} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Opening Cart...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Try Selected Format
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="items" className="py-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p>Here are the items you're about to purchase:</p>
                <Button variant="outline" size="sm" onClick={handleCopyList}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Clipboard className="mr-2 h-3 w-3" />
                      Copy List
                    </>
                  )}
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 border rounded-md p-2">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                      <Image
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.product_title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-sm font-medium">{item.product_title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {item.size && item.color ? `${item.size}, ${item.color}` : item.size || item.color || ""}
                      </p>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs">${item.price.toFixed(2)}</span>
                        <span className="text-xs">Qty: {item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-medium text-sm pt-2 border-t">
                <span>Subtotal ({items.length} items):</span>
                <span>${items.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="sm:order-1">
            Cancel
          </Button>
          <Button onClick={handleCheckout} disabled={isLoading} className="sm:order-2">
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Opening Cart...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Checkout Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

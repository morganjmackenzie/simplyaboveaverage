"use client"

import { useState } from "react"
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
import { Clipboard, ExternalLink, Check, ShoppingCart } from "lucide-react"
import Image from "next/image"
import type { CartItem } from "./cart-provider"

interface EnhancedCheckoutProps {
  vendor: string
  items: CartItem[]
  onClose: () => void
  open: boolean
}

export function EnhancedCheckout({ vendor, items, onClose, open }: EnhancedCheckoutProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("direct")

  // Generate a simple shopping list
  const shoppingList = items
    .map((item) => `${item.product_title} - ${item.size || ""} ${item.color || ""} (Qty: ${item.quantity})`)
    .join("\n")

  // Get the vendor's website URL
  const getVendorUrl = () => {
    // Try to get URL from the first product
    if (items.length > 0 && items[0].product_url) {
      try {
        const url = new URL(items[0].product_url)
        return `${url.protocol}//${url.hostname}`
      } catch (error) {
        // Fallback to generic URL
      }
    }
    return `https://${vendor.toLowerCase().replace(/\s+/g, "")}.com`
  }

  const handleCopyList = () => {
    navigator.clipboard.writeText(shoppingList)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDirectCheckout = () => {
    window.open(getVendorUrl(), "_blank")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Checkout with {vendor}</DialogTitle>
          <DialogDescription>Choose how you'd like to complete your purchase from {vendor}.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="direct" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="direct">Direct Link</TabsTrigger>
            <TabsTrigger value="list">Shopping List</TabsTrigger>
            <TabsTrigger value="items">Items Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="py-4">
            <div className="space-y-4">
              <p>
                Click the button below to go directly to {vendor}'s website. You'll need to add the items to your cart
                manually.
              </p>
              <div className="flex justify-center">
                <Button onClick={handleDirectCheckout} className="w-full">
                  Go to {vendor}'s Website
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" className="py-4">
            <div className="space-y-4">
              <p>
                Copy this shopping list and paste it into your notes. You can reference it while shopping on {vendor}'s
                website.
              </p>
              <div className="bg-muted p-3 rounded-md">
                <pre className="text-sm whitespace-pre-wrap">{shoppingList}</pre>
              </div>
              <div className="flex justify-center">
                <Button onClick={handleCopyList} className="w-full">
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Clipboard className="mr-2 h-4 w-4" />
                      Copy Shopping List
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="items" className="py-4">
            <div className="space-y-4">
              <p>Here are the items you're about to purchase from {vendor}:</p>
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
          {activeTab === "direct" && (
            <Button onClick={handleDirectCheckout} className="sm:order-2">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Go to {vendor}
            </Button>
          )}
          {activeTab === "list" && (
            <Button onClick={handleCopyList} className="sm:order-2">
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}
              {copied ? "Copied!" : "Copy List"}
            </Button>
          )}
          {activeTab === "items" && (
            <Button onClick={handleDirectCheckout} className="sm:order-2">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Shop at {vendor}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

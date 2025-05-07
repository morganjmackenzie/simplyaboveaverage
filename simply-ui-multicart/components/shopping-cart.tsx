"use client"

import { useCart, type CartItem } from "@/components/cart-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ShoppingBag, ExternalLink, Settings } from "lucide-react"
import CartItemComponent from "./cart-item"
import { useState } from "react"
import { AdvancedCheckout } from "./advanced-checkout"
import { generateCartUrl } from "@/lib/cart-url-generator"

interface ShoppingCartProps {
  inSidebar?: boolean
}

export default function ShoppingCart({ inSidebar = false }: ShoppingCartProps) {
  const { items, getItemsCount, getSubtotal, getUniqueBrands, getBrandItems, getBrandSubtotal } = useCart()
  const [checkoutVendor, setCheckoutVendor] = useState<string | null>(null)
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([])
  const [isAdvancedCheckoutOpen, setIsAdvancedCheckoutOpen] = useState(false)

  const itemsCount = getItemsCount()

  // Direct checkout - bypasses the dialog and goes straight to the vendor's website
  const handleDirectCheckout = (vendor: string) => {
    const vendorItems = getBrandItems(vendor)

    // Generate the cart URL using our utility
    const cartUrl = generateCartUrl(vendor, vendorItems)

    // Open the vendor's website in a new tab
    window.open(cartUrl, "_blank")
  }

  // Advanced checkout - shows the dialog with multiple options
  const handleAdvancedCheckout = (vendor: string) => {
    const vendorItems = getBrandItems(vendor)
    setCheckoutVendor(vendor)
    setCheckoutItems(vendorItems)
    setIsAdvancedCheckoutOpen(true)
  }

  // If in sidebar, don't wrap in Card
  const CartContent = () => (
    <div className="space-y-6">
      {itemsCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Your cart is empty</p>
          <p className="text-sm text-muted-foreground mt-1">Add items from the product listing to get started</p>
        </div>
      ) : (
        <>
          {getUniqueBrands().map((vendor) => (
            <div key={vendor} className="space-y-4">
              <h3 className="font-semibold text-lg">{vendor}</h3>

              <div className="space-y-3">
                {getBrandItems(vendor).map((item) => (
                  <CartItemComponent key={item.id} item={item} />
                ))}
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal ({vendor})</span>
                  <span>${getBrandSubtotal(vendor).toFixed(2)}</span>
                </div>

                <div className="flex gap-2">
                  <Button variant="default" className="w-full" onClick={() => handleDirectCheckout(vendor)}>
                    Checkout with {vendor}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleAdvancedCheckout(vendor)}
                    title="Advanced checkout options"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator className="my-2" />
            </div>
          ))}

          <div className="pt-2">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${getSubtotal().toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )

  if (inSidebar) {
    return (
      <>
        <CartContent />
        {checkoutVendor && (
          <AdvancedCheckout
            vendor={checkoutVendor}
            items={checkoutItems}
            open={isAdvancedCheckoutOpen}
            onClose={() => setIsAdvancedCheckoutOpen(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Your Cart {itemsCount > 0 && `(${itemsCount} ${itemsCount === 1 ? "item" : "items"})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CartContent />
        </CardContent>
      </Card>

      {checkoutVendor && (
        <AdvancedCheckout
          vendor={checkoutVendor}
          items={checkoutItems}
          open={isAdvancedCheckoutOpen}
          onClose={() => setIsAdvancedCheckoutOpen(false)}
        />
      )}
    </>
  )
}

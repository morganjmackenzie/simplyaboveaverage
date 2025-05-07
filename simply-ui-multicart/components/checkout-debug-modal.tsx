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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CartItem } from "./cart-provider"
import { generateCheckoutUrl } from "@/lib/checkout-utils"

interface CheckoutDebugModalProps {
  vendor: string
  items: CartItem[]
  onClose: () => void
  open: boolean
}

export function CheckoutDebugModal({ vendor, items, onClose, open }: CheckoutDebugModalProps) {
  // Filter items to ensure we're only working with this vendor's items
  const vendorItems = items.filter((item) => item.vendor === vendor)

  const initialUrl = generateCheckoutUrl(vendor, vendorItems)
  const [checkoutUrl, setCheckoutUrl] = useState(initialUrl)

  const handleCheckout = () => {
    window.open(checkoutUrl, "_blank")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Checkout with {vendor}</DialogTitle>
          <DialogDescription>Review and customize the checkout URL before proceeding.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="vendor-name">Vendor</Label>
            <Input id="vendor-name" value={vendor} readOnly className="font-mono text-xs" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="checkout-url">Checkout URL</Label>
            <Input
              id="checkout-url"
              value={checkoutUrl}
              onChange={(e) => setCheckoutUrl(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div className="grid gap-2">
            <Label>Cart Items ({vendorItems.length})</Label>
            <div className="bg-muted p-2 rounded-md max-h-40 overflow-y-auto">
              <pre className="text-xs">{JSON.stringify(vendorItems, null, 2)}</pre>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCheckout}>Proceed to Checkout</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

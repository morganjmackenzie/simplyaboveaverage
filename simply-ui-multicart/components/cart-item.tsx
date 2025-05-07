"use client"

import { useCart, type CartItem } from "@/components/cart-provider"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"

interface CartItemProps {
  item: CartItem
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart()

  return (
    <div className="flex items-center space-x-4">
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
        <Image src={item.image_url || "/placeholder.svg"} alt={item.product_title} fill className="object-cover" />
      </div>

      <div className="flex-grow">
        <h4 className="text-sm font-medium">{item.product_title}</h4>
        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
        {item.color && item.size && (
          <p className="text-xs text-muted-foreground">
            {item.color}, {item.size}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-none"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
          >
            <Minus className="h-3 w-3" />
          </Button>

          <span className="w-8 text-center text-sm">{item.quantity}</span>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-none"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={() => removeFromCart(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

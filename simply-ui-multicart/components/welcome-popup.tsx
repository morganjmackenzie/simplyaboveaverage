"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Heart, Search, ExternalLink } from "lucide-react"

export function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if this is the first visit
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome")

    if (!hasSeenWelcome) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    // Set flag in localStorage
    localStorage.setItem("hasSeenWelcome", "true")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to simplyaboveaverage!</DialogTitle>
          <DialogDescription className="text-lg pt-2">Finding clothes that fit shouldn't be hard.</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <h3 className="font-medium text-lg">How to use this site:</h3>

          <div className="flex items-start gap-3">
            <Search className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Search for specific items</p>
              <p className="text-sm text-muted-foreground">
                Try searching for "black 36 in inseam jeans" or "tall dress shirts"
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Save items to your wishlist</p>
              <p className="text-sm text-muted-foreground">Click the heart icon on any product to save it for later</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShoppingCart className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Add items to your cart</p>
              <p className="text-sm text-muted-foreground">
                Add items from multiple brands and checkout with one click
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ExternalLink className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Checkout with ease</p>
              <p className="text-sm text-muted-foreground">
                We'll generate cart links for each store so you can complete your purchase
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full sm:w-auto">
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

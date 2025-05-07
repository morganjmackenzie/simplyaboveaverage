"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, ShoppingBag, LogOut, User } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import { useWishlist } from "@/components/wishlist-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CartSidebar } from "./cart-sidebar"
import { getCurrentUser, signOut, type UserSession } from "@/lib/auth"

export function Header() {
  const router = useRouter()
  const { getItemsCount } = useCart()
  const { getItemsCount: getWishlistCount } = useWishlist()
  const [user, setUser] = useState<UserSession | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const itemsCount = getItemsCount()
  const wishlistCount = getWishlistCount()

  // Load user on component mount
  useEffect(() => {
    async function loadUser() {
      const supabaseUser = await getCurrentUser()
      setUser(supabaseUser)
    }

    loadUser()
  }, [])

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen)
  }

  const handleSignOut = async () => {
    const success = await signOut()
    if (success) {
      setUser(null)
      router.push("/")
    }
  }

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!user || !user.name) return "?"

    const nameParts = user.name.split(" ")
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()

    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
  }

  return (
    <>
      <header className="border-b sticky top-0 bg-white z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left section (can be used for categories or search later) */}
          <div className="w-1/4 flex items-center">{/* Reserved for future use */}</div>

          {/* Center section with text logo and tagline */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <Link href="/" className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">simplyaboveaverage</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                "growing to 6" is hard. finding clothes that fit shouldn't be."
              </p>
            </Link>
          </div>

          {/* Right section with icons */}
          <div className="w-1/4 flex items-center justify-end space-x-4">
            {/* Wishlist */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Wishlist"
              onClick={() => router.push("/wishlist")}
            >
              <Heart className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Button variant="ghost" size="icon" className="relative" aria-label="Shopping cart" onClick={toggleCart}>
              <ShoppingBag className="h-5 w-5" />
              {itemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemsCount}
                </span>
              )}
            </Button>

            {/* User Account */}
            {user?.isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="User account">
                    <Avatar className="h-8 w-8">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.name || "User"} />
                      ) : (
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                          {getInitials()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user.name}
                    <div className="text-xs font-normal text-muted-foreground mt-0.5">{user.email}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/wishlist")}>
                    <Heart className="mr-2 h-4 w-4" />
                    Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/members")}>
                    Members Area
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Sign in"
                onClick={() => router.push("/auth")}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm">?</AvatarFallback>
                </Avatar>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}

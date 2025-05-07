import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/components/cart-provider"
import { WishlistProvider } from "@/components/wishlist-provider"
import { Header } from "@/components/header"
import { WelcomePopup } from "@/components/welcome-popup"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Simply Above Average",
  description: "Growing to 6' is hard. Finding clothes that fit shouldn't be.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <WishlistProvider>
            <Header />
            {children}
            <WelcomePopup />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, Heart, Calendar, User } from "lucide-react"

// Types for our content
type Brand = {
  id: number
  name: string
  logo: string
  description: string
  url: string
  discount?: string
}

type BlogPost = {
  id: number
  title: string
  excerpt: string
  image: string
  date: string
  author: string
  url: string
}

type LookbookItem = {
  id: number
  title: string
  image: string
  description: string
  products: {
    name: string
    brand: string
    url: string
  }[]
}

export default function MembersPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Sample data for brands
  const brands: Brand[] = [
    {
      id: 1,
      name: "Amalli Talli",
      logo: "/placeholder.svg?key=msmfx",
      description: "Clothing designed specifically for tall women, with styles that actually fit your proportions.",
      url: "https://amallitalli.com",
      discount: "15% off with code SIMPLY15",
    },
    {
      id: 2,
      name: "American Tall",
      logo: "/placeholder.svg?key=a6hru",
      description: "Tall men's and women's clothing with extended inseams and sleeve lengths.",
      url: "https://americantall.com",
      discount: "10% off first order",
    },
    {
      id: 3,
      name: "Long Tall Sally",
      logo: "/placeholder.svg?key=smuyj",
      description: "Tall women's fashion with 34-38\" inseams and proportionally sized tops.",
      url: "https://longtallsally.com",
    },
    {
      id: 4,
      name: "ASOS Tall",
      logo: "/placeholder.svg?key=9asfi",
      description: "Trendy tall fashion for both men and women with affordable prices.",
      url: "https://asos.com/tall",
    },
    {
      id: 5,
      name: "Tall Slim Tees",
      logo: "/placeholder.svg?key=kmt1i",
      description: "T-shirts designed specifically for tall, slim men with extra length.",
      url: "https://tallslimtees.com",
      discount: "Buy 3, get 1 free",
    },
    {
      id: 6,
      name: "Alloy Apparel",
      logo: "/placeholder.svg?height=80&width=200&query=Alloy Apparel logo",
      description: "Tall women's jeans with inseams up to 37\" and trendy styles.",
      url: "https://alloyapparel.com",
    },
  ]

  // Sample data for blog posts
  const blogPosts: BlogPost[] = [
    {
      id: 1,
      title: "Finding Jeans That Actually Fit Tall Women",
      excerpt:
        "The struggle to find jeans with the right inseam is real. Here are our top picks for tall women's jeans that actually reach your ankles.",
      image: "/placeholder.svg?height=200&width=300&query=tall woman wearing jeans",
      date: "May 10, 2023",
      author: "Sarah Johnson",
      url: "#",
    },
    {
      id: 2,
      title: "Tall Men's Guide to Business Casual",
      excerpt:
        "Navigating business casual as a tall man can be challenging. Here's how to look professional without sacrificing fit.",
      image: "/placeholder.svg?height=200&width=300&query=tall man in business casual outfit",
      date: "April 22, 2023",
      author: "Michael Chen",
      url: "#",
    },
    {
      id: 3,
      title: "The Best Workout Clothes for Tall Athletes",
      excerpt:
        "Finding athletic wear that doesn't ride up or expose your midriff during workouts is a game-changer. Here are our recommendations.",
      image: "/placeholder.svg?height=200&width=300&query=tall person exercising",
      date: "March 15, 2023",
      author: "Alex Rodriguez",
      url: "#",
    },
    {
      id: 4,
      title: "Tall Fashion Myths Debunked",
      excerpt:
        "Can tall people wear horizontal stripes? Should you avoid certain patterns? We debunk common tall fashion myths.",
      image: "/placeholder.svg?height=200&width=300&query=tall fashion model",
      date: "February 28, 2023",
      author: "Emma Wilson",
      url: "#",
    },
  ]

  // Sample data for lookbook
  const lookbookItems: LookbookItem[] = [
    {
      id: 1,
      title: "Summer Casual",
      image: "/placeholder.svg?height=400&width=300&query=tall model in summer outfit",
      description:
        "Perfect for weekend brunches or casual Friday at the office. This look combines comfort with style.",
      products: [
        { name: "Tall Linen Shirt", brand: "American Tall", url: "#" },
        { name: '36" Inseam Chinos', brand: "Amalli Talli", url: "#" },
        { name: "Leather Sandals", brand: "Long Tall Sally", url: "#" },
      ],
    },
    {
      id: 2,
      title: "Business Professional",
      image: "/placeholder.svg?height=400&width=300&query=tall model in business suit",
      description: "Make a statement in the boardroom with this perfectly tailored look that accommodates your height.",
      products: [
        { name: "Tall Fit Blazer", brand: "ASOS Tall", url: "#" },
        { name: "Extra Long Dress Shirt", brand: "Tall Slim Tees", url: "#" },
        { name: '36" Inseam Dress Pants', brand: "American Tall", url: "#" },
      ],
    },
    {
      id: 3,
      title: "Workout Ready",
      image: "/placeholder.svg?height=400&width=300&query=tall model in workout clothes",
      description: "Stay comfortable during your workout with these pieces designed for tall athletes.",
      products: [
        { name: "Tall Athletic Leggings", brand: "Long Tall Sally", url: "#" },
        { name: "Extra Long Sports Top", brand: "Amalli Talli", url: "#" },
        { name: "Running Shoes", brand: "Nike", url: "#" },
      ],
    },
    {
      id: 4,
      title: "Evening Elegance",
      image: "/placeholder.svg?height=400&width=300&query=tall model in evening dress",
      description: "Turn heads at your next formal event with this elegant look that celebrates your height.",
      products: [
        { name: "Tall Maxi Dress", brand: "ASOS Tall", url: "#" },
        { name: "Statement Heels", brand: "Long Tall Sally", url: "#" },
        { name: "Clutch Purse", brand: "Alloy Apparel", url: "#" },
      ],
    },
  ]

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser()
      if (user) {
        setIsAuthenticated(true)
      } else {
        router.push("/auth?redirect=/members")
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading member content...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Router will redirect, but this prevents flash of content
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2">Members Area</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Welcome to your exclusive members area! Discover our favorite brands, read our latest blog posts, and get
          inspired by our lookbook curated specifically for tall individuals.
        </p>
      </div>

      <Tabs defaultValue="brands" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="brands">Favorite Brands</TabsTrigger>
          <TabsTrigger value="blog">Blog Posts</TabsTrigger>
          <TabsTrigger value="lookbook">Lookbook</TabsTrigger>
        </TabsList>

        <TabsContent value="brands" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand) => (
              <Card key={brand.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="h-20 flex items-center justify-center">
                    <Image
                      src={brand.logo || "/placeholder.svg"}
                      alt={brand.name}
                      width={200}
                      height={80}
                      className="object-contain"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{brand.description}</p>
                  {brand.discount && (
                    <div className="bg-green-50 text-green-700 p-2 rounded-md text-sm mb-4">
                      <strong>Member Discount:</strong> {brand.discount}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <a href={brand.url} target="_blank" rel="noopener noreferrer">
                      Visit Store <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="blog" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative">
                  <Image src={post.image || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
                </div>
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" /> {post.date}
                    </span>
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-1" /> {post.author}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{post.excerpt}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" asChild className="w-full">
                    <a href={post.url}>Read Full Article</a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lookbook" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {lookbookItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="relative h-full min-h-[300px]">
                    <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    <Separator className="my-4" />
                    <h4 className="font-medium mb-2">Featured Products:</h4>
                    <ul className="space-y-2">
                      {item.products.map((product, idx) => (
                        <li key={idx} className="text-sm">
                          <a href={product.url} className="hover:underline flex items-center">
                            <Heart className="h-3 w-3 mr-1 text-pink-500" />
                            <span className="font-medium">{product.name}</span>
                            <span className="text-gray-500 ml-1">by {product.brand}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

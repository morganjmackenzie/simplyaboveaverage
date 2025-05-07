"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Camera } from "lucide-react"
import Link from "next/link"
import { getCurrentUser, updateUserProfile, signOut, type UserSession } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  useEffect(() => {
    async function loadUser() {
      const userData = await getCurrentUser()
      if (!userData) {
        router.push("/auth?redirectTo=/profile")
        return
      }

      setUser(userData)
      setName(userData.name || "")
      setAvatarUrl(userData.avatar_url || "")
      setIsLoading(false)
    }

    loadUser()
  }, [router])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const result = await updateUserProfile({
        name,
        avatar_url: avatarUrl,
      })

      if (result.success) {
        // Update the local user state
        setUser((prev) => (prev ? { ...prev, name, avatar_url: avatarUrl } : null))
      }
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    const success = await signOut()
    if (success) {
      router.push("/")
    }
  }

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!name) return "?"

    const nameParts = name.split(" ")
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()

    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container max-w-md mx-auto py-12 px-4">
      <Link href="/" className="inline-flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to shopping
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Your Profile</CardTitle>
          <CardDescription className="text-center">View and edit your account information</CardDescription>
        </CardHeader>

        <form onSubmit={handleSaveProfile}>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={name || "User"} />
                ) : (
                  <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                )}
              </Avatar>

              <div className="text-sm text-muted-foreground flex items-center">
                <Camera className="h-4 w-4 mr-1" />
                <span>Avatar URL (paste a link to your image)</span>
              </div>
              <Input
                className="mt-2"
                placeholder="https://example.com/your-avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>

            {/* Email - Read only */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled />
              <p className="text-xs text-muted-foreground">Your email address cannot be changed</p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>

            <Button type="button" variant="outline" className="w-full" onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

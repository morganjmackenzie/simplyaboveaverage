"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        console.log("Auth callback page loaded, handling authentication...")

        // Check for error in URL
        const url = new URL(window.location.href)
        const errorParam = url.searchParams.get("error")
        const errorDescription = url.searchParams.get("error_description")

        if (errorParam) {
          console.error("Error in auth callback URL:", errorParam, errorDescription)
          setError(`Authentication error: ${errorDescription || errorParam}`)
          toast({
            title: "Authentication failed",
            description: errorDescription || "There was a problem with the authentication process.",
            variant: "destructive",
          })

          // Redirect after a delay
          setTimeout(() => router.push("/auth"), 3000)
          return
        }

        // Get the current user after OAuth redirect
        const user = await getCurrentUser()

        if (user) {
          console.log("User authenticated successfully:", user.id)

          // Store user in localStorage for client-side access
          localStorage.setItem("user", JSON.stringify(user))

          toast({
            title: "Signed in successfully",
            description: `Welcome${user.name ? `, ${user.name}` : ""}!`,
          })

          // Redirect to home page
          router.push("/")
        } else {
          console.error("No user found after authentication")
          setError("Unable to complete the sign in process")

          // If no user is found, redirect to auth page
          toast({
            title: "Sign in failed",
            description: "Unable to complete the sign in process. Please try again.",
            variant: "destructive",
          })

          // Redirect after a delay
          setTimeout(() => router.push("/auth"), 2000)
        }
      } catch (error) {
        console.error("Error in auth callback:", error)
        setError("Authentication process failed")

        toast({
          title: "Authentication error",
          description: "There was a problem completing the authentication. Please try again.",
          variant: "destructive",
        })

        // Redirect after a delay
        setTimeout(() => router.push("/auth"), 2000)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md px-4">
        {error ? (
          <>
            <div className="text-red-500 mb-4 text-lg font-medium">{error}</div>
            <p>Redirecting you back to the login page...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Completing sign in...</p>
            <p className="mt-2 text-sm text-muted-foreground">Please wait while we set up your account.</p>
          </>
        )}
      </div>
    </div>
  )
}

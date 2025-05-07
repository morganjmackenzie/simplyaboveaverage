import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

export type UserSession = {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  isLoggedIn: boolean
}

// Sign in with Google
export async function signInWithGoogle() {
  try {
    console.log("Starting Google sign-in process...")

    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      console.error("Cannot sign in with Google outside of browser environment")
      return
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })

    if (error) {
      console.error("Error in signInWithGoogle:", error)
      throw error
    }

    console.log("Google sign-in initiated successfully", data)

    // The user will be redirected to Google's OAuth page
  } catch (error) {
    console.error("Error signing in with Google:", error)
    toast({
      title: "Error signing in",
      description: "There was a problem signing in with Google. Please try again or use email login.",
      variant: "destructive",
    })
  }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    toast({
      title: "Signed in successfully",
      description: `Welcome back${data.user?.user_metadata?.name ? ", " + data.user.user_metadata.name : ""}!`,
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error signing in with email:", error)

    toast({
      title: "Sign in failed",
      description: error.message || "Failed to sign in. Please check your credentials and try again.",
      variant: "destructive",
    })

    return {
      success: false,
      error: error.message || "Failed to sign in. Please try again.",
    }
  }
}

// Sign up with email and password
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    if (error) throw error

    // Check if user was created successfully
    if (data?.user) {
      toast({
        title: "Account created successfully",
        description: "Welcome to simplyaboveaverage!",
      })

      return { success: true }
    } else {
      // This might happen if email confirmation is required
      toast({
        title: "Verification email sent",
        description: "Please check your email to confirm your account.",
      })

      return { success: true }
    }
  } catch (error: any) {
    console.error("Error signing up:", error)

    toast({
      title: "Sign up failed",
      description: error.message || "Failed to create account. Please try again.",
      variant: "destructive",
    })

    return {
      success: false,
      error: error.message || "Failed to create account. Please try again.",
    }
  }
}

// Sign out
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }

    toast({
      title: "Signed out successfully",
      description: "You have been signed out of your account.",
    })

    return true
  } catch (error) {
    console.error("Error signing out:", error)
    toast({
      title: "Error signing out",
      description: "There was a problem signing out. Please try again.",
    })
    return false
  }
}

// Get current session and user profile
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error getting session:", sessionError)
      return null
    }

    if (!session) {
      console.log("No active session found")
      return null
    }

    console.log("Session found:", session.user.id)

    // Try to get the user's profile from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    // If the profile doesn't exist, create one
    if (profileError && profileError.code === "PGRST116") {
      console.log("Profile not found, creating new profile for user:", session.user.id)

      // Extract name from user metadata or email
      const userName =
        session.user.user_metadata.full_name ||
        session.user.user_metadata.name ||
        session.user.email?.split("@")[0] ||
        "User"

      // Create a new profile
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert([
          {
            id: session.user.id,
            email: session.user.email,
            name: userName,
            avatar_url: session.user.user_metadata.avatar_url,
          },
        ])
        .select()
        .single()

      if (createError) {
        console.error("Error creating user profile:", createError)

        // Even if profile creation fails, return basic user info
        return {
          id: session.user.id,
          email: session.user.email || "",
          name: userName,
          avatar_url: session.user.user_metadata.avatar_url,
          isLoggedIn: true,
        }
      }

      return {
        id: session.user.id,
        email: session.user.email || "",
        name: newProfile.name,
        avatar_url: newProfile.avatar_url,
        isLoggedIn: true,
      }
    }

    // Return the user profile if it exists
    if (profile) {
      console.log("Existing profile found for user:", session.user.id)
      return {
        id: session.user.id,
        email: session.user.email || "",
        name: profile.name,
        avatar_url: profile.avatar_url,
        isLoggedIn: true,
      }
    }

    // Fallback to session data if no profile exists
    console.log("Using session data for user:", session.user.id)
    return {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.user_metadata.full_name || session.user.email?.split("@")[0],
      avatar_url: session.user.user_metadata.avatar_url,
      isLoggedIn: true,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Update user profile
export async function updateUserProfile(updates: { name?: string; avatar_url?: string }): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      throw new Error("No active session found")
    }

    const userId = session.user.id

    // Update the profile in the profiles table
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

    if (error) throw error

    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error updating profile:", error)

    toast({
      title: "Update failed",
      description: error.message || "Failed to update profile. Please try again.",
      variant: "destructive",
    })

    return {
      success: false,
      error: error.message || "Failed to update profile. Please try again.",
    }
  }
}

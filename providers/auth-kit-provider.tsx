"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { AuthKitProvider } from "@farcaster/auth-kit"
import { useFrame } from "@/providers/frame-provider"

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean
  profile: any | null
  fid: number | null
  username: string | null
  displayName: string | null
  pfpUrl: string | null
  bio: string | null
  powerBadge: boolean | null
  custody: string | null
  
  // Enhanced features
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthKitProvider")
  }
  return context
}

interface AuthKitProviderProps {
  children: ReactNode
}

// Enhanced Auth Kit Provider with FarCaster Frame integration
export function EnhancedAuthKitProvider({ children }: AuthKitProviderProps) {
  const { isFrame, wallet, isWalletConnected, user } = useFrame()
  
  // Auth Kit configuration for Base mainnet following official docs
  const authConfig = {
    // Base mainnet RPC
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.base.org",
    // Domain for SIWE (Sign-In With Ethereum)
    domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "farcaster.xyz",
    // SIWE URI
    siweUri: process.env.NEXT_PUBLIC_APP_URL || "https://farcaster.xyz/miniapps",
    // Enable Auth Kit features
    enableWallet: true,
    enableProfile: true,
    enableCustody: true
  }

  return (
    <AuthKitProvider config={authConfig}>
      <AuthKitContextProvider 
        isFrame={isFrame} 
        isWalletConnected={isWalletConnected}
        frameUser={user}
        frameWallet={wallet}
      >
        {children}
      </AuthKitContextProvider>
    </AuthKitProvider>
  )
}

// Internal context provider that combines Auth Kit with Frame context
function AuthKitContextProvider({ 
  children, 
  isFrame, 
  isWalletConnected,
  frameUser,
  frameWallet
}: { 
  children: ReactNode
  isFrame: boolean
  isWalletConnected: boolean
  frameUser: any
  frameWallet: any
}) {
  const [profile, setProfile] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Enhanced sign in function
  const signIn = async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      if (isFrame && isWalletConnected) {
        // In Frame context, authentication is handled by the Frame SDK
        console.log("🔗 Frame context detected, using Frame authentication")
        return
      }
      
      // For non-Frame context, we would use Auth Kit's sign-in functionality
      // This would integrate with SIWF (Sign-In With Farcaster) as per documentation
      console.log("📱 Using Auth Kit authentication")
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign in failed"
      setError(errorMessage)
      console.error("Sign in error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Enhanced sign out function
  const signOut = async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      // Clear local profile data
      setProfile(null)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign out failed"
      setError(errorMessage)
      console.error("Sign out error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      const fid = frameUser?.fid
      if (fid && !profile) {
        try {
          const response = await fetch(`/api/score?fid=${fid}`)
          const profileData = await response.json()
          setProfile(profileData)
        } catch (err) {
          console.error("Failed to load profile:", err)
        }
      }
    }

    loadProfile()
  }, [frameUser?.fid, profile])

  // Combine Frame context with profile data
  const combinedProfile = {
    // Frame context data
    fid: frameUser?.fid || null,
    username: frameUser?.username || null,
    displayName: frameUser?.displayName || null,
    pfpUrl: frameUser?.pfpUrl || null,
    bio: frameUser?.bio || null,
    powerBadge: frameUser?.powerBadge || false,
    
    // Wallet data
    custody: frameWallet?.address || null,
    walletAddress: frameWallet?.address || null,
    
    // Profile data from API
    ...profile,
    
    // Context flags
    isFrame,
    isWalletConnected
  }

  const isAuthenticated = isFrame && isWalletConnected && !!frameUser?.fid

  const contextValue: AuthContextType = {
    // Authentication state
    isAuthenticated,
    profile: combinedProfile,
    fid: combinedProfile?.fid || null,
    username: combinedProfile?.username || null,
    displayName: combinedProfile?.displayName || null,
    pfpUrl: combinedProfile?.pfpUrl || null,
    bio: combinedProfile?.bio || null,
    powerBadge: combinedProfile?.powerBadge || null,
    custody: combinedProfile?.custody || null,
    
    // Enhanced features
    signIn,
    signOut,
    isLoading,
    error
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook for easy access to authentication context
export function useEnhancedAuth() {
  return useAuthContext()
}
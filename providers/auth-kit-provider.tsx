"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { AuthKitProvider } from "@farcaster/auth-kit"

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
      <AuthKitContextProvider>
        {children}
      </AuthKitContextProvider>
    </AuthKitProvider>
  )
}

// Internal context provider that combines Auth Kit with Frame context
function AuthKitContextProvider({ 
  children
}: { 
  children: ReactNode
}) {
  const [profile, setProfile] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Enhanced sign in function
  const signIn = async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      // For non-Frame context, we would use Auth Kit's sign-in functionality
      // This would integrate with SIWF (Sign-In With Farcaster) as per documentation
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign in failed"
      setError(errorMessage)
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
    } finally {
      setIsLoading(false)
    }
  }

  // Default context values for now
  const contextValue: AuthContextType = {
    // Authentication state
    isAuthenticated: false,
    profile: null,
    fid: null,
    username: null,
    displayName: null,
    pfpUrl: null,
    bio: null,
    powerBadge: null,
    custody: null,
    
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
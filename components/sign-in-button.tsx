"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"
import { useEnhancedAuth } from "@/providers/auth-kit-provider"
import { useFrame } from "@/providers/frame-provider"
import { useNotifications } from "@/components/notification-system"
import { cn } from "@/lib/utils"

interface SignInButtonProps {
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  showUserInfo?: boolean
  compact?: boolean
}

export function SignInButton({ 
  className,
  variant = "default",
  size = "default",
  showUserInfo = true,
  compact = false
}: SignInButtonProps) {
  const { signIn, signOut, isAuthenticated, profile, isLoading, error } = useEnhancedAuth()
  const { isFrame, isWalletConnected } = useFrame()
  const { success, error: showError } = useNotifications()
  const [isSigning, setIsSigning] = useState(false)

  const handleSignIn = async () => {
    try {
      setIsSigning(true)
      await signIn()
      if (profile) {
        success("Signed in", `Welcome ${profile.displayName || profile.username}!`)
      }
    } catch (err) {
      showError("Sign in failed", err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsSigning(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setIsSigning(true)
      await signOut()
      success("Signed out", "You have been signed out successfully")
    } catch (err) {
      showError("Sign out failed", err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsSigning(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Show loading state
  if (isLoading || isSigning) {
    return (
      <Button
        disabled
        variant={variant}
        size={size}
        className={className}
      >
        <LoadingSpinner size="sm" className="mr-2" />
        {isAuthenticated ? "Signing out..." : "Signing in..."}
      </Button>
    )
  }

  // Show error state
  if (error) {
    return (
      <Card className={cn("p-3 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800", className)}>
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <span>❌</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Authentication Error</p>
            <p className="text-xs">{error}</p>
          </div>
          <Button
            onClick={handleSignIn}
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  // Not authenticated - show sign in button
  if (!isAuthenticated) {
    if (compact) {
      return (
        <Button
          onClick={handleSignIn}
          variant={variant}
          size={size}
          className={className}
        >
          🔐 Sign In
        </Button>
      )
    }

    return (
      <Card className={cn("p-4 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800", className)}>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <span>🔐</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Sign in to Farcaster</p>
              <p className="text-xs">
                {isFrame ? "Authenticate with your Farcaster account" : "Connect your Farcaster wallet"}
              </p>
            </div>
            {isFrame && (
              <Badge variant="outline" className="text-xs">
                Frame
              </Badge>
            )}
          </div>
          
          <Button
            onClick={handleSignIn}
            className="w-full"
            variant={variant}
            size={size}
          >
            🔐 Sign In with Farcaster
          </Button>
          
          {isFrame && !isWalletConnected && (
            <div className="text-xs text-blue-600 dark:text-blue-400 text-center">
              <span>💡 Make sure your wallet is connected in the Farcaster app</span>
            </div>
          )}
        </div>
      </Card>
    )
  }

  // Authenticated - show user info and sign out option
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="secondary" className="text-xs">
          {profile?.displayName || profile?.username}
        </Badge>
        {profile?.walletAddress && (
          <span className="text-xs text-muted-foreground">
            {formatAddress(profile.walletAddress)}
          </span>
        )}
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
        >
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Card className={cn("p-4 bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800", className)}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <span>✅</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              Signed in as {profile?.displayName || profile?.username}
            </p>
            {showUserInfo && (
              <div className="space-y-1 mt-1">
                {profile?.pfpUrl && (
                  <div className="flex items-center gap-2">
                    <img 
                      src={profile.pfpUrl} 
                      alt="Profile" 
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-xs">@{profile?.username}</span>
                  </div>
                )}
                {profile?.walletAddress && (
                  <p className="text-xs font-mono">
                    {formatAddress(profile.walletAddress)}
                  </p>
                )}
                {profile?.powerBadge && (
                  <Badge variant="secondary" className="text-xs">
                    ⚡ Power User
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {isFrame ? "Frame" : "Web"}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Sign Out
          </Button>
        </div>
        
        {isFrame && (
          <div className="text-xs text-green-600 dark:text-green-400 text-center">
            <span>🔗 Connected via Farcaster Frame</span>
          </div>
        )}
      </div>
    </Card>
  )
}

// Compact version for headers/navigation
export function CompactSignInButton({ className }: { className?: string }) {
  return (
    <SignInButton
      className={className}
      compact={true}
      variant="outline"
      size="sm"
      showUserInfo={false}
    />
  )
}
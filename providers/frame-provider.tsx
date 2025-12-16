"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useFarcasterFrame } from "@/hooks/use-farcaster-frame"

interface FrameUser {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
  bio?: string
  powerBadge?: boolean
}

interface FrameWallet {
  address: string
  chainId: string
  isConnected: boolean
  connect: () => Promise<void>
  sendTransaction: (tx: {
    to: string
    data: string
    value?: string
  }) => Promise<string>
}

interface FrameContextType {
  // Basic context
  isFrame: boolean
  isLoading: boolean
  error: string | null
  
  // User context
  user: FrameUser | null
  userProfile: any | null
  
  // Wallet context
  wallet: FrameWallet | null
  walletAddress: string | null
  isWalletConnected: boolean
  
  // SDK features
  sdk: any
  actions: any
  
  // Enhanced features
  notifications: any
  share: any
  openUrl: (url: string) => void
  showNotification: (notification: {
    title: string
    body?: string
    icon?: string
  }) => Promise<void>
  
  // Utilities
  refreshContext: () => Promise<void>
  retryDetection: () => void
}

const FrameContext = createContext<FrameContextType | null>(null)

export function useFrame() {
  const context = useContext(FrameContext)
  if (!context) {
    throw new Error("useFrame must be used within a FrameProvider")
  }
  return context
}

interface FrameProviderProps {
  children: ReactNode
}

export function FrameProvider({ children }: FrameProviderProps) {
  const [sdk, setSDK] = useState<any>(null)
  const [actions, setActions] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [notifications, setNotifications] = useState<any>(null)
  const [share, setShare] = useState<any>(null)
  
  const {
    isFrame,
    frameContext,
    wallet,
    isLoading,
    error,
    retryDetection
  } = useFarcasterFrame()

  const user = frameContext?.user || null
  const walletAddress = wallet?.address || null
  const isWalletConnected = wallet?.isConnected || false

  // Initialize SDK features
  useEffect(() => {
    const initializeSDK = async () => {
      if (typeof window !== 'undefined' && (window as any).farcaster) {
        const farcaster = (window as any).farcaster
        
        // Initialize SDK
        if (farcaster.sdk) {
          setSDK(farcaster.sdk)
          setActions(farcaster.sdk.actions)
          
          // Initialize notifications
          if (farcaster.notifications) {
            setNotifications(farcaster.notifications)
          }
          
          // Initialize share
          if (farcaster.share) {
            setShare(farcaster.share)
          }
        }
      }
    }

    if (isFrame) {
      initializeSDK()
    }
  }, [isFrame])

  // Load user profile when user context is available
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user && !userProfile) {
        try {
          // Load additional user profile data
          const response = await fetch(`/api/user-profile?fid=${user.fid}`)
          const profileData = await response.json()
          setUserProfile(profileData)
        } catch (err) {
          console.error("Failed to load user profile:", err)
        }
      }
    }

    loadUserProfile()
  }, [user, userProfile])

  // Enhanced open URL function
  const openUrl = (url: string) => {
    if (share && share.openUrl) {
      share.openUrl(url)
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Enhanced notification function
  const showNotification = async (notification: {
    title: string
    body?: string
    icon?: string
  }) => {
    try {
      if (notifications && notifications.create) {
        await notifications.create(notification)
      } else if (actions && actions.createNotification) {
        await actions.createNotification(notification)
      } else {
        // Fallback to browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: notification.icon || '/icon.jpg'
          })
        }
      }
    } catch (err) {
      console.error("Failed to show notification:", err)
    }
  }

  // Refresh context function
  const refreshContext = async () => {
    if (typeof window !== 'undefined' && (window as any).farcaster) {
      const farcaster = (window as any).farcaster
      if (farcaster.frameContext) {
        // Context will be automatically refreshed by useFarcasterFrame
        window.location.reload()
      }
    }
  }

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const contextValue: FrameContextType = {
    // Basic context
    isFrame,
    isLoading,
    error,
    
    // User context
    user,
    userProfile,
    
    // Wallet context
    wallet,
    walletAddress,
    isWalletConnected,
    
    // SDK features
    sdk,
    actions,
    notifications,
    share,
    
    // Enhanced features
    openUrl,
    showNotification,
    
    // Utilities
    refreshContext,
    retryDetection
  }

  return (
    <FrameContext.Provider value={contextValue}>
      {children}
    </FrameContext.Provider>
  )
}
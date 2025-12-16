/**
 * Simplified Frame Provider
 * Uses unified wallet manager for consistent, reliable frame and wallet detection
 */

"use client"

import React, { createContext, useContext, ReactNode } from "react"
import { useSimplifiedFrame } from "@/hooks/use-simplified-frame"
import { unifiedWalletManager, type WalletConnectionState, type TransactionRequest, type TransactionResult } from "@/lib/unified-wallet-manager"

interface FrameUser {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
  bio?: string
  powerBadge?: boolean
}

interface FrameContextType {
  // Basic context
  isFrame: boolean
  isLoading: boolean
  error: string | null
  
  // User context
  user: FrameUser | null
  frameContext: any | null
  
  // Wallet context
  wallet: {
    address: string
    chainId: string
    isConnected: boolean
    connect: () => Promise<void>
    sendTransaction: (tx: {
      to: string
      data: string
      value?: string
    }) => Promise<string>
  } | null
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
  
  // Enhanced wallet features
  walletState: WalletConnectionState | null
  sendTransaction: (tx: TransactionRequest) => Promise<TransactionResult>
  requestConnection: () => Promise<void>
  onWalletEvent: (event: string, callback: Function) => () => void
  
  // Utilities
  refreshContext: () => void
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
  const {
    isFrame,
    frameContext,
    wallet,
    isLoading,
    error,
    retryDetection,
    walletState,
    sendTransaction,
    requestConnection,
    onWalletEvent
  } = useSimplifiedFrame()

  const user = frameContext?.user || null
  const walletAddress = wallet?.address || null
  const isWalletConnected = wallet?.isConnected || false

  // Get SDK and actions from window
  const sdk = (window as any).farcaster?.sdk || 
              (window as any).__FARCASTER__?.sdk ||
              (window as any).__MINIAPP__?.sdk || null
  
  const actions = sdk?.actions || null
  const notifications = (window as any).farcaster?.notifications || null
  const share = (window as any).farcaster?.share || null

  // Enhanced open URL function
  const openUrl = (url: string) => {
    if (share?.openUrl) {
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
      if (notifications?.create) {
        await notifications.create(notification)
      } else if (actions?.createNotification) {
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
  const refreshContext = () => {
    if (typeof window !== 'undefined' && (window as any).farcaster) {
      window.location.reload()
    }
  }

  // Request notification permission
  React.useEffect(() => {
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
    user: user ? {
      fid: user.fid,
      username: user.username,
      displayName: user.displayName,
      pfpUrl: user.pfpUrl
    } : null,
    frameContext,
    
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
    
    // Enhanced wallet features
    walletState,
    sendTransaction,
    requestConnection,
    onWalletEvent,
    
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
"use client"

import { useState, useEffect, useRef, SetStateAction } from "react"
import { enhancedWalletManager, type WalletConnectionState, type TransactionRequest, type TransactionResult } from "@/lib/enhanced-wallet-manager"

interface FrameContext {
  user?: {
    fid: number
    username: string
    displayName: string
    pfpUrl?: string
  }
  wallet?: {
    address: string
    chainId: string
  }
  client?: {
    platform: string
    version: string
  }
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

interface UseFarcasterFrameReturn {
  isFrame: boolean
  frameContext: FrameContext | null
  wallet: FrameWallet | null
  isLoading: boolean
  error: string | null
  retryDetection: () => void
  
  // Enhanced features
  walletState: WalletConnectionState | null
  sendTransaction: (tx: TransactionRequest) => Promise<TransactionResult>
  requestConnection: () => Promise<void>
  onWalletEvent: (event: string, callback: Function) => () => void
}

// Hook to initialize Frame SDK and call sdk.actions.ready()
function useFrameSDK() {
  const [isSDKReady, setIsSDKReady] = useState(false)

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        if (typeof window !== 'undefined') {
          // Look for SDK in multiple locations
          const farcaster = (window as any).farcaster || 
                           (window as any).__FARCASTER__ ||
                           (window as any).__MINIAPP__
          
          if (!farcaster?.sdk) {
            console.log("ℹ️ SDK not found, waiting for injection...")
            return
          }
          
          // Check if ready() method exists
          if (!farcaster.sdk.actions?.ready) {
            console.log("ℹ️ SDK ready() not found")
            return
          }

          // Try calling ready() with timeout
          let attempts = 0
          const maxAttempts = 30 // 3 seconds max
          
          const checkSDK = async () => {
            attempts++
            try {
              // Call sdk.actions.ready() to indicate the app is ready
              const result = await farcaster.sdk.actions.ready()
              setIsSDKReady(true)
              console.log("✅ Frame SDK ready() called successfully")
              return true
            } catch (readyErr) {
              if (attempts < maxAttempts) {
                // Retry on error
                await new Promise(resolve => setTimeout(resolve, 100))
                return checkSDK()
              } else {
                console.warn("⚠️ SDK ready() failed after max attempts:", readyErr)
                return false
              }
            }
          }
          
          await checkSDK()
        }
      } catch (err) {
        console.warn("⚠️ SDK initialization error:", err)
      }
    }

    // Initialize SDK when component mounts
    initializeSDK()
  }, [])

  return isSDKReady
}

// Immediately call sdk.actions.ready() when SDK is detected (for Mini App compatibility)
function useImmediateSDKReady() {
  useEffect(() => {
    const initializeImmediateSDK = async () => {
      if (typeof window !== 'undefined') {
        // Look in multiple locations
        const farcaster = (window as any).farcaster || 
                         (window as any).__FARCASTER__ ||
                         (window as any).__MINIAPP__
        
        if (farcaster?.sdk?.actions?.ready) {
          try {
            console.log("🚀 Calling SDK ready() immediately for Mini App")
            await farcaster.sdk.actions.ready()
            console.log("✅ SDK ready() called immediately")
          } catch (err) {
            console.warn("⚠️ Immediate SDK ready() call error:", err)
          }
        }
      }
    }

    // Try immediately and also after short delays to catch late-loading SDKs
    initializeImmediateSDK()
    
    const timeouts = [
      setTimeout(initializeImmediateSDK, 100),
      setTimeout(initializeImmediateSDK, 300),
      setTimeout(initializeImmediateSDK, 500)
    ]
    
    return () => {
      timeouts.forEach(t => clearTimeout(t))
    }
  }, [])
}

export function useFarcasterFrame(): UseFarcasterFrameReturn {
  const [isFrame, setIsFrame] = useState(false)
  const [frameContext, setFrameContext] = useState<FrameContext | null>(null)
  const [wallet, setWallet] = useState<FrameWallet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [walletState, setWalletState] = useState<WalletConnectionState | null>(null)
  const detectionAttempts = useRef(0)
  const maxAttempts = 20

  // Initialize Frame SDK with immediate ready call
  useImmediateSDKReady()
  const isSDKReady = useFrameSDK()

  // Subscribe to wallet events from enhanced manager
  useEffect(() => {
    const unsubscribeConnected = enhancedWalletManager.on('walletConnected', (state: WalletConnectionState) => {
      console.log("🔗 Enhanced wallet connected:", state)
      setWalletState(state)
      if (state.isConnected && state.address) {
        setWallet({
          address: state.address,
          chainId: state.chainId || "8453",
          isConnected: state.isConnected,
          connect: async () => {},
          sendTransaction: async (tx) => {
            const result = await enhancedWalletManager.sendTransaction(tx)
            return result.hash
          }
        })
      }
    })

    const unsubscribeDisconnected = enhancedWalletManager.on('walletDisconnected', () => {
      console.log("🔌 Enhanced wallet disconnected")
      setWalletState(null)
      setWallet(null)
    })

    const unsubscribeError = enhancedWalletManager.on('walletError', (data: { error: SetStateAction<string | null> }) => {
      console.error("❌ Enhanced wallet error:", data)
      setError(data.error)
    })

    const unsubscribeBalance = enhancedWalletManager.on('balanceUpdated', (data: { balance: any }) => {
      console.log("💰 Balance updated:", data)
      setWalletState(prev => prev ? { ...prev, balance: data.balance, lastUpdated: Date.now() } : null)
    })

    return () => {
      unsubscribeConnected()
      unsubscribeDisconnected()
      unsubscribeError()
      unsubscribeBalance()
    }
  }, [])

  const detectFrame = async () => {
    try {
      setError(null)
      detectionAttempts.current++

      if (typeof window !== 'undefined') {
        // Get SDK from any location
        const farcaster = (window as any).farcaster || 
                         (window as any).__FARCASTER__ ||
                         (window as any).__MINIAPP__

        console.log(`🔍 Frame detection attempt ${detectionAttempts.current}:`, {
          hasFarcaster: !!farcaster,
          hasSDK: !!(farcaster?.sdk),
          hasContext: !!(farcaster?.sdk?.context),
          contextValue: farcaster?.sdk?.context,
          timestamp: Date.now()
        })

        // Check for SDK - this is what matters
        if (farcaster?.sdk) {
          console.log("✅ Farcaster SDK found")
          setIsFrame(true)
          
          // Get context from SDK (sdk.context is the official way)
          // Context might be available or might load async, so we check it
          const context = farcaster.sdk.context
          
          // Even if context is not immediately available, we're in a frame
          // because the SDK exists. Try to get what we can.
          if (context) {
            console.log("📋 SDK Context available:", {
              hasUser: !!context.user,
              hasLocation: !!context.location,
              hasClient: !!context.client,
              user: context.user,
              client: context.client
            })
            
            // Build frameContext from SDK context
            const builtContext: FrameContext = {
              user: context.user ? {
                fid: context.user.fid,
                username: context.user.username || '',
                displayName: context.user.displayName || '',
                pfpUrl: context.user.pfpUrl
              } : undefined,
              client: context.client
            }
            
            setFrameContext(builtContext)
          } else {
            console.log("⏳ SDK context not ready yet, will retry")
          }
          
          // Try to get wallet - this is available via SDK in Mini Apps
          if (farcaster.sdk.wallet) {
            console.log("💰 SDK wallet available:", farcaster.sdk.wallet)
            const sdkWallet = farcaster.sdk.wallet
            
            if (sdkWallet.address) {
              console.log("✅ Got wallet address from SDK:", sdkWallet.address)
              setWallet({
                address: sdkWallet.address,
                chainId: sdkWallet.chainId || "8453",
                isConnected: true,
                connect: async () => {},
                sendTransaction: async (tx) => {
                  try {
                    const result = await enhancedWalletManager.sendTransaction(tx)
                    return result.hash
                  } catch (error) {
                    console.error("Transaction failed:", error)
                    throw error
                  }
                }
              })
              
              setWalletState({
                isConnected: true,
                address: sdkWallet.address,
                chainId: sdkWallet.chainId || "8453",
                balance: null,
                networkName: "Base",
                lastUpdated: Date.now()
              })
              
              console.log("✅ Wallet connected from SDK:", sdkWallet.address)
            }
          } else {
            console.log("ℹ️ SDK wallet not available, will check enhancedWalletManager")
          }
          
          // If context not ready yet, retry
          if (!context && detectionAttempts.current < maxAttempts) {
            console.log(`⏳ Waiting for SDK context, attempt ${detectionAttempts.current}/${maxAttempts}`)
            await new Promise(resolve => setTimeout(resolve, 300))
            return detectFrame()
          }
        } else if (detectionAttempts.current < maxAttempts) {
          // SDK not ready yet, retry
          console.log(`⏳ SDK not ready, attempt ${detectionAttempts.current}/${maxAttempts}`)
          await new Promise(resolve => setTimeout(resolve, 300))
          return detectFrame()
        } else {
          // Max attempts reached
          setIsFrame(false)
          console.log("🌐 Not in Frame context after max attempts, running as web app")
        }
      }
    } catch (err) {
      console.error("❌ Frame detection error:", err)
      setError(`Frame detection failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const retryDetection = () => {
    console.log("🔄 Retrying frame detection...")
    setIsLoading(true)
    setError(null)
    detectionAttempts.current = 0
    detectFrame()
  }

  useEffect(() => {
    detectFrame()
  }, [])

  return {
    isFrame,
    frameContext,
    wallet,
    isLoading,
    error,
    retryDetection,
    
    // Enhanced features
    walletState,
    sendTransaction: (tx: TransactionRequest) => enhancedWalletManager.sendTransaction(tx),
    requestConnection: () => enhancedWalletManager.requestConnection(),
    onWalletEvent: (event: string, callback: Function) => enhancedWalletManager.on(event, callback)
  }
}
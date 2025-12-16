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
  const maxAttempts = 15

  // Initialize Frame SDK with immediate ready call
  useImmediateSDKReady()
  const isSDKReady = useFrameSDK()

  // Subscribe to wallet events from enhanced manager
  useEffect(() => {
    const unsubscribeConnected = enhancedWalletManager.on('walletConnected', (state: WalletConnectionState) => {
      console.log("🔗 Enhanced wallet connected:", state)
      setWalletState(state)
      // Convert to FrameWallet format for compatibility
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
      // Reset error state
      setError(null)
      detectionAttempts.current++

      // Check if we're in a Farcaster Frame/Mini App environment
      if (typeof window !== 'undefined') {
        // Try multiple locations where SDK might be injected
        const farcaster = (window as any).farcaster || 
                         (window as any).__FARCASTER__ ||
                         (window as any).__MINIAPP__
        
        console.log(`🔍 Frame detection attempt ${detectionAttempts.current}:`, {
          hasFarcaster: !!farcaster,
          hasSDK: !!(farcaster?.sdk),
          hasFrameContext: !!(farcaster?.frameContext),
          hasContext: !!(farcaster?.sdk?.context),
          timestamp: Date.now()
        })

        // Detection improved: check for SDK, not just Farcaster object
        if (farcaster && (farcaster.sdk || farcaster.frameContext)) {
          setIsFrame(true)
          console.log("✅ Frame/Mini App detected")
          
          // Get frame context from multiple possible locations
          const context = farcaster.frameContext || farcaster.sdk?.context || null
          if (context) {
            console.log("📋 Frame context found:", {
              user: !!context.user,
              wallet: !!context.wallet,
              client: !!context.client
            })
            setFrameContext(context)
          }
          
          // Detect wallet - try SDK wallet first (most reliable in Mini App)
          let detectedWallet = null
          
          // Priority 1: Direct SDK wallet
          if (farcaster.sdk?.wallet?.address) {
            detectedWallet = farcaster.sdk.wallet
            console.log("💰 Wallet found at: sdk.wallet")
          }
          // Priority 2: SDK context wallet
          else if (farcaster.sdk?.context?.wallet?.address) {
            detectedWallet = farcaster.sdk.context.wallet
            console.log("💰 Wallet found at: sdk.context.wallet")
          }
          // Priority 3: Frame context wallet
          else if (context?.wallet?.address) {
            detectedWallet = context.wallet
            console.log("💰 Wallet found at: frameContext.wallet")
          }
          
          if (detectedWallet && detectedWallet.address) {
            setWallet({
              address: detectedWallet.address,
              chainId: detectedWallet.chainId || "8453",
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
              address: detectedWallet.address,
              chainId: detectedWallet.chainId || "8453",
              balance: null,
              networkName: "Base",
              lastUpdated: Date.now()
            })
          } else {
            console.log("⚠️ No wallet address found in frame context")
          }
          
        } else if (detectionAttempts.current < maxAttempts) {
          // SDK not ready yet, retry after a delay
          console.log(`⏳ Frame SDK not ready yet, attempt ${detectionAttempts.current}/${maxAttempts}`)
          await new Promise(resolve => setTimeout(resolve, 300))
          return detectFrame() // Recursive retry
        } else {
          // Max attempts reached and no Frame detected
          setIsFrame(false)
          console.log("🌐 Not in Frame context, running as standalone web app")
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
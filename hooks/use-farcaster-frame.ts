"use client"

import { useState, useEffect, useRef } from "react"

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
}

// Hook to initialize Frame SDK and call sdk.actions.ready()
function useFrameSDK() {
  const [isSDKReady, setIsSDKReady] = useState(false)

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).farcaster?.sdk) {
          // Wait for the SDK to be fully loaded
          await new Promise((resolve, reject) => {
            const checkSDK = () => {
              if ((window as any).farcaster?.sdk?.actions?.ready) {
                resolve(true)
              } else {
                setTimeout(checkSDK, 100)
              }
            }
            // Timeout after 10 seconds
            setTimeout(() => reject(new Error("SDK initialization timeout")), 10000)
            checkSDK()
          })

          // Call sdk.actions.ready() to indicate the app is ready
          if ((window as any).farcaster?.sdk?.actions?.ready) {
            await (window as any).farcaster.sdk.actions.ready()
            setIsSDKReady(true)
            console.log("Frame SDK initialized successfully")
          }
        }
      } catch (err) {
        console.warn("SDK initialization warning:", err)
        // Don't throw error, just continue without SDK
      }
    }

    // Initialize SDK when component mounts
    initializeSDK()
  }, [])

  return isSDKReady
}

export function useFarcasterFrame(): UseFarcasterFrameReturn {
  const [isFrame, setIsFrame] = useState(false)
  const [frameContext, setFrameContext] = useState<FrameContext | null>(null)
  const [wallet, setWallet] = useState<FrameWallet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const detectionAttempts = useRef(0)
  const maxAttempts = 10

  // Initialize Frame SDK
  const isSDKReady = useFrameSDK()

  const detectFrame = async () => {
    try {
      // Reset error state
      setError(null)
      detectionAttempts.current++

      // Check if we're in a Farcaster Frame environment
      if (typeof window !== 'undefined') {
        const farcaster = (window as any).farcaster
        
        console.log(`Frame detection attempt ${detectionAttempts.current}:`, {
          hasFarcaster: !!farcaster,
          hasFrameContext: !!farcaster?.frameContext,
          hasWallet: !!farcaster?.wallet,
          hasSDK: !!farcaster?.sdk,
          walletInSDK: !!farcaster?.sdk?.wallet,
          walletInContext: !!farcaster?.frameContext?.wallet
        })

        // Check for Frame context or wallet - try multiple paths
        const frameContext = farcaster?.frameContext
        const wallet = farcaster?.wallet || farcaster?.sdk?.wallet || farcaster?.frameContext?.wallet
        
        if (frameContext || wallet || farcaster?.sdk) {
          setIsFrame(true)
          
          // Get frame context if available
          if (frameContext) {
            setFrameContext(frameContext)
          }
          
          // Set up wallet if available
          if (wallet) {
            const frameWallet: FrameWallet = {
              address: wallet.address || "",
              chainId: wallet.chainId || "8453", // Base network
              isConnected: !!wallet.address,
              // FarCaster wallets are auto-connected, no manual connect needed
              connect: async () => {
                // Refresh wallet state to get latest connection status
                if (wallet?.address) {
                  setWallet(prev => prev ? {
                    ...prev,
                    address: wallet.address || prev.address,
                    isConnected: !!wallet.address
                  } : {
                    address: wallet.address,
                    chainId: wallet.chainId || "8453",
                    isConnected: true,
                    connect: async () => {},
                    sendTransaction: async () => { throw new Error("Transaction not supported") }
                  })
                }
              },
              sendTransaction: async (tx) => {
                try {
                  // Use FarCaster SDK actions for transaction
                  if ((window as any).farcaster?.sdk?.actions?.transaction) {
                    const result = await (window as any).farcaster.sdk.actions.transaction(tx)
                    return result?.hash || result
                  } else if (wallet.sendTransaction) {
                    // Fallback to wallet.sendTransaction if available
                    const result = await wallet.sendTransaction(tx)
                    return result?.hash || result
                  }
                  throw new Error("No transaction method available")
                } catch (err) {
                  console.error("Transaction failed:", err)
                  throw err
                }
              }
            }
            setWallet(frameWallet)
            console.log("Wallet detected and initialized:", frameWallet)
          } else if (detectionAttempts.current < maxAttempts) {
            // Wallet not detected yet, but we're in Frame environment
            // Schedule another detection attempt
            console.log("Wallet not detected yet, retrying in 500ms...")
            setTimeout(detectFrame, 500)
            return
          }
        } else {
          // Not in Frame context, might be standalone web app
          setIsFrame(false)
          console.log("Not in Frame context, running as standalone web app")
        }
      }
    } catch (err) {
      console.error("Frame detection error:", err)
      setError("Failed to detect Frame context")
    } finally {
      setIsLoading(false)
    }
  }

  const retryDetection = () => {
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
    retryDetection
  }
}
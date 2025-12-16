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
            console.log("✅ Frame SDK initialized successfully")
          }
        }
      } catch (err) {
        console.warn("⚠️ SDK initialization warning:", err)
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
        
        console.log(`🔍 Frame detection attempt ${detectionAttempts.current}:`, {
          hasFarcaster: !!farcaster,
          hasFrameContext: !!farcaster?.frameContext,
          hasWallet: !!farcaster?.wallet,
          hasSDK: !!farcaster?.sdk,
          walletInSDK: !!farcaster?.sdk?.wallet,
          walletInContext: !!farcaster?.frameContext?.wallet
        })

        // Check for Frame context or wallet - try multiple paths
        const frameContext = farcaster?.frameContext
        
        // Enhanced wallet detection with multiple fallback paths
        let wallet = null
        
        // Path 1: Direct wallet object
        if (farcaster?.wallet?.address) {
          wallet = farcaster.wallet
          console.log("💰 Wallet found via direct path")
        }
        // Path 2: SDK wallet
        else if (farcaster?.sdk?.wallet?.address) {
          wallet = farcaster.sdk.wallet
          console.log("💰 Wallet found via SDK path")
        }
        // Path 3: Frame context wallet
        else if (farcaster?.frameContext?.wallet?.address) {
          wallet = farcaster.frameContext.wallet
          console.log("💰 Wallet found via frameContext path")
        }
        // Path 4: SDK context wallet
        else if (farcaster?.sdk?.context?.wallet?.address) {
          wallet = farcaster.sdk.context.wallet
          console.log("💰 Wallet found via SDK context path")
        }
        
        // If we have any Farcaster object, consider it a Frame environment
        if (farcaster && (frameContext || wallet || farcaster?.sdk)) {
          setIsFrame(true)
          
          // Get frame context if available
          if (frameContext) {
            setFrameContext(frameContext)
          }
          
          // Set up wallet if available
          if (wallet && wallet.address) {
            const frameWallet: FrameWallet = {
              address: wallet.address || "",
              chainId: wallet.chainId || "8453", // Base network
              isConnected: !!wallet.address,
              // FarCaster wallets are auto-connected, no manual connect needed
              connect: async () => {
                console.log("🔗 Wallet connect called - refreshing wallet state")
                // Try to get fresh wallet state
                const farcaster = (window as any).farcaster
                const freshWallet = farcaster?.wallet || farcaster?.sdk?.wallet || farcaster?.frameContext?.wallet
                
                if (freshWallet?.address) {
                  setWallet(prev => prev ? {
                    ...prev,
                    address: freshWallet.address || prev.address,
                    isConnected: !!freshWallet.address
                  } : {
                    address: freshWallet.address,
                    chainId: freshWallet.chainId || "8453",
                    isConnected: true,
                    connect: async () => {},
                    sendTransaction: async () => { throw new Error("Transaction not supported") }
                  })
                  console.log("✅ Wallet state refreshed")
                } else {
                  console.log("❌ No wallet address found on refresh")
                }
              },
              sendTransaction: async (tx) => {
                try {
                  console.log("💳 Attempting transaction:", tx)
                  
                  // Method 1: Direct SDK transaction (most reliable)
                  if ((window as any).farcaster?.sdk?.actions?.transaction) {
                    console.log("📤 Using SDK transaction method")
                    const result = await (window as any).farcaster.sdk.actions.transaction(tx)
                    console.log("✅ SDK transaction result:", result)
                    return result?.hash || result
                  }
                  
                  // Method 2: Direct wallet transaction
                  else if (wallet.sendTransaction) {
                    console.log("📤 Using direct wallet transaction")
                    const result = await wallet.sendTransaction(tx)
                    console.log("✅ Direct wallet result:", result)
                    return result?.hash || result
                  }
                  
                  // Method 3: Alternative SDK methods
                  else if ((window as any).farcaster?.sdk?.actions?.sendTransaction) {
                    console.log("📤 Using alternative SDK transaction")
                    const result = await (window as any).farcaster.sdk.actions.sendTransaction(tx)
                    console.log("✅ Alternative SDK result:", result)
                    return result?.hash || result
                  }
                  
                  throw new Error("No transaction method available in FarCaster SDK")
                } catch (err) {
                  console.error("❌ Transaction failed:", err)
                  throw new Error(`Transaction failed: ${err instanceof Error ? err.message : "Unknown error"}`)
                }
              }
            }
            setWallet(frameWallet)
            console.log("✅ Wallet detected and initialized:", frameWallet)
          } else if (detectionAttempts.current < maxAttempts) {
            // Wallet not detected yet, but we're in Frame environment
            // Schedule another detection attempt with shorter intervals
            const delay = Math.min(500 * detectionAttempts.current, 2000)
            console.log(`🔄 Wallet not detected yet, retrying in ${delay}ms...`)
            setTimeout(detectFrame, delay)
            return
          } else {
            // Max attempts reached, create a minimal wallet interface
            console.log("⚠️ Max attempts reached, creating minimal wallet interface")
            const sdkWallet: FrameWallet = {
              address: "",
              chainId: "8453",
              isConnected: false,
              connect: async () => {
                console.log("🔗 Attempting SDK wallet connection")
                // Try to request wallet connection through SDK
                if ((window as any).farcaster?.sdk?.actions?.requestWallet) {
                  await (window as any).farcaster.sdk.actions.requestWallet()
                  console.log("✅ Wallet connection requested")
                } else {
                  console.log("❌ No wallet connection method available")
                  throw new Error("No wallet connection method available")
                }
              },
              sendTransaction: async (tx) => {
                console.log("💳 Attempting SDK transaction")
                // Use FarCaster SDK actions for transaction
                if ((window as any).farcaster?.sdk?.actions?.transaction) {
                  const result = await (window as any).farcaster.sdk.actions.transaction(tx)
                  return result?.hash || result
                }
                throw new Error("SDK transaction not available")
              }
            }
            setWallet(sdkWallet)
            console.log("🔧 SDK-only wallet created (no direct wallet access)")
          }
        } else {
          // Not in Frame context, might be standalone web app
          setIsFrame(false)
          console.log("🌐 Not in Frame context, running as standalone web app")
        }
      }
    } catch (err) {
      console.error("❌ Frame detection error:", err)
      setError(`Failed to detect Frame context: ${err instanceof Error ? err.message : "Unknown error"}`)
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
    retryDetection
  }
}
"use client"

import { useState, useEffect } from "react"

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
}

// Hook to initialize Frame SDK and call sdk.actions.ready()
function useFrameSDK() {
  const [isSDKReady, setIsSDKReady] = useState(false)

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).farcaster?.sdk) {
          // Wait for the SDK to be fully loaded
          await new Promise((resolve) => {
            const checkSDK = () => {
              if ((window as any).farcaster?.sdk?.actions?.ready) {
                resolve(true)
              } else {
                setTimeout(checkSDK, 100)
              }
            }
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
        console.error("Failed to initialize Frame SDK:", err)
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

  // Initialize Frame SDK
  const isSDKReady = useFrameSDK()

  useEffect(() => {
    const detectFrame = async () => {
      try {
        // Check if we're in a Farcaster Frame environment
        if (typeof window !== 'undefined') {
          // Check for Frame context
          const frameContext = (window as any).farcaster?.frameContext
          const wallet = (window as any).farcaster?.wallet
          
          if (frameContext || wallet) {
            setIsFrame(true)
            
            // Get frame context if available
            if (frameContext) {
              setFrameContext(frameContext)
            }
            
            // Set up wallet
            if (wallet) {
              const frameWallet: FrameWallet = {
                address: wallet.address || "",
                chainId: wallet.chainId || "8453", // Base network
                isConnected: !!wallet.address,
                connect: async () => {
                  if (wallet.connect) {
                    await wallet.connect()
                    setWallet(prev => prev ? {
                      ...prev,
                      address: wallet.address || prev.address,
                      isConnected: !!wallet.address
                    } : null)
                  }
                },
                sendTransaction: async (tx) => {
                  if (wallet.sendTransaction) {
                    return await wallet.sendTransaction(tx)
                  }
                  throw new Error("Wallet transaction not supported")
                }
              }
              setWallet(frameWallet)
            }
          } else {
            // Not in Frame context, might be standalone web app
            setIsFrame(false)
          }
        }
      } catch (err) {
        console.error("Frame detection error:", err)
        setError("Failed to detect Frame context")
      } finally {
        setIsLoading(false)
      }
    }

    detectFrame()
  }, [])

  return {
    isFrame,
    frameContext,
    wallet,
    isLoading,
    error
  }
}
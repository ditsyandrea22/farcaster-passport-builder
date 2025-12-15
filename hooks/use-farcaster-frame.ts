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

export function useFarcasterFrame(): UseFarcasterFrameReturn {
  const [isFrame, setIsFrame] = useState(false)
  const [frameContext, setFrameContext] = useState<FrameContext | null>(null)
  const [wallet, setWallet] = useState<FrameWallet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
"use client"

import { useState, useEffect, useRef } from "react"

/**
 * Simplified frame detection for Farcaster Mini Apps
 * Only checks for Farcaster SDK - doesn't try to manipulate window
 * This avoids conflicts with wallet extensions and respects read-only properties
 */
export function useFrameSimple() {
  const [isFrame, setIsFrame] = useState(false)
  const [context, setContext] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const attemptCount = useRef(0)
  const maxAttempts = 50 // Try for up to 25 seconds

  useEffect(() => {
    let isMounted = true

    const detectFrame = async () => {
      attemptCount.current++

      try {
        // Only check for SDK - don't try to set anything
        if (typeof window === 'undefined') {
          setIsLoading(false)
          return
        }

        // Check all possible SDK locations (read-only, no assignments)
        const sdk = (window as any).farcaster?.sdk ||
                   (window as any).__FARCASTER__?.sdk ||
                   (window as any).__MINIAPP__?.sdk

        console.log(`[Frame Detect ${attemptCount.current}/${maxAttempts}] SDK found:`, !!sdk)

        if (sdk) {
          console.log("✅ Farcaster SDK detected")
          
          // We're in a frame if SDK exists
          if (isMounted) {
            setIsFrame(true)
          }

          // Try to read context (non-destructively)
          const ctx = sdk.context
          if (ctx) {
            console.log("📋 SDK context available:", {
              user: !!ctx.user,
              client: !!ctx.client,
              location: !!ctx.location
            })
            if (isMounted) {
              setContext(ctx)
            }
          }

          // Try to read wallet (non-destructively)
          const sdkWallet = sdk.wallet
          if (sdkWallet?.address) {
            console.log("💰 Wallet available:", sdkWallet.address)
            if (isMounted) {
              setWallet(sdkWallet)
            }
          }

          // Successfully detected frame
          if (isMounted) {
            setIsLoading(false)
          }
          return
        }

        // SDK not ready yet
        if (attemptCount.current >= maxAttempts) {
          console.log("⚠️ SDK not found after max attempts - assuming standalone")
          if (isMounted) {
            setIsFrame(false)
            setIsLoading(false)
          }
        } else {
          // Retry with increasing delay
          const delay = Math.min(500 * attemptCount.current, 5000)
          await new Promise(r => setTimeout(r, 500))
          return detectFrame()
        }
      } catch (err) {
        console.error("❌ Frame detection error:", err)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    detectFrame()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    isFrame,
    context,
    wallet,
    isLoading,
    sdk: (window as any).farcaster?.sdk || (window as any).__FARCASTER__?.sdk || (window as any).__MINIAPP__?.sdk
  }
}

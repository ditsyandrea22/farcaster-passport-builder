"use client"

import { useEffect, useRef } from "react"

/**
 * MiniAppInitializer Component
 * 
 * CRITICAL: Ensures sdk.actions.ready() is called
 * According to Farcaster: "If you don't call ready(), users will see an infinite loading screen"
 * 
 * This component provides a React-level backup to ensure ready() is definitely called
 */

export function MiniAppInitializer() {
  const readyAttempted = useRef(false)
  const readySuccessful = useRef(false)

  useEffect(() => {
    // Don't retry if already successful
    if (readySuccessful.current) {
      console.log("✅ ready() already called successfully")
      return
    }

    if (readyAttempted.current) {
      console.log("ℹ️ Skipping - already attempted in this session")
      return
    }

    readyAttempted.current = true

    const callReady = async () => {
      try {
        // Check if already called
        if ((window as any).__sdk_ready_called__) {
          console.log("✅ ready() already called by global script")
          readySuccessful.current = true
          return
        }

        // Try to find SDK in multiple locations
        let sdk = null
        
        if ((window as any).farcaster?.sdk) {
          sdk = (window as any).farcaster.sdk
          console.log("🔍 Found SDK at: farcaster.sdk")
        } else if ((window as any).__FARCASTER__?.sdk) {
          sdk = (window as any).__FARCASTER__.sdk
          console.log("🔍 Found SDK at: __FARCASTER__.sdk")
        } else if ((window as any).__MINIAPP__?.sdk) {
          sdk = (window as any).__MINIAPP__.sdk
          console.log("🔍 Found SDK at: __MINIAPP__.sdk")
        }

        if (!sdk) {
          console.log("ℹ️ SDK not available in React component")
          return
        }

        if (!sdk.actions?.ready) {
          console.log("ℹ️ SDK found but ready() method not available")
          return
        }

        // CALL READY - CRITICAL!
        console.log("🚀 [React] Calling sdk.actions.ready() NOW!")
        
        try {
          const result = await sdk.actions.ready()
          console.log("✅ [React] sdk.actions.ready() succeeded")
          ;(window as any).__sdk_ready_called__ = true
          ;(window as any).__miniapp_ready__ = true
          readySuccessful.current = true
        } catch (error) {
          console.warn("⚠️ [React] sdk.actions.ready() error:", error)
          // Even if ready() fails, set the flag so we don't keep trying
          ;(window as any).__sdk_ready_called__ = true
          readySuccessful.current = true
        }
      } catch (error) {
        console.warn("⚠️ [React] Error in MiniAppInitializer:", error)
      }
    }

    // Call immediately on mount
    callReady()

    // Also try after tiny delays in case SDK is still being injected
    const timeouts = [
      setTimeout(callReady, 50),
      setTimeout(callReady, 100),
      setTimeout(callReady, 200),
      setTimeout(callReady, 500),
    ]

    return () => {
      timeouts.forEach(t => clearTimeout(t))
    }
  }, [])

  // This component doesn't render anything

  // This component doesn't render anything
  return null
}

"use client"

import { useEffect, useRef } from "react"

/**
 * MiniAppInitializer Component
 * 
 * Calls sdk.actions.ready() as early as possible to hide the splash screen.
 * 
 * IMPORTANT: According to Farcaster Mini App docs:
 * "If you don't call ready(), users will see an infinite loading screen.
 * This is one of the most common issues when building Mini Apps."
 * 
 * Solution: Call ready() immediately when the component mounts,
 * don't wait for full app initialization.
 */

export function MiniAppInitializer() {
  const readyAttempted = useRef(false)

  useEffect(() => {
    // Prevent multiple calls
    if (readyAttempted.current) return
    readyAttempted.current = true

    const callReady = async () => {
      try {
        // Check if we're in a Mini App environment by looking for SDK
        const sdk = (window as any).farcaster?.sdk
        
        if (!sdk) {
          console.log("ℹ️ Not in Mini App environment, SDK not found")
          return
        }

        if (!sdk.actions?.ready) {
          console.log("ℹ️ SDK found but ready() not available")
          return
        }

        // CRITICAL: Call ready() immediately to dismiss splash screen
        // This should happen as soon as the app mounts, before loading data
        console.log("🚀 Calling sdk.actions.ready() to dismiss splash screen...")
        
        try {
          await sdk.actions.ready()
          console.log("✅ sdk.actions.ready() succeeded - splash screen dismissed")
          ;(window as any).__miniapp_ready__ = true
        } catch (error) {
          // Even if ready() fails, the app should still function
          console.warn("⚠️ sdk.actions.ready() error (app will still function):", error)
        }
      } catch (error) {
        console.warn("⚠️ MiniAppInitializer error:", error)
      }
    }

    // Call immediately on mount - don't wait for anything
    callReady()

    // Also try after a tiny delay in case SDK is being injected
    const timeouts = [
      setTimeout(callReady, 50),
      setTimeout(callReady, 100),
      setTimeout(callReady, 200),
    ]

    return () => {
      timeouts.forEach(t => clearTimeout(t))
    }
  }, [])

  // Component doesn't render anything

  // This component doesn't render anything
  return null
}

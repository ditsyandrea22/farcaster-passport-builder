"use client"

import { useEffect, useRef } from "react"

/**
 * MiniAppInitializer Component
 * 
 * Initializes the Farcaster Mini App SDK and calls sdk.actions.ready()
 * This component must be mounted in the layout to properly signal to Farcaster
 * that the app has loaded and is ready to display.
 * 
 * Key Features:
 * - Detects if running in Mini App environment
 * - Calls sdk.actions.ready() when app is fully loaded
 * - Handles SDK initialization with proper error handling
 * - Prevents infinite loading screen (common issue)
 */

export function MiniAppInitializer() {
  const initializationAttempted = useRef(false)

  useEffect(() => {
    if (initializationAttempted.current) return
    initializationAttempted.current = true

    const initializeMiniApp = async () => {
      try {
        // Check if we're in a Mini App environment
        if (typeof window === "undefined") return

        // Wait for SDK to be available - it's injected by Farcaster clients
        let attempts = 0
        const maxAttempts = 50 // 5 seconds total
        
        const waitForSDK = async (): Promise<any> => {
          attempts++
          
          // Check for SDK in multiple places where Farcaster might inject it
          const sdk = (window as any).farcaster?.sdk || 
                     (window as any).__FARCASTER_SDK__ ||
                     (window as any).__MINIAPP_SDK__

          if (sdk && sdk.actions && sdk.actions.ready) {
            return sdk
          }

          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100))
            return waitForSDK()
          }

          return null
        }

        const sdk = await waitForSDK()

        if (!sdk) {
          console.info("ℹ️ Not running in Farcaster Mini App environment (SDK not found)")
          return
        }

        // Call sdk.actions.ready() to hide the splash screen
        try {
          await sdk.actions.ready()
          console.log("✅ Mini App initialized: sdk.actions.ready() called successfully")
          
          // Log that we've successfully initialized
          if (typeof window !== "undefined") {
            (window as any).__miniapp_ready__ = true
          }
        } catch (error) {
          console.warn("⚠️ sdk.actions.ready() failed (this is OK if not in Mini App):", error)
        }
      } catch (error) {
        console.warn("⚠️ Mini App initialization error:", error)
        // Don't throw - graceful degradation for non-Mini App environments
      }
    }

    // Initialize as soon as possible, but after minimal delay for SDK injection
    initializeMiniApp()
  }, [])

  // This component doesn't render anything
  return null
}

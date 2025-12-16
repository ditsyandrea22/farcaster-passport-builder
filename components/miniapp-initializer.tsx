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

        console.log("🔍 MiniAppInitializer starting...")

        // Try to call ready immediately first (SDK might be already injected)
        const tryCallReady = async () => {
          const sdk = (window as any).farcaster?.sdk || 
                     (window as any).__FARCASTER_SDK__ ||
                     (window as any).__MINIAPP_SDK__ ||
                     ((window as any).parent?.farcaster?.sdk)

          if (sdk?.actions?.ready) {
            try {
              console.log("📞 Calling sdk.actions.ready()...")
              const result = await sdk.actions.ready()
              console.log("✅ Mini App initialized: sdk.actions.ready() called successfully")
              ;(window as any).__miniapp_ready__ = true
              return true
            } catch (error) {
              console.warn("⚠️ sdk.actions.ready() rejected:", error)
              return false
            }
          }
          return false
        }

        // Try immediately
        console.log("⏱️ Trying immediate SDK detection...")
        if (await tryCallReady()) {
          console.log("✅ SDK ready called immediately")
          return
        }

        // Wait for SDK to be injected - it's injected by Farcaster clients
        let attempts = 0
        const maxAttempts = 150 // 15 seconds total
        
        while (attempts < maxAttempts) {
          attempts++
          await new Promise(resolve => setTimeout(resolve, 100))
          
          if (attempts % 10 === 0) {
            console.log(`🔄 Still waiting for SDK (${attempts * 100}ms)...`)
          }
          
          if (await tryCallReady()) {
            console.log(`✅ SDK ready called after ${attempts * 100}ms`)
            return
          }
        }

        console.info("ℹ️ Not running in Farcaster Mini App environment (SDK not found after 15s)")
        // Don't block - the app should still work in regular browser
      } catch (error) {
        console.warn("⚠️ Mini App initialization error:", error)
        // Don't throw - graceful degradation for non-Mini App environments
      }
    }

    // Initialize as soon as possible
    initializeMiniApp()
  }, [])

  // This component doesn't render anything
  return null
}

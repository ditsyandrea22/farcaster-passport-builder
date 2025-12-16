"use client"

import { useEffect, useRef } from "react"

/**
 * MiniAppInitializer Component
 * 
 * Initializes the Farcaster Mini App SDK and calls sdk.actions.ready()
 * The main SDK initialization happens in /public/sdk-ready.js
 * This component provides a React-level fallback and confirmation
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

        console.log("🔍 MiniAppInitializer: Checking for SDK...")

        // Check if already initialized by global script
        if ((window as any).__miniapp_ready__) {
          console.log("✅ Mini App already initialized by global script")
          return
        }

        // Try to call ready() as a React-level fallback
        const tryCallReady = async () => {
          const sdk = (window as any).farcaster?.sdk || 
                     (window as any).__FARCASTER_SDK__

          if (sdk?.actions?.ready) {
            try {
              console.log("📞 React-level: Calling sdk.actions.ready()...")
              const result = await sdk.actions.ready()
              console.log("✅ React-level: sdk.actions.ready() succeeded")
              ;(window as any).__miniapp_ready__ = true
              return true
            } catch (error) {
              console.warn("⚠️ React-level: sdk.actions.ready() error:", error)
              return false
            }
          }
          return false
        }

        // Wait up to 5 seconds for SDK if not found immediately
        let attempts = 0
        const maxAttempts = 50
        
        while (attempts < maxAttempts) {
          if (await tryCallReady()) {
            return
          }
          attempts++
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        console.info("ℹ️ MiniAppInitializer: SDK not found (app will run in web mode)")
      } catch (error) {
        console.warn("⚠️ MiniAppInitializer error:", error)
      }
    }

    initializeMiniApp()
  }, [])

  // This component doesn't render anything
  return null
}

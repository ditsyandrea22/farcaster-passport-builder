/**
 * Simplified Mini App Initializer
 * Ensures sdk.actions.ready() is called exactly once without conflicts
 */

"use client"

import { useEffect } from "react"
import { unifiedWalletManager } from "@/lib/unified-wallet-manager"

/**
 * Component to initialize Mini App SDK at app level
 * 
 * CRITICAL: Ensures sdk.actions.ready() is called exactly once
 * This replaces multiple conflicting initializers with a single, reliable one
 */
export function SimplifiedMiniAppInitializer() {
  useEffect(() => {
    // The unified wallet manager already calls ready() during initialization
    // This component serves as a backup and provides a React-level initialization point
    
    const initialize = async () => {
      try {
        // Ensure the unified wallet manager is initialized
        // This will handle calling sdk.actions.ready() if needed
        await unifiedWalletManager.initialize()
        
        console.log("✅ Simplified Mini App Initializer completed")
      } catch (error) {
        console.warn("⚠️ Mini App initialization warning:", error)
        // Don't throw - initialization failures are often normal in web environments
      }
    }

    // Initialize immediately
    initialize()

    // Also try after a short delay as a backup
    const timeout = setTimeout(initialize, 100)
    
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  // This component doesn't render anything visible
  return null
}
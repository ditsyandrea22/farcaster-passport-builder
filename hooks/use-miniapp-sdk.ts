"use client"

import { useEffect, useRef, useState } from "react"
import { isInMiniApp, getMiniAppContext, waitForSDK } from "@/lib/miniapp-utils"

interface UseMiniAppSDKReturn {
  isInMiniApp: boolean
  isReady: boolean
  context: any
  error: string | null
}

/**
 * Hook to properly initialize and track Mini App SDK
 * 
 * Usage:
 * ```tsx
 * const { isInMiniApp, isReady, context } = useMiniAppSDK()
 * 
 * if (isReady) {
 *   // App is ready for Mini App specific operations
 * }
 * ```
 */
export function useMiniAppSDK(): UseMiniAppSDKReturn {
  const [isInMiniAppEnv, setIsInMiniAppEnv] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [context, setContext] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const initializationAttempted = useRef(false)

  useEffect(() => {
    if (initializationAttempted.current) return
    initializationAttempted.current = true

    const initialize = async () => {
      try {
        // Check if in Mini App
        const inMiniApp = await isInMiniApp()
        setIsInMiniAppEnv(inMiniApp)

        if (inMiniApp) {
          // Get context if available
          const ctx = getMiniAppContext()
          if (ctx) {
            setContext(ctx)
          }

          // Wait for SDK and verify it's ready
          const sdk = await waitForSDK()
          if (sdk) {
            // Call ready if it exists and hasn't been called yet
            if (sdk.actions && sdk.actions.ready && !(window as any).__miniapp_ready__) {
              try {
                await sdk.actions.ready()
                ;(window as any).__miniapp_ready__ = true
              } catch (e) {
                console.warn("ready() already called or not available:", e)
              }
            }
            setIsReady(true)
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        setError(errorMsg)
        console.error("Mini App SDK initialization error:", err)
      }
    }

    initialize()
  }, [])

  return {
    isInMiniApp: isInMiniAppEnv,
    isReady,
    context,
    error
  }
}

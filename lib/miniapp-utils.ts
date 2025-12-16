/**
 * Mini App Detection and Utilities
 * 
 * These utilities help detect if the app is running in a Farcaster Mini App
 * environment and provide helpers for common Mini App operations.
 */

/**
 * Check if running in a Mini App environment
 * Uses multiple detection methods for reliability
 */
export async function isInMiniApp(): Promise<boolean> {
  if (typeof window === "undefined") return false

  // Check for iframe
  const isInIFrame = window.self !== window.top
  
  // Check for ReactNative WebView indicators
  const hasReactNativeIndicators = 
    (window as any).ReactNativeWebView !== undefined ||
    (navigator as any).userAgent?.includes("ReactNativeWebView")

  // If neither iframe nor ReactNative, definitely not a Mini App
  if (!isInIFrame && !hasReactNativeIndicators) {
    return false
  }

  // Try to detect context communication
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 100)
    
    try {
      // Check for SDK
      const sdk = (window as any).farcaster?.sdk || 
                  (window as any).__FARCASTER_SDK__

      if (sdk && sdk.context) {
        clearTimeout(timeout)
        resolve(true)
      }
    } catch (e) {
      // Silent fail
    }
  })
}

/**
 * Get the Mini App context if available
 */
export function getMiniAppContext(): any {
  if (typeof window === "undefined") return null

  const sdk = (window as any).farcaster?.sdk || 
              (window as any).__FARCASTER_SDK__

  return sdk?.context || null
}

/**
 * Detect if we're on a specific path or with a query param
 * This helps with hybrid deployments (web + Mini App on same domain)
 */
export function detectMiniAppHint(): boolean {
  if (typeof window === "undefined") return false

  try {
    const url = new URL(window.location.href)
    
    // Check for dedicated mini app path
    if (url.pathname.includes("/mini")) {
      return true
    }
    
    // Check for query param
    if (url.searchParams.get("miniApp") === "true") {
      return true
    }
    
    return false
  } catch (e) {
    return false
  }
}

/**
 * Wait for SDK to be available
 */
export async function waitForSDK(maxWaitMs = 5000): Promise<any> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < maxWaitMs) {
    const sdk = (window as any).farcaster?.sdk || 
                (window as any).__FARCASTER_SDK__

    if (sdk) {
      return sdk
    }

    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return null
}

/**
 * Get the Ethereum provider from Mini App SDK
 */
export async function getMiniAppEthereumProvider(): Promise<any> {
  const sdk = await waitForSDK()

  if (!sdk || !sdk.wallet || !sdk.wallet.getEthereumProvider) {
    return null
  }

  try {
    return sdk.wallet.getEthereumProvider()
  } catch (error) {
    console.error("Failed to get Ethereum provider:", error)
    return null
  }
}

/**
 * Sign in user using Mini App SDK
 */
export async function signInWithMiniApp(nonce: string): Promise<any> {
  const sdk = await waitForSDK()

  if (!sdk || !sdk.actions || !sdk.actions.signIn) {
    throw new Error("SDK signIn not available")
  }

  try {
    const result = await sdk.actions.signIn({
      nonce,
      acceptAuthAddress: true
    })

    return result
  } catch (error) {
    console.error("Mini App sign in failed:", error)
    throw error
  }
}

/**
 * Compose a cast using Mini App SDK
 */
export async function composeCastWithMiniApp(text?: string, embeds?: string[]): Promise<any> {
  const sdk = await waitForSDK()

  if (!sdk || !sdk.actions || !sdk.actions.composeCast) {
    throw new Error("SDK composeCast not available")
  }

  try {
    const result = await sdk.actions.composeCast({
      text,
      embeds
    })

    return result
  } catch (error) {
    console.error("Compose cast failed:", error)
    throw error
  }
}

/**
 * Open URL using Mini App SDK (with deep linking support on mobile)
 */
export async function openUrlWithMiniApp(url: string): Promise<void> {
  const sdk = await waitForSDK()

  if (!sdk || !sdk.actions || !sdk.actions.openUrl) {
    // Fallback to window.open
    window.open(url, "_blank")
    return
  }

  try {
    await sdk.actions.openUrl(url)
  } catch (error) {
    console.error("Open URL failed:", error)
    // Fallback to window.open
    window.open(url, "_blank")
  }
}

/**
 * Close the Mini App
 */
export async function closeMiniApp(): Promise<void> {
  const sdk = await waitForSDK()

  if (!sdk || !sdk.actions || !sdk.actions.close) {
    return
  }

  try {
    await sdk.actions.close()
  } catch (error) {
    console.error("Close failed:", error)
  }
}

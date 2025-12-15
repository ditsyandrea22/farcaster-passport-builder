/**
 * Farcaster Frame utilities and detection
 */

export interface FrameContext {
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

export interface FrameWallet {
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

/**
 * Detect if running in Farcaster Frame context
 */
export function isFarcasterFrame(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check for Frame context
  const frameContext = (window as any).farcaster?.frameContext
  const wallet = (window as any).farcaster?.wallet
  
  return !!(frameContext || wallet)
}

/**
 * Get Frame context if available
 */
export function getFrameContext(): FrameContext | null {
  if (typeof window === 'undefined') return null
  
  const frameContext = (window as any).farcaster?.frameContext
  return frameContext || null
}

/**
 * Get Frame wallet if available
 */
export function getFrameWallet(): FrameWallet | null {
  if (typeof window === 'undefined') return null
  
  const wallet = (window as any).farcaster?.wallet
  if (!wallet) return null
  
  return {
    address: wallet.address || "",
    chainId: wallet.chainId || "8453", // Base network
    isConnected: !!wallet.address,
    connect: async () => {
      if (wallet.connect) {
        await wallet.connect()
      }
    },
    sendTransaction: async (tx) => {
      if (wallet.sendTransaction) {
        return await wallet.sendTransaction(tx)
      }
      throw new Error("Wallet transaction not supported")
    }
  }
}

/**
 * Send transaction through Frame wallet
 */
export async function sendFrameTransaction(tx: {
  to: string
  data: string
  value?: string
}): Promise<string> {
  const wallet = getFrameWallet()
  if (!wallet || !wallet.isConnected) {
    throw new Error("Frame wallet not available or not connected")
  }
  
  return await wallet.sendTransaction(tx)
}

/**
 * Share content through Frame API
 */
export function shareToFrame(text: string, url?: string) {
  if (typeof window === 'undefined') return
  
  const farcaster = (window as any).farcaster
  if (farcaster?.share) {
    farcaster.share({
      text,
      url: url || window.location.href,
    })
  } else {
    // Fallback to warpcast compose
    const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text + ' ' + (url || window.location.href))}`
    window.open(shareUrl, '_blank')
  }
}

/**
 * Frame-specific user agent patterns
 */
export function getFrameHeaders(): Record<string, string> {
  return {
    'X-Frame-Client': 'farcaster-frame',
    'User-Agent': 'farcaster-frame'
  }
}
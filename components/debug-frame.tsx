"use client"

import { useEffect } from "react"
import { useFarcasterFrame } from "@/hooks/use-farcaster-frame"

// Debug component to help troubleshoot Frame initialization
export function DebugFrame() {
  const { isFrame, frameContext, wallet, isLoading, error } = useFarcasterFrame()

  useEffect(() => {
    console.log("🔍 Frame Debug Info:", {
      isFrame,
      hasFrameContext: !!frameContext,
      hasWallet: !!wallet,
      walletConnected: wallet?.isConnected,
      isLoading,
      error,
      sdkReady: !!(window as any).farcaster?.sdk?.actions?.ready,
    })
  }, [isFrame, frameContext, wallet, isLoading, error])

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 p-3 bg-black/80 text-white text-xs rounded-lg font-mono max-w-sm">
      <div className="space-y-1">
        <div>Frame: {isFrame ? '✅' : '❌'}</div>
        <div>SDK Ready: {(window as any).farcaster?.sdk?.actions?.ready ? '✅' : '❌'}</div>
        <div>Loading: {isLoading ? '⏳' : '✅'}</div>
        {error && <div className="text-red-400">Error: {error}</div>}
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useFrame } from "@/providers/frame-provider"
import { useNotifications } from "@/components/notification-system"
import { useAnalytics } from "@/components/analytics-tracker"
import { cn } from "@/lib/utils"

interface AutoCastSuccessProps {
  txHash: string
  fid: number
  score: number
  badge: string
  displayName: string
  totalTransactions: number
  mintResult?: any
  onClose?: () => void
}

export function AutoCastSuccess({
  txHash,
  fid,
  score,
  badge,
  displayName,
  totalTransactions,
  mintResult,
  onClose
}: AutoCastSuccessProps) {
  const [casting, setCasting] = useState(false)
  const [castResult, setCastResult] = useState<any>(null)
  const [autoCastAttempted, setAutoCastAttempted] = useState(false)
  
  const { isFrame, share, openUrl } = useFrame()
  const { success, error: showError } = useNotifications()
  const { trackShareCompleted } = useAnalytics()

  // Auto-cast after component mounts (for Frame context)
  useEffect(() => {
    if (isFrame && share && !autoCastAttempted) {
      setAutoCastAttempted(true)
      handleAutoCast()
    }
  }, [isFrame, share, autoCastAttempted])

  const generateCastText = () => {
    // Use API-provided share text if available, otherwise generate one
    const shareData = mintResult?.shareData
    if (shareData?.text) {
      // Replace placeholder TX with actual TX hash
      return shareData.text.replace('[pending]', `${txHash.slice(0, 10)}...${txHash.slice(-8)}`)
    }
    
    // Fallback to generated text
    const enhancedText = `🎉 Just minted my Farcaster Reputation Passport NFT!\n\n` +
      `📊 Score: ${score} ${badge}\n` +
      `🚀 Total Transactions: ${totalTransactions}\n` +
      `🔗 TX: ${txHash.slice(0, 10)}...${txHash.slice(-8)}\n\n` +
      `Generate your own reputation passport:`
    
    return enhancedText
  }

  const handleAutoCast = async () => {
    if (!isFrame || !share) return

    setCasting(true)
    try {
      const castText = generateCastText()
      
      const shareData = {
        text: castText,
        url: typeof window !== 'undefined' ? window.location.href : '',
        title: `${displayName}'s Reputation Passport NFT`,
        description: `Score: ${score} | Badge: ${badge} | TX: ${txHash.slice(0, 10)}...`
      }

      console.log("🎯 Auto-casting to Farcaster...", shareData)
      
      const result = await share(shareData)
      setCastResult({ success: true, result })
      
      success("🎉 Success!", "Your NFT mint has been cast to Farcaster.xyz")
      trackShareCompleted("farcaster", castText)
      
      console.log("✅ Auto-cast successful:", result)
      
    } catch (err) {
      console.error("❌ Auto-cast failed:", err)
      setCastResult({ success: false, error: err instanceof Error ? err.message : "Cast failed" })
      // Don't show error for auto-cast failure, as it's not critical
    } finally {
      setCasting(false)
    }
  }

  const handleManualCast = async () => {
    setCasting(true)
    try {
      const castText = generateCastText()
      
      if (isFrame && share) {
        const shareData = {
          text: castText,
          url: typeof window !== 'undefined' ? window.location.href : '',
          title: `${displayName}'s Reputation Passport NFT`,
          description: `Score: ${score} | Badge: ${badge} | TX: ${txHash.slice(0, 10)}...`
        }

        const result = await share(shareData)
        setCastResult({ success: true, result })
        success("🎉 Cast Complete!", "Your NFT mint has been shared on Farcaster.xyz")
        trackShareCompleted("farcaster", castText)
      } else {
        // Fallback to Warpcast
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText + ' ' + window.location.href)}`
        openUrl(warpcastUrl)
        setCastResult({ success: true, fallback: true })
        success("🔗 Opening Warpcast", "Please share your success in the composer")
      }
    } catch (err) {
      console.error("❌ Manual cast failed:", err)
      const errorMessage = err instanceof Error ? err.message : "Cast failed"
      setCastResult({ success: false, error: errorMessage })
      showError("Cast Failed", errorMessage)
    } finally {
      setCasting(false)
    }
  }

  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800 shadow-lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="text-2xl">🎉</div>
          <div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              NFT Minted Successfully!
            </h3>
            <p className="text-sm text-green-600 dark:text-green-400">
              Your reputation passport has been minted on-chain
            </p>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Transaction:</span>
            <Badge variant="outline" className="font-mono text-xs">
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Score:</span>
            <span className="font-semibold">{score} {badge}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total TXs:</span>
            <span className="font-semibold">{totalTransactions}</span>
          </div>
        </div>

        {/* Casting Status */}
        <div className="space-y-3">
          {casting && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Spinner className="size-4" />
              <span className="text-sm">Casting to Farcaster.xyz...</span>
            </div>
          )}

          {castResult && castResult.success && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <span className="text-lg">✅</span>
              <span className="text-sm">
                {castResult.fallback 
                  ? "Opening Warpcast composer..." 
                  : "Successfully cast to Farcaster.xyz!"
                }
              </span>
            </div>
          )}

          {castResult && !castResult.success && (
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <span className="text-lg">⚠️</span>
              <span className="text-sm">
                Auto-cast failed. You can manually share your success below.
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleManualCast}
            disabled={casting}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            size="sm"
          >
            {casting ? (
              <>
                <Spinner className="mr-2 size-4" />
                Casting...
              </>
            ) : (
              <>
                📤 {isFrame ? "Cast to Farcaster" : "Share on Warpcast"}
              </>
            )}
          </Button>
          
          {onClose && (
            <Button
              onClick={handleClose}
              variant="outline"
              size="sm"
            >
              Close
            </Button>
          )}
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Share your NFT success with the Farcaster community! 🚀
        </p>
      </div>
    </Card>
  )
}
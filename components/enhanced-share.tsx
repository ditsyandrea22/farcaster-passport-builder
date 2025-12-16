"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"
import { Badge } from "@/components/ui/badge"
import { useFrame } from "@/providers/frame-provider"
import { cn } from "@/lib/utils"

interface EnhancedShareProps {
  text: string
  url?: string
  title?: string
  description?: string
  image?: string
  className?: string
  showPreview?: boolean
  transactionBadges?: string[]
  totalTransactions?: number
  score?: number
  badge?: string
}

export function EnhancedShare({ 
  text, 
  url, 
  title, 
  description, 
  image,
  className,
  showPreview = true,
  transactionBadges = [],
  totalTransactions = 0,
  score,
  badge
}: EnhancedShareProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [shareResult, setShareResult] = useState<any>(null)
  const { isFrame, share, openUrl } = useFrame()

  const shareToWarpcast = () => {
    const enhancedText = `${text}\n\n🚀 Total Transactions: ${totalTransactions}`
    const shareText = url ? `${enhancedText} ${url}` : enhancedText
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`
    openUrl(warpcastUrl)
  }

  const shareToFarcaster = async () => {
    if (!share) return

    setIsSharing(true)
    try {
      const enhancedText = `${text}\n\n🚀 Total Transactions: ${totalTransactions}`
      
      const shareData = {
        text: enhancedText,
        url,
        title,
        description,
        image
      }

      const result = await share(shareData)
      setShareResult(result)
      
      // Show success feedback
      if (result) {
        console.log("Share successful:", result)
      }
    } catch (err) {
      console.error("Share failed:", err)
      // Fallback to Warpcast
      shareToWarpcast()
    } finally {
      setIsSharing(false)
    }
  }

  const handleShare = () => {
    if (isFrame && share) {
      shareToFarcaster()
    } else {
      shareToWarpcast()
    }
  }

  const getTransactionBadgeColor = (badge: string) => {
    switch (badge) {
      case "First Mint":
        return "bg-green-100 text-green-800 border-green-200"
      case "Collector":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Veteran":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "Legend":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Master":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card className={cn("p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-purple-200/50 dark:border-purple-800/50", className)}>
      <div className="space-y-3">
        {showPreview && (
          <div className="space-y-2">
            {image && (
              <img 
                src={image} 
                alt={title || "Share preview"}
                className="w-full h-32 object-cover rounded-lg"
              />
            )}
            {title && (
              <h3 className="font-semibold text-sm">{title}</h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
            )}
            <div className="space-y-2">
              <p className="text-sm">{text}</p>
              {totalTransactions > 0 && (
                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  🚀 Total Transactions: {totalTransactions}
                </p>
              )}
            </div>
            {url && (
              <p className="text-xs text-blue-600 dark:text-blue-400">{url}</p>
            )}
            
            {/* Transaction Badges */}
            {transactionBadges.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Achievement Badges:</p>
                <div className="flex flex-wrap gap-1">
                  {transactionBadges.map((txBadge, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className={cn("text-xs", getTransactionBadgeColor(txBadge))}
                    >
                      🏆 {txBadge}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleShare}
            disabled={isSharing}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            size="sm"
          >
            {isSharing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Sharing...
              </>
            ) : (
              <>
                📤 {isFrame ? "Share to Farcaster" : "Share to Warpcast"}
              </>
            )}
          </Button>
          
          {isFrame && !share && (
            <Button
              onClick={shareToWarpcast}
              variant="outline"
              size="sm"
            >
              🔗 Fallback
            </Button>
          )}
        </div>

        {shareResult && (
          <div className="text-xs text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-950/50 rounded">
            ✅ Share completed successfully!
          </div>
        )}
      </div>
    </Card>
  )
}

interface ShareButtonProps {
  text: string
  url?: string
  className?: string
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"
  totalTransactions?: number
}

export function ShareButton({ 
  text, 
  url, 
  className, 
  variant = "outline", 
  size = "sm",
  totalTransactions = 0
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { isFrame, share, openUrl } = useFrame()

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const enhancedText = totalTransactions > 0 
        ? `${text}\n\n🚀 Total Transactions: ${totalTransactions}`
        : text
      const shareText = url ? `${enhancedText} ${url}` : enhancedText
      
      if (isFrame && share) {
        await share({ text: shareText, url })
      } else {
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`
        openUrl(warpcastUrl)
      }
    } catch (err) {
      console.error("Share failed:", err)
      // Fallback to direct URL
      const fallbackText = totalTransactions > 0 
        ? `${text}\n\n🚀 Total Transactions: ${totalTransactions}`
        : text
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(fallbackText)}`
      openUrl(warpcastUrl)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing}
      variant={variant}
      size={size}
      className={className}
    >
      {isSharing ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          Sharing...
        </>
      ) : (
        <>
          📤 Share
        </>
      )}
    </Button>
  )
}
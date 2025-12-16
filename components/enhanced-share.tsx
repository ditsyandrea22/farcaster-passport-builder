"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"
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
}

export function EnhancedShare({ 
  text, 
  url, 
  title, 
  description, 
  image,
  className,
  showPreview = true 
}: EnhancedShareProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [shareResult, setShareResult] = useState<any>(null)
  const { isFrame, share, openUrl } = useFrame()

  const shareToWarpcast = () => {
    const shareText = url ? `${text}${url}` : text
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`
    openUrl(warpcastUrl)
  }

  const shareToFarcaster = async () => {
    if (!share) return

    setIsSharing(true)
    try {
      const shareData = {
        text,
        url,
        title,
        description,
        image
      }

      const result = await share(shareData)
      setShareResult(result)
      
      // Show success feedback
      if (result) {
        // You could show a toast or notification here
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
            <p className="text-sm">{text}</p>
            {url && (
              <p className="text-xs text-blue-600 dark:text-blue-400">{url}</p>
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
}

export function ShareButton({ text, url, className, variant = "outline", size = "sm" }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { isFrame, share, openUrl } = useFrame()

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const shareText = url ? `${text}${url}` : text
      
      if (isFrame && share) {
        await share({ text: shareText, url })
      } else {
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`
        openUrl(warpcastUrl)
      }
    } catch (err) {
      console.error("Share failed:", err)
      // Fallback to direct URL
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`
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
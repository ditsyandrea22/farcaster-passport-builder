"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSkeleton, LoadingState } from "@/components/ui/loading-skeleton"
import { EnhancedShare, ShareButton } from "@/components/enhanced-share"
import { EnhancedWallet } from "@/components/enhanced-wallet"
import { useFrame } from "@/providers/frame-provider"
import { useNotifications } from "@/components/notification-system"
import { useAnalytics } from "@/components/analytics-tracker"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface PassportData {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  bio: string
  score: number
  badge: string
  custody: string
  followers: number
  following: number
  casts: number
  ageDays: number
  txCount: number
  powerBadge: boolean
  verifiedAddresses: string[]
  engagementRate: number
}

export function EnhancedPassportGenerator() {
  const [fid, setFid] = useState("")
  const [loading, setLoading] = useState(false)
  const [passport, setPassport] = useState<PassportData | null>(null)
  const [error, setError] = useState("")
  const [minting, setMinting] = useState(false)
  
  // Enhanced features
  const { isFrame, wallet, user } = useFrame()
  const { success, error: showError } = useNotifications()
  const { trackPassportGenerated, trackNFTMinted, trackShareCompleted } = useAnalytics()

  // Auto-fill FID from Frame context
  useEffect(() => {
    if (user?.fid && !fid) {
      setFid(user.fid.toString())
    }
  }, [user, fid])

  const generatePassport = async () => {
    if (!fid) {
      showError("FID Required", "Please enter your Farcaster ID")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/score?fid=${fid}`)
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setPassport(data)
      success("Passport Generated", `Your reputation score: ${data.score}`)
      trackPassportGenerated(data.fid, data.score)
    } catch (err) {
      const errorMessage = "Failed to generate passport. Please try again."
      setError(errorMessage)
      showError("Generation Failed", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleMint = async () => {
    if (!passport) return

    setMinting(true)
    try {
      const response = await fetch(`/api/mint?fid=${passport.fid}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      const txData = await response.json()
      
      if (txData.error) {
        throw new Error(txData.error)
      }

      if (wallet?.isConnected && wallet.sendTransaction) {
        // Frame wallet minting
        try {
          const txHash = await wallet.sendTransaction({
            to: txData.params.to,
            data: txData.params.data,
            value: txData.params.value,
          })

          success("Transaction Sent", `NFT minting initiated: ${txHash.slice(0, 10)}...`)
          trackNFTMinted(passport.fid, txData.tokenId, txHash)
        } catch (txErr) {
          // Try using FarCaster SDK actions as fallback
          if ((window as any).farcaster?.sdk?.actions?.transaction) {
            try {
              const result = await (window as any).farcaster.sdk.actions.transaction({
                to: txData.params.to,
                data: txData.params.data,
                value: txData.params.value,
              })
              const txHash = result?.hash || result
              success("Transaction Sent", `NFT minting initiated: ${txHash.slice(0, 10)}...`)
              trackNFTMinted(passport.fid, txData.tokenId, txHash)
            } catch (sdkErr) {
              const errorMsg = txErr instanceof Error ? txErr.message : "Unknown error"
              throw new Error(`Transaction failed: ${errorMsg}`)
            }
          } else {
            const errorMsg = txErr instanceof Error ? txErr.message : "Unknown error"
            throw new Error(`Transaction failed: ${errorMsg}`)
          }
        }
      } else {
        showError("Wallet Required", "Please connect your wallet to mint")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to mint NFT"
      showError("Mint Failed", errorMessage)
    } finally {
      setMinting(false)
    }
  }

  const handleShare = () => {
    if (!passport) return
    
    const shareText = `My Farcaster Reputation Score is ${passport.score} ${passport.badge} 🎯\n\nGenerate yours:`
    trackShareCompleted("farcaster", shareText)
  }

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "OG":
        return "bg-gradient-to-r from-yellow-500 to-orange-500"
      case "Onchain":
        return "bg-gradient-to-r from-blue-500 to-cyan-500"
      case "Active":
        return "bg-gradient-to-r from-green-500 to-emerald-500"
      case "Builder":
        return "bg-gradient-to-r from-purple-500 to-pink-500"
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-500"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 800) return "text-green-400"
    if (score >= 600) return "text-blue-400"
    if (score >= 400) return "text-yellow-400"
    return "text-gray-400"
  }

  return (
    <div className="space-y-6">
      {/* Frame and Wallet Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Frame Status */}
        {isFrame && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <span className="text-lg">🟢</span>
              <div>
                <p className="text-sm font-semibold">Connected to Farcaster Frame</p>
                <p className="text-xs">Welcome, {user?.displayName || user?.username}!</p>
              </div>
            </div>
          </Card>
        )}

        {/* Enhanced Wallet Component */}
        <EnhancedWallet showBalance showNetwork />
      </div>

      {/* Input Section */}
      <Card className="p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-purple-200/50 dark:border-purple-800/50 shadow-xl">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Enter your Farcaster ID (FID)"
              value={fid}
              onChange={(e) => setFid(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  generatePassport()
                }
              }}
              className="flex-1 bg-white/80 dark:bg-gray-800/80"
              disabled={loading}
            />
            <Button
              onClick={generatePassport}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loading ? (
                <>
                  <Spinner className="mr-2" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enter your Farcaster ID to generate your reputation passport. 
            {isFrame ? " Wallet will be connected automatically." : " Don't know your FID? "}
            {!isFrame && (
              <a
                href="https://warpcast.com/~/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                Find it here
              </a>
            )}
          </p>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="passport" showAvatar showStats />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="font-semibold">Generation Failed</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Passport Display */}
      {passport && !loading && (
        <div className="space-y-6">
          {/* Main Passport Card */}
          <Card className="p-8 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white shadow-2xl border-0 animate-fade-in-scale overflow-hidden relative">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "radial-gradient(circle at 20px 20px, white 1px, transparent 0)",
                  backgroundSize: "40px 40px",
                }}
              />
            </div>

            <div className="relative space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <img
                    src={passport.pfpUrl || "/placeholder.svg"}
                    alt={passport.displayName}
                    className="w-16 h-16 rounded-full border-2 border-white/50 shadow-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-3xl font-bold">{passport.displayName}</h2>
                      {passport.powerBadge && <Badge className="bg-yellow-500 text-white text-xs">⚡ Power</Badge>}
                    </div>
                    <p className="text-white/80">@{passport.username}</p>
                    <p className="text-sm text-white/60">FID: {passport.fid}</p>
                    {passport.bio && <p className="text-sm text-white/80 mt-2 line-clamp-2">{passport.bio}</p>}
                  </div>
                </div>
                <Badge
                  className={cn(`${getBadgeColor(passport.badge)} text-white px-3 py-1 text-sm font-semibold shadow-lg`)}
                >
                  {passport.badge}
                </Badge>
              </div>

              {/* Score Section */}
              <div className="py-8 border-y border-white/20 bg-white/5 rounded-xl">
                <div className={cn(`text-7xl font-bold text-center ${getScoreColor(passport.score)} drop-shadow-lg`)}>
                  {passport.score}
                </div>
                <p className="text-center text-white/80 mt-2 text-lg font-medium">Reputation Score</p>
                <p className="text-center text-white/60 text-sm mt-1">
                  {passport.engagementRate.toFixed(1)}% engagement rate
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-xs text-white/60 mb-1">Followers</p>
                  <p className="text-2xl font-bold">{passport.followers.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-xs text-white/60 mb-1">Following</p>
                  <p className="text-2xl font-bold">{passport.following.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-xs text-white/60 mb-1">Casts</p>
                  <p className="text-2xl font-bold">{passport.casts.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-xs text-white/60 mb-1">Transactions</p>
                  <p className="text-2xl font-bold">{passport.txCount.toLocaleString()}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-3">
                <Button
                  onClick={handleMint}
                  disabled={minting || !wallet?.isConnected}
                  className="w-full bg-white text-purple-600 hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-lg font-semibold"
                  size="lg"
                >
                  {minting ? (
                    <>
                      <Spinner className="mr-2" />
                      Minting...
                    </>
                  ) : (
                    "🎫 Mint Passport NFT"
                  )}
                </Button>
                
                <ShareButton
                  text={`My Farcaster Reputation Score is ${passport.score} ${passport.badge} 🎯\n\nGenerate yours:`}
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                  variant="outline"
                  size="lg"
                  className="w-full border-white/30 text-white hover:bg-white/10 transition-all duration-300 bg-transparent"
                />
              </div>
            </div>
          </Card>

          {/* Enhanced Share Component */}
          <EnhancedShare
            text={`My Farcaster Reputation Score is ${passport.score} ${passport.badge} 🎯`}
            url={typeof window !== 'undefined' ? window.location.href : ''}
            title={`${passport.displayName}'s Reputation Passport`}
            description={`Score: ${passport.score} | ${passport.followers.toLocaleString()} followers`}
            image={passport.pfpUrl}
            showPreview
          />
        </div>
      )}
    </div>
  )
}
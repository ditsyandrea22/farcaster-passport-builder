"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSkeleton, LoadingState } from "@/components/ui/loading-skeleton"
import { ReputationOnboarding } from "./reputation-onboarding"
import { ScoringBreakdown } from "./scoring-breakdown"
import { EnhancedShare, ShareButton } from "./enhanced-share"
import { ProductionWallet } from "./production-wallet"
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

export function MiniAppOptimizedPassportGenerator() {
  const [fid, setFid] = useState("")
  const [loading, setLoading] = useState(false)
  const [passport, setPassport] = useState<PassportData | null>(null)
  const [error, setError] = useState("")
  const [minting, setMinting] = useState(false)
  const [mintResult, setMintResult] = useState<any>(null)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [showScoringBreakdown, setShowScoringBreakdown] = useState(false)
  const [gasEstimate, setGasEstimate] = useState<string>("")
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)
  
  const { isFrame, wallet, user, isWalletConnected, sendTransaction, walletState } = useFrame()
  const { success, error: showError } = useNotifications()
  const { trackPassportGenerated, trackNFTMinted, trackShareCompleted } = useAnalytics()

  // Auto-fill FID from Frame context
  useEffect(() => {
    if (user?.fid && !fid) {
      setFid(user.fid.toString())
    }
  }, [user, fid])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    setHasSeenOnboarding(true)
  }

  const handleOnboardingSkip = () => {
    setShowOnboarding(false)
    setHasSeenOnboarding(true)
  }

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
      
      // Show scoring breakdown after generation
      setShowScoringBreakdown(true)
    } catch (err) {
      const errorMessage = "Failed to generate passport. Please try again."
      setError(errorMessage)
      showError("Generation Failed", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getGasEstimate = async () => {
    if (!passport || !walletState?.address) return

    try {
      const response = await fetch(`/api/mint?fid=${passport.fid}&userAddress=${walletState.address}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      
      const txData = await response.json()
      if (txData.gasEstimate) {
        setGasEstimate(txData.gasEstimate)
      }
    } catch (err) {
      console.error("Failed to get gas estimate:", err)
    }
  }

  const handleMint = async () => {
    if (!passport) {
      showError("No Passport", "Generate your passport first")
      return
    }

    if (!isWalletConnected || !walletState?.address) {
      showError("Wallet Required", "Please connect your wallet to mint")
      return
    }

    setMinting(true)
    setMintResult(null)
    
    try {
      // Get transaction data from API
      const mintUrl = `/api/mint?fid=${passport.fid}&userAddress=${walletState.address}`
      
      const response = await fetch(mintUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      const txData = await response.json()
      
      if (txData.error) {
        throw new Error(txData.error)
      }

      // Prepare transaction
      const txParams = {
        to: txData.to,
        data: txData.data,
        value: txData.value || "0"
      }
      
      // Send transaction
      const result = await sendTransaction(txParams)
      
      success("✅ Transaction Sent", `NFT minting initiated: ${result.hash.slice(0, 10)}...`)
      
      setMintResult({
        success: true,
        txHash: result.hash,
        message: "🎉 NFT minting transaction sent successfully!",
        shareData: txData.shareData,
        status: result.status
      })
      
      trackNFTMinted(passport.fid, "", result.hash)
      
    } catch (err) {
      console.error("❌ Mint error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to mint NFT"
      
      // Enhanced error handling
      let userFriendlyMessage = errorMessage
      if (errorMessage.includes("insufficient funds")) {
        userFriendlyMessage = "Insufficient Base ETH for gas fees. Please add Base ETH to your wallet."
      } else if (errorMessage.includes("user rejected")) {
        userFriendlyMessage = "Transaction was rejected. Please try again and confirm the transaction."
      } else if (errorMessage.includes("network")) {
        userFriendlyMessage = "Network connection issue. Please check your internet connection and try again."
      }
      
      showError("❌ Mint Failed", userFriendlyMessage)
      setMintResult({
        success: false,
        error: userFriendlyMessage
      })
    } finally {
      setMinting(false)
    }
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

  // Show onboarding if user hasn't seen it
  if (showOnboarding) {
    return (
      <ReputationOnboarding
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 p-4">
      {/* Mini App Optimized Header */}
      <Card className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-lg font-bold">🎯 Reputation Passport</h1>
          <p className="text-xs text-white/80">
            Your on-chain reputation identity
          </p>
          {isFrame && (
            <Badge className="bg-white/20 text-white text-xs">
              Connected to Farcaster
            </Badge>
          )}
        </div>
      </Card>

      {/* Compact Wallet Status */}
      {isFrame && (
        <Card className="p-3 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <span className="text-sm">🟢</span>
            <div className="flex-1">
              <p className="text-xs font-semibold">{user?.displayName || user?.username}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">FID: {user?.fid}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Compact Input Section */}
      <Card className="p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-purple-200/50 dark:border-purple-800/50 shadow-lg">
        <div className="space-y-3">
          <Input
            type="number"
            placeholder="Enter your FID"
            value={fid}
            onChange={(e) => setFid(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                generatePassport()
              }
            }}
            className="bg-white/80 dark:bg-gray-800/80 text-sm h-10"
            disabled={loading}
          />
          <Button
            onClick={generatePassport}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-10"
            size="sm"
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-3 w-3" />
                Generating...
              </>
            ) : (
              "Generate Passport"
            )}
          </Button>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <LoadingSkeleton variant="passport" />
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <span className="text-sm">⚠️</span>
            <div>
              <p className="text-sm font-semibold">Generation Failed</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Mint Result */}
      {mintResult && (
        <Card className={cn(
          "p-4 border",
          mintResult.success
            ? "bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800"
        )}>
          <div className={cn(
            "flex items-center gap-2",
            mintResult.success
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          )}>
            <span className="text-sm">{mintResult.success ? "✅" : "❌"}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{mintResult.success ? "Mint Initiated" : "Mint Failed"}</p>
              <p className="text-xs mt-1">{mintResult.message || mintResult.error}</p>
              {mintResult.txHash && (
                <p className="text-xs mt-1 font-mono break-all">
                  Tx: {mintResult.txHash.slice(0, 10)}...
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Compact Passport Display */}
      {passport && !loading && (
        <div className="space-y-4">
          {/* Main Passport Card */}
          <Card className="p-4 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white shadow-xl border-0 overflow-hidden">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-3">
                <img
                  src={passport.pfpUrl || "/placeholder.svg"}
                  alt={passport.displayName}
                  className="w-12 h-12 rounded-full border-2 border-white/50"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h2 className="text-lg font-bold truncate">{passport.displayName}</h2>
                    {passport.powerBadge && <Badge className="bg-yellow-500 text-white text-xs">⚡</Badge>}
                  </div>
                  <p className="text-xs text-white/80">@{passport.username}</p>
                  <p className="text-xs text-white/60">FID: {passport.fid}</p>
                </div>
                <Badge className={cn(`${getBadgeColor(passport.badge)} text-white px-2 py-1 text-xs font-semibold`)}>
                  {passport.badge}
                </Badge>
              </div>

              {/* Score Section */}
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className={cn(`text-4xl font-bold text-center ${getScoreColor(passport.score)}`)}>
                  {passport.score}
                </div>
                <p className="text-center text-white/80 text-xs">Reputation Score</p>
                <p className="text-center text-white/60 text-xs">
                  {passport.engagementRate.toFixed(1)}% engagement
                </p>
              </div>

              {/* Compact Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/10 rounded p-2 text-center">
                  <p className="text-xs text-white/60">Followers</p>
                  <p className="text-sm font-bold">{passport.followers.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 rounded p-2 text-center">
                  <p className="text-xs text-white/60">Casts</p>
                  <p className="text-sm font-bold">{passport.casts.toLocaleString()}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleMint}
                  disabled={minting || !isWalletConnected}
                  className="w-full bg-white text-purple-600 hover:bg-white/90 h-10 text-sm font-semibold"
                  size="sm"
                >
                  {minting ? (
                    <>
                      <Spinner className="mr-2 h-3 w-3" />
                      Minting...
                    </>
                  ) : (
                    "🎫 Mint NFT"
                  )}
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowScoringBreakdown(!showScoringBreakdown)}
                    className="border-white/30 text-white hover:bg-white/10 h-8 text-xs bg-transparent"
                    size="sm"
                  >
                    {showScoringBreakdown ? "Hide" : "Score"} Breakdown
                  </Button>
                  
                  <ShareButton
                    text={`My Farcaster Reputation Score is ${passport.score} ${passport.badge} 🎯`}
                    url={typeof window !== 'undefined' ? window.location.href : ''}
                    variant="outline"
                    size="sm"
                    className="border-white/30 text-white hover:bg-white/10 h-8 text-xs bg-transparent"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Scoring Breakdown */}
          {showScoringBreakdown && (
            <ScoringBreakdown passportData={passport} />
          )}

          {/* Gas Estimate Info */}
          {isWalletConnected && !gasEstimate && (
            <Button
              variant="outline"
              onClick={getGasEstimate}
              className="w-full text-xs h-8"
              size="sm"
            >
              💰 Check Gas Fees
            </Button>
          )}

          {gasEstimate && (
            <Card className="p-3 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                <span className="text-sm">⛽</span>
                <p className="text-xs">Estimated gas: {gasEstimate}</p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
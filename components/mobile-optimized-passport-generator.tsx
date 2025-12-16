"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSkeleton, LoadingState } from "@/components/ui/loading-skeleton"
import { EnhancedShare, ShareButton } from "@/components/enhanced-share"
import { EnhancedWallet } from "@/components/enhanced-wallet"
import { useFrame } from "@/providers/frame-provider-unified"
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

interface TransactionSummary {
  totalTransactions: number
  badges: string[]
  latestTransaction?: any
}

export function MobileOptimizedPassportGenerator() {
  const [fid, setFid] = useState("")
  const [loading, setLoading] = useState(false)
  const [passport, setPassport] = useState<PassportData | null>(null)
  const [error, setError] = useState("")
  const [minting, setMinting] = useState(false)
  const [mintResult, setMintResult] = useState<any>(null)
  const [txSummary, setTxSummary] = useState<TransactionSummary | null>(null)
  
  // Enhanced features
  const { isFrame, wallet, user, isWalletConnected } = useFrame()
  const { success, error: showError } = useNotifications()
  const { trackPassportGenerated, trackNFTMinted, trackShareCompleted } = useAnalytics()

  // Auto-fill FID from Frame context
  useEffect(() => {
    if (user?.fid && !fid) {
      setFid(user.fid.toString())
    }
  }, [user, fid])

  // Load transaction history when passport is loaded
  useEffect(() => {
    if (passport?.fid) {
      loadTransactionHistory(passport.fid)
    }
  }, [passport?.fid])

  const loadTransactionHistory = async (fid: number) => {
    try {
      const response = await fetch(`/api/transaction-history?fid=${fid}`)
      if (response.ok) {
        const data = await response.json()
        setTxSummary({
          totalTransactions: data.totalTransactions || 0,
          badges: data.badges || [],
          latestTransaction: data.latestTransaction
        })
      }
    } catch (err) {
      console.error("Failed to load transaction history:", err)
    }
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
    } catch (err) {
      const errorMessage = "Failed to generate passport. Please try again."
      setError(errorMessage)
      showError("Generation Failed", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleMint = async () => {
    if (!passport) {
      showError("No Passport", "Generate your passport first")
      return
    }

    // Check wallet connection
    if (!wallet) {
      showError("Wallet Required", "Please wait for wallet to load")
      return
    }

    if (!wallet.address && !isFrame) {
      showError("Wallet Required", "Please connect your wallet to mint")
      return
    }

    setMinting(true)
    setMintResult(null)
    
    try {
      console.log("🚀 Starting mint process...", {
        fid: passport.fid,
        walletAddress: wallet.address,
        isFrame
      })

      // Step 1: Get transaction data from API
      const mintUrl = `/api/mint?fid=${passport.fid}${wallet.address ? `&userAddress=${wallet.address}` : ''}`
      console.log("📡 Fetching transaction data from:", mintUrl)
      
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
      console.log("📋 Transaction data received:", txData)
      
      if (txData.error) {
        throw new Error(txData.error)
      }

      // Step 2: Send transaction through wallet
      let txHash = ""
      
      if (isFrame) {
        console.log("🎯 Frame wallet minting...")
        
        // Frame wallet minting - enhanced error handling
        try {
          // Prepare transaction data
          const txParams = txData.params || {
            to: txData.to,
            data: txData.data,
            value: txData.value
          }

          console.log("💳 Sending transaction with params:", txParams)
          
          // Validate transaction parameters
          if (!txParams.to || !txParams.data) {
            throw new Error("Invalid transaction parameters")
          }
          
          // Use the wallet's sendTransaction method
          if (wallet.sendTransaction) {
            try {
              txHash = await wallet.sendTransaction(txParams)
              console.log("✅ Transaction hash received:", txHash)
              
              if (!txHash) {
                throw new Error("No transaction hash received from wallet")
              }
              
            } catch (sendErr) {
              console.error("❌ Wallet sendTransaction failed:", sendErr)
              const walletError = sendErr instanceof Error ? sendErr.message : "Unknown wallet error"
              
              // Provide more specific error messages based on common issues
              if (walletError.includes("insufficient funds")) {
                throw new Error("Insufficient Base ETH for gas fees. Please add Base ETH to your wallet.")
              } else if (walletError.includes("rejected")) {
                throw new Error("Transaction was rejected in your wallet. Please try again and confirm the transaction.")
              } else if (walletError.includes("network")) {
                throw new Error("Network error. Please check your connection and try again.")
              } else {
                throw new Error(`Wallet transaction failed: ${walletError}`)
              }
            }
          } else {
            throw new Error("Wallet transaction method not available")
          }
          
          success("✅ Transaction Sent", `NFT minting initiated: ${txHash.slice(0, 10)}...`)
          
          setMintResult({
            success: true,
            txHash,
            message: "🎉 NFT minting transaction sent successfully!",
            shareData: txData.shareData
          })
          
          trackNFTMinted(passport.fid, "", txHash)
          
          // Reload transaction history after successful mint
          setTimeout(() => {
            console.log("🔄 Reloading transaction history...")
            loadTransactionHistory(passport.fid)
          }, 2000)
          
        } catch (txErr) {
          console.error("❌ Frame transaction failed:", txErr)
          const errorMsg = txErr instanceof Error ? txErr.message : "Unknown transaction error"
          
          // Provide specific error messages for common issues
          let userFriendlyMessage = errorMsg
          if (errorMsg.includes("insufficient funds")) {
            userFriendlyMessage = "Insufficient Base ETH for gas fees. Please add Base ETH to your wallet."
          } else if (errorMsg.includes("rejected")) {
            userFriendlyMessage = "Transaction was rejected. Please try again and confirm the transaction."
          } else if (errorMsg.includes("network")) {
            userFriendlyMessage = "Network connection issue. Please check your internet connection and try again."
          }
          
          throw new Error(userFriendlyMessage)
        }
      } else {
        console.log("🌐 Web app minting (external wallet)...")
        
        // Web app minting - return transaction data for external wallet
        setMintResult({
          success: true,
          txData,
          message: "📋 Transaction data prepared. Please confirm in your wallet.",
          shareData: txData.shareData
        })
        success("📋 Transaction Ready", "Please confirm the transaction in your wallet")
      }
      
    } catch (err) {
      console.error("❌ Mint error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to mint NFT"
      
      // Provide specific error messages for common issues
      let userFriendlyMessage = errorMessage
      if (errorMessage.includes("insufficient funds")) {
        userFriendlyMessage = "Insufficient Base ETH for gas fees. Please add Base ETH to your wallet and try again."
      } else if (errorMessage.includes("rejected")) {
        userFriendlyMessage = "Transaction was rejected. Please try again and confirm the transaction in your wallet."
      } else if (errorMessage.includes("network")) {
        userFriendlyMessage = "Network connection issue. Please check your internet connection and try again."
      } else if (errorMessage.includes("API request failed")) {
        userFriendlyMessage = "Server error. Please try again in a moment or contact support if the issue persists."
      } else if (errorMessage.includes("Contract")) {
        userFriendlyMessage = "Smart contract error. Please check if the contract is properly deployed and try again."
      }
      
      showError("❌ Mint Failed", userFriendlyMessage)
      setMintResult({
        success: false,
        error: userFriendlyMessage
      })
    } finally {
      setMinting(false)
      console.log("🏁 Mint process completed")
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

  const totalTransactions = txSummary?.totalTransactions || 0

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Frame and Wallet Status */}
      <div className="grid grid-cols-1 gap-4">
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
      <Card className="p-4 md:p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-purple-200/50 dark:border-purple-800/50 shadow-xl">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
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
              className="flex-1 bg-white/80 dark:bg-gray-800/80 text-base"
              disabled={loading}
            />
            <Button
              onClick={generatePassport}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto min-h-[44px]"
              size="lg"
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
          
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
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

      {/* Mint Result */}
      {mintResult && (
        <Card className={cn(
          "p-6 border",
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
            <span className="text-xl">{mintResult.success ? "✅" : "❌"}</span>
            <div>
              <h3 className="font-semibold">{mintResult.success ? "Mint Initiated" : "Mint Failed"}</h3>
              <p className="text-sm mt-1">{mintResult.message || mintResult.error}</p>
              {mintResult.txHash && (
                <p className="text-xs mt-2 font-mono break-all">
                  Tx: {mintResult.txHash}
                </p>
              )}
              {mintResult.success && mintResult.shareData && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    🎉 Ready to Share!
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Your enhanced share includes total transactions: {mintResult.shareData.totalTransactions}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Passport Display */}
      {passport && !loading && (
        <div className="space-y-4 md:space-y-6">
          {/* Mobile-Optimized Passport Card */}
          <Card className="p-4 md:p-6 lg:p-8 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white shadow-2xl border-0 animate-fade-in-scale overflow-hidden relative">
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

            <div className="relative space-y-4 md:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3 md:gap-4 flex-1">
                  <img
                    src={passport.pfpUrl || "/placeholder.svg"}
                    alt={passport.displayName}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white/50 shadow-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">{passport.displayName}</h2>
                      {passport.powerBadge && <Badge className="bg-yellow-500 text-white text-xs">⚡ Power</Badge>}
                    </div>
                    <p className="text-white/80 text-sm md:text-base">@{passport.username}</p>
                    <p className="text-xs md:text-sm text-white/60">FID: {passport.fid}</p>
                    {passport.bio && <p className="text-sm text-white/80 mt-2 line-clamp-2">{passport.bio}</p>}
                  </div>
                </div>
                <Badge
                  className={cn(`${getBadgeColor(passport.badge)} text-white px-2 md:px-3 py-1 text-xs md:text-sm font-semibold shadow-lg self-start sm:self-center`)}
                >
                  {passport.badge}
                </Badge>
              </div>

              {/* Score Section */}
              <div className="py-4 md:py-6 lg:py-8 border-y border-white/20 bg-white/5 rounded-xl">
                <div className={cn(`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center ${getScoreColor(passport.score)} drop-shadow-lg`)}>
                  {passport.score}
                </div>
                <p className="text-center text-white/80 mt-2 text-base md:text-lg font-medium">Reputation Score</p>
                <p className="text-center text-white/60 text-xs md:text-sm mt-1">
                  {passport.engagementRate.toFixed(1)}% engagement rate
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white/10 rounded-lg p-2 md:p-3 backdrop-blur-sm">
                  <p className="text-xs text-white/60 mb-1">Followers</p>
                  <p className="text-lg md:text-xl lg:text-2xl font-bold">{passport.followers.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 md:p-3 backdrop-blur-sm">
                  <p className="text-xs text-white/60 mb-1">Following</p>
                  <p className="text-lg md:text-xl lg:text-2xl font-bold">{passport.following.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 md:p-3 backdrop-blur-sm">
                  <p className="text-xs text-white/60 mb-1">Casts</p>
                  <p className="text-lg md:text-xl lg:text-2xl font-bold">{passport.casts.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 md:p-3 backdrop-blur-sm">
                  <p className="text-xs text-white/60 mb-1">Transactions</p>
                  <p className="text-lg md:text-xl lg:text-2xl font-bold">{passport.txCount.toLocaleString()}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-3">
                <Button
                  onClick={handleMint}
                  disabled={minting || !isWalletConnected}
                  className="w-full bg-white text-purple-600 hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-lg font-semibold text-base md:text-lg min-h-[48px] md:min-h-[52px]"
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
                  totalTransactions={totalTransactions}
                  className="w-full border-white/30 text-white hover:bg-white/10 transition-all duration-300 bg-transparent text-base md:text-lg min-h-[48px] md:min-h-[52px]"
                />
              </div>
            </div>
          </Card>

          {/* Enhanced Share Component with Transaction History */}
          <EnhancedShare
            text={`My Farcaster Reputation Score is ${passport.score} ${passport.badge} 🎯`}
            url={typeof window !== 'undefined' ? window.location.href : ''}
            title={`${passport.displayName}'s Reputation Passport`}
            description={`Score: ${passport.score} | Badge: ${passport.badge} | Total Transactions: ${totalTransactions}`}
            image={passport.pfpUrl}
            showPreview
            transactionBadges={txSummary?.badges || []}
            totalTransactions={totalTransactions}
            score={passport.score}
            badge={passport.badge}
          />
        </div>
      )}
    </div>
  )
}
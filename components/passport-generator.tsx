"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useAccount, useWriteContract } from "wagmi"
import { REPUTATION_PASSPORT_ABI } from "@/lib/contract-abi"
import { CheckCircle, AlertCircle, Wallet } from "lucide-react"

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

export function PassportGenerator() {
  const [fid, setFid] = useState("")
  const [loading, setLoading] = useState(false)
  const [passport, setPassport] = useState<PassportData | null>(null)
  const [error, setError] = useState("")
  const [minting, setMinting] = useState(false)
  const [mintError, setMintError] = useState("")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [mintSuccess, setMintSuccess] = useState(false)
  
  const { isConnected, address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const generatePassport = async () => {
    if (!fid) {
      setError("Please enter a FID")
      return
    }

    setLoading(true)
    setError("")
    setMintSuccess(false)
    setMintError("")
    setTxHash(null)

    try {
      const res = await fetch(`/api/score?fid=${fid}`)
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setPassport(data)
    } catch (err) {
      setError("Failed to generate passport. Please try again.")
      console.error("Generate error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleMint = async () => {
    if (!passport || !isConnected || !address) {
      setMintError("Please connect your wallet first")
      return
    }

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      setMintError("Contract address not configured. Please check your environment variables.")
      return
    }

    setMinting(true)
    setMintError("")
    setTxHash(null)
    setMintSuccess(false)

    try {
      console.log("Minting passport with:", {
        to: address,
        fid: passport.fid,
        score: passport.score,
        badge: passport.badge,
        contractAddress
      })

      const txHash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: REPUTATION_PASSPORT_ABI,
        functionName: "mintPassport",
        args: [address, BigInt(passport.fid), BigInt(passport.score), passport.badge],
      })

      setTxHash(txHash)
      setMintSuccess(true)
      console.log("Transaction sent:", txHash)
    } catch (err) {
      console.error("Mint error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to mint passport"
      setMintError(errorMessage)
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

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-purple-200/50 dark:border-purple-800/50 shadow-xl">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Enter your Farcaster ID (FID)"
              value={fid}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFid(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
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
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
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
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enter your Farcaster ID to generate your reputation passport. Don't know your FID?{" "}
            <a
              href="https://warpcast.com/~/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              Find it here
            </a>
          </p>
        </div>
      </Card>

      {loading && (
        <Card className="p-8 bg-gradient-to-br from-purple-500/90 to-blue-600/90 backdrop-blur-md animate-pulse">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-8 bg-white/30 rounded w-3/4"></div>
                <div className="h-4 bg-white/20 rounded w-1/2"></div>
                <div className="h-3 bg-white/20 rounded w-1/3"></div>
              </div>
              <div className="h-8 w-24 bg-white/30 rounded-full"></div>
            </div>
            <div className="py-8 border-y border-white/20">
              <div className="h-16 bg-white/30 rounded w-32 mx-auto"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-white/20 rounded w-2/3"></div>
                  <div className="h-6 bg-white/30 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {passport && !loading && (
        <Card className="p-8 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white shadow-2xl border-0 animate-fade-in-scale overflow-hidden relative">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(circle at 20px 20px, white 1px, transparent 0)",
                backgroundSize: "40px 40px",
              }}
            ></div>
          </div>

          <div className="relative space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                {passport.pfpUrl && (
                  <img
                    src={passport.pfpUrl || "/placeholder.svg"}
                    alt={passport.displayName}
                    className="w-16 h-16 rounded-full border-2 border-white/50 shadow-lg"
                  />
                )}
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
                className={`${getBadgeColor(passport.badge)} text-white px-3 py-1 text-sm font-semibold shadow-lg`}
              >
                {passport.badge}
              </Badge>
            </div>

            <div className="py-8 border-y border-white/20 bg-white/5 rounded-xl">
              <div className={`text-7xl font-bold text-center ${getScoreColor(passport.score)} drop-shadow-lg`}>
                {passport.score}
              </div>
              <p className="text-center text-white/80 mt-2 text-lg font-medium">Reputation Score</p>
              <p className="text-center text-white/60 text-sm mt-1">
                {passport.engagementRate.toFixed(1)}% engagement rate
              </p>
            </div>

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

            <div className="pt-4 space-y-2">
              {/* Wallet Status */}
              {!isConnected && (
                <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-700">Connect your wallet to mint the NFT</p>
                </div>
              )}
              
              {isConnected && address && (
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-700">Connected: {formatAddress(address)}</p>
                </div>
              )}

              {/* Mint Button */}
              <Button
                onClick={handleMint}
                disabled={minting || !isConnected}
                className="w-full bg-white text-purple-600 hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-lg font-semibold"
                size="lg"
              >
                {minting ? (
                  <>
                    <Spinner className="mr-2" />
                    Minting Passport...
                  </>
                ) : mintSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Passport Minted!
                  </>
                ) : (
                  "🎫 Mint Passport NFT"
                )}
              </Button>

              {/* Mint Status Messages */}
              {mintSuccess && txHash && (
                <div className="p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Passport NFT minted successfully!
                    </p>
                  </div>
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-700 underline hover:text-green-800 mt-1 block"
                  >
                    View transaction: {txHash.slice(0, 10)}...
                  </a>
                </div>
              )}

              {mintError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-600 dark:text-red-400">{mintError}</p>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/10 transition-all duration-300 bg-transparent"
                size="lg"
              >
                📤 Share to Farcaster
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

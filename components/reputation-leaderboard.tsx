"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface LeaderboardEntry {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  score: number
  badge: string
  rank: number
  followers: number
  casts: number
  ageDays: number
  isCurrentUser?: boolean
}

interface LeaderboardProps {
  currentUserFid?: number
  onUserClick?: (fid: number) => void
  className?: string
  compact?: boolean
}

export function ReputationLeaderboard({ 
  currentUserFid, 
  onUserClick, 
  className,
  compact = false 
}: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"overall" | "followers" | "casts" | "onchain">("overall")
  const [timeFrame, setTimeFrame] = useState<"all" | "month" | "week">("all")

  useEffect(() => {
    loadLeaderboard()
  }, [filterType, timeFrame])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      // In a real app, this would fetch from an API
      const mockLeaderboard = generateMockLeaderboard()
      setLeaderboard(mockLeaderboard)
    } catch (err) {
      console.error("Failed to load leaderboard:", err)
    } finally {
      setLoading(false)
    }
  }

  const generateMockLeaderboard = (): LeaderboardEntry[] => {
    const mockData: LeaderboardEntry[] = [
      {
        fid: 1,
        username: "vitalik",
        displayName: "Vitalik Buterin",
        pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=vitalik",
        score: 950,
        badge: "OG",
        rank: 1,
        followers: 2500000,
        casts: 15000,
        ageDays: 2000
      },
      {
        fid: 2,
        username: "balajis",
        displayName: "Balaji Srinivasan",
        pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=balaji",
        score: 875,
        badge: "OG",
        rank: 2,
        followers: 1800000,
        casts: 12000,
        ageDays: 1800
      },
      {
        fid: 3,
        username: "aeyakovenko",
        displayName: "Anatoly Yakovenko",
        pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=anatoly",
        score: 820,
        badge: "Onchain",
        rank: 3,
        followers: 850000,
        casts: 8000,
        ageDays: 1500
      },
      {
        fid: 4,
        username: "dwr",
        displayName: "Dan Romero",
        pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=dan",
        score: 795,
        badge: "Builder",
        rank: 4,
        followers: 650000,
        casts: 9500,
        ageDays: 1400
      },
      {
        fid: 5,
        username: "naval",
        displayName: "Naval Ravikant",
        pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=naval",
        score: 760,
        badge: "OG",
        rank: 5,
        followers: 1200000,
        casts: 6000,
        ageDays: 1600
      },
      {
        fid: 6,
        username: "cdixon",
        displayName: "Chris Dixon",
        pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=chris",
        score: 735,
        badge: "Builder",
        rank: 6,
        followers: 580000,
        casts: 7200,
        ageDays: 1350
      },
      {
        fid: 7,
        username: "lizlabs",
        displayName: "Liz Labs",
        pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=liz",
        score: currentUserFid === 7 ? 700 : 685,
        badge: "Builder",
        rank: 7,
        followers: 45000,
        casts: 3200,
        ageDays: 800,
        isCurrentUser: currentUserFid === 7
      }
    ]

    return mockData
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return "🥇"
      case 2: return "🥈"
      case 3: return "🥉"
      default: return `#${rank}`
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

  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (compact) {
    return (
      <Card className={cn("p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-purple-200/50 dark:border-purple-800/50 shadow-lg", className)}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">🏆 Top Reputations</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUserClick?.(leaderboard[0]?.fid)}
              className="text-purple-600 hover:text-purple-700 h-6 w-6 p-0"
            >
              👁️
            </Button>
          </div>
          
          <div className="space-y-2">
            {leaderboard.slice(0, 3).map((entry) => (
              <div
                key={entry.fid}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                  entry.isCurrentUser 
                    ? "bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
                onClick={() => onUserClick?.(entry.fid)}
              >
                <span className="text-lg">{getRankIcon(entry.rank)}</span>
                <img
                  src={entry.pfpUrl}
                  alt={entry.displayName}
                  className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {entry.displayName}
                    {entry.isCurrentUser && <span className="text-purple-600 ml-1">(You)</span>}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">@{entry.username}</span>
                    <Badge className={cn(`${getBadgeColor(entry.badge)} text-white px-1 py-0 text-xs`)}>
                      {entry.badge}
                    </Badge>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUserClick?.(leaderboard[0]?.fid)}
            className="w-full text-xs"
          >
            View Full Leaderboard
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-purple-200/50 dark:border-purple-800/50 shadow-xl", className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            🏆 Reputation Leaderboard
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Top Farcaster reputations in the ecosystem
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex gap-2">
            {[
              { key: "overall", label: "Overall" },
              { key: "followers", label: "Followers" },
              { key: "casts", label: "Activity" },
              { key: "onchain", label: "On-chain" }
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={filterType === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(filter.key as any)}
                className="flex-1 text-xs"
              >
                {filter.label}
              </Button>
            ))}
          </div>
          
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-sm"
          />
        </div>

        {/* Leaderboard List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading leaderboard...</p>
            </div>
          ) : (
            filteredLeaderboard.map((entry) => (
              <div
                key={entry.fid}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md",
                  entry.isCurrentUser 
                    ? "bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 border-2 border-purple-200 dark:border-purple-800"
                    : "bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                )}
                onClick={() => onUserClick?.(entry.fid)}
              >
                {/* Rank */}
                <div className="w-12 text-center">
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    {getRankIcon(entry.rank)}
                  </span>
                </div>

                {/* Avatar */}
                <img
                  src={entry.pfpUrl}
                  alt={entry.displayName}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                />

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {entry.displayName}
                    </h3>
                    {entry.isCurrentUser && (
                      <Badge className="bg-purple-500 text-white text-xs">You</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    @{entry.username}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={cn(`${getBadgeColor(entry.badge)} text-white px-2 py-0.5 text-xs`)}>
                      {entry.badge}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {entry.followers.toLocaleString()} followers
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {entry.score}
                  </div>
                  <div className="text-xs text-gray-500">reputation</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Leaderboard Stats</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="font-semibold">{leaderboard.length.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Top Score</p>
              <p className="font-semibold">{Math.max(...leaderboard.map(l => l.score))}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Avg Score</p>
              <p className="font-semibold">
                {Math.round(leaderboard.reduce((sum, l) => sum + l.score, 0) / leaderboard.length)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Your Rank</p>
              <p className="font-semibold text-purple-600">
                #{leaderboard.find(l => l.isCurrentUser)?.rank || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Want to climb the leaderboard?
          </p>
          <Button
            onClick={() => onUserClick?.(leaderboard[0]?.fid)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Generate Your Passport
          </Button>
        </div>
      </div>
    </Card>
  )
}
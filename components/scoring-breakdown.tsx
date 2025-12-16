"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ScoreBreakdown {
  metric: string
  value: number
  maxPoints: number
  actualPoints: number
  description: string
  icon: string
  color: string
}

interface ScoringBreakdownProps {
  passportData: {
    score: number
    followers: number
    following: number
    casts: number
    ageDays: number
    txCount: number
    powerBadge: boolean
    verifiedAddresses: string[]
    engagementRate: number
  }
  className?: string
}

export function ScoringBreakdown({ passportData, className }: ScoringBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const calculateBreakdown = (): ScoreBreakdown[] => {
    const {
      followers,
      following,
      casts,
      ageDays,
      txCount,
      powerBadge,
      verifiedAddresses,
      engagementRate
    } = passportData

    return [
      {
        metric: "Followers",
        value: followers,
        maxPoints: 250,
        actualPoints: Math.min(followers, 5000) * 0.05 + 
          (followers > 5000 ? Math.min((followers - 5000) * 0.01, 50) : 0),
        description: "Social influence with diminishing returns",
        icon: "👥",
        color: "blue"
      },
      {
        metric: "Engagement Rate",
        value: Math.round(engagementRate * 10) / 10,
        maxPoints: 200,
        actualPoints: engagementRate * 10,
        description: "Quality over quantity of interactions",
        icon: "💬",
        color: "green"
      },
      {
        metric: "Cast Activity",
        value: casts,
        maxPoints: 150,
        actualPoints: Math.min(casts, 1000) * 0.15,
        description: "Content creation and participation",
        icon: "📝",
        color: "purple"
      },
      {
        metric: "Account Age",
        value: ageDays,
        maxPoints: 150,
        actualPoints: Math.min(ageDays, 730) * 0.2,
        description: "Longevity in the ecosystem",
        icon: "📅",
        color: "orange"
      },
      {
        metric: "On-chain Activity",
        value: txCount,
        maxPoints: 200,
        actualPoints: Math.min(txCount, 1000) * 0.2,
        description: "Base network transaction history",
        icon: "⚡",
        color: "cyan"
      },
      {
        metric: "Power Badge",
        value: powerBadge ? 1 : 0,
        maxPoints: 50,
        actualPoints: powerBadge ? 50 : 0,
        description: "Farcaster verified status",
        icon: "⚡",
        color: "yellow"
      },
      {
        metric: "Verified Addresses",
        value: verifiedAddresses.length,
        maxPoints: 50,
        actualPoints: Math.min(verifiedAddresses.length * 10, 50),
        description: "Wallet verification count",
        icon: "🔗",
        color: "pink"
      }
    ]
  }

  const breakdown = calculateBreakdown()
  const totalPoints = breakdown.reduce((sum, item) => sum + item.actualPoints, 0)

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      cyan: "bg-cyan-500",
      yellow: "bg-yellow-500",
      pink: "bg-pink-500"
    }
    return colorMap[color as keyof typeof colorMap] || "bg-gray-500"
  }

  const getProgressColor = (color: string) => {
    const colorMap = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      cyan: "bg-cyan-500",
      yellow: "bg-yellow-500",
      pink: "bg-pink-500"
    }
    return colorMap[color as keyof typeof colorMap] || "bg-gray-500"
  }

  return (
    <Card className={cn("p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-purple-200/50 dark:border-purple-800/50 shadow-xl", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧮</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">Score Breakdown</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-600 hover:text-purple-700"
          >
            {isExpanded ? "Hide" : "Show"} Details
          </Button>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 rounded-lg p-3 border border-purple-200/50 dark:border-purple-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Score</span>
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              {passportData.score}/1000
            </Badge>
          </div>
          <Progress 
            value={(totalPoints / 1000) * 100} 
            className="h-2"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Based on {breakdown.length} reputation factors
          </p>
        </div>

        {/* Expanded Breakdown */}
        {isExpanded && (
          <div className="space-y-3">
            {breakdown.map((item, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.metric}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {Math.floor(item.actualPoints)}/{item.maxPoints}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {typeof item.value === 'number' && item.value % 1 !== 0 
                        ? item.value.toFixed(1) 
                        : item.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <Progress 
                  value={(item.actualPoints / item.maxPoints) * 100} 
                  className="h-1.5 mb-2"
                />
                
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
                
                {/* Additional context for specific metrics */}
                {item.metric === "Followers" && passportData.followers > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Ratio: {(passportData.followers / passportData.following).toFixed(2)}
                    {passportData.following > 0 && (
                      <span className="text-green-600 ml-1">
                        (+{Math.min((passportData.followers / passportData.following) * 10, 50).toFixed(0)} bonus)
                      </span>
                    )}
                  </p>
                )}
                
                {item.metric === "Engagement Rate" && (
                  <p className="text-xs text-gray-500 mt-1">
                    {passportData.casts > 0
                      ? `${(passportData.followers / passportData.casts * 0.1).toFixed(1)}% avg engagement`
                      : "No engagement data available"
                    }
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Trust Indicators */}
        <div className="bg-green-50 dark:bg-green-950/50 rounded-lg p-3 border border-green-200/50 dark:border-green-800/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">✅</span>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Verified Data Sources
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-green-600 dark:text-green-400">
            <div>• Farcaster API</div>
            <div>• Base Network</div>
            <div>• Real-time updates</div>
            <div>• On-chain validation</div>
          </div>
        </div>

        {/* Improvement Suggestions */}
        <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 border border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">💡</span>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Improve Your Score
            </span>
          </div>
          <div className="space-y-1 text-xs text-blue-600 dark:text-blue-400">
            {passportData.followers < 100 && "• Engage more with the community"}
            {passportData.casts < 50 && "• Share more quality content"}
            {passportData.txCount < 10 && "• Participate in Base ecosystem"}
            {passportData.ageDays < 90 && "• Build reputation over time"}
            {passportData.powerBadge === false && "• Apply for Farcaster power badge"}
            {passportData.verifiedAddresses.length < 2 && "• Verify additional wallets"}
          </div>
        </div>
      </div>
    </Card>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface SybilCheckResult {
  isValid: boolean
  riskScore: number
  flags: string[]
  warnings: string[]
  recommendations: string[]
  canMint: boolean
  confidence: "high" | "medium" | "low"
}

interface AntiSybilProtectionProps {
  passportData: {
    fid: number
    username: string
    displayName: string
    followers: number
    following: number
    casts: number
    ageDays: number
    txCount: number
    powerBadge: boolean
    verifiedAddresses: string[]
    engagementRate: number
    custody: string
  }
  walletAddress?: string
  onValidationComplete?: (result: SybilCheckResult) => void
  className?: string
}

export function AntiSybilProtection({ 
  passportData, 
  walletAddress, 
  onValidationComplete,
  className 
}: AntiSybilProtectionProps) {
  const [validationResult, setValidationResult] = useState<SybilCheckResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (passportData.fid && walletAddress) {
      validateSybilResistance()
    }
  }, [passportData.fid, walletAddress])

  const validateSybilResistance = async () => {
    setIsValidating(true)
    
    try {
      // Simulate comprehensive anti-Sybil validation
      const result = performSybilChecks(passportData, walletAddress)
      setValidationResult(result)
      onValidationComplete?.(result)
    } catch (err) {
      console.error("Sybil validation failed:", err)
      // Fail-safe: allow but with warnings
      const fallbackResult: SybilCheckResult = {
        isValid: true,
        riskScore: 50,
        flags: ["Validation error"],
        warnings: ["Could not complete full validation"],
        recommendations: ["Manual review recommended"],
        canMint: true,
        confidence: "low"
      }
      setValidationResult(fallbackResult)
    } finally {
      setIsValidating(false)
    }
  }

  const performSybilChecks = (data: any, address?: string): SybilCheckResult => {
    const flags: string[] = []
    const warnings: string[] = []
    const recommendations: string[] = []
    let riskScore = 0
    let confidence: "high" | "medium" | "low" = "high"

    // 1. Account Age Check
    if (data.ageDays < 7) {
      flags.push("Very new account")
      riskScore += 30
    } else if (data.ageDays < 30) {
      warnings.push("Account created less than 30 days ago")
      riskScore += 15
    }

    // 2. Follower/Following Ratio Check
    if (data.followers > 0 && data.following > 0) {
      const ratio = data.followers / data.following
      if (ratio > 50) {
        flags.push("Unusual follower-to-following ratio")
        riskScore += 25
      } else if (ratio > 20) {
        warnings.push("High follower-to-following ratio")
        riskScore += 10
      }
    }

    // 3. Engagement Quality Check
    if (data.followers > 100 && data.engagementRate < 0.1) {
      flags.push("Low engagement despite high followers")
      riskScore += 20
    }

    // 4. Cast Activity Pattern
    if (data.casts === 0) {
      warnings.push("No cast activity")
      riskScore += 10
    } else if (data.casts < 5 && data.ageDays > 30) {
      warnings.push("Very low cast activity for account age")
      riskScore += 15
    }

    // 5. Transaction History Check
    if (data.txCount === 0) {
      warnings.push("No on-chain transaction history")
      riskScore += 5
    } else if (data.txCount > 1000 && data.ageDays < 30) {
      flags.push("Unusually high transaction volume for new account")
      riskScore += 15
    }

    // 6. Power Badge Verification
    if (data.powerBadge) {
      riskScore -= 15 // Power badge reduces risk
    }

    // 7. Verified Addresses Check
    if (data.verifiedAddresses.length === 0) {
      warnings.push("No verified wallet addresses")
      riskScore += 5
    } else if (data.verifiedAddresses.length > 5) {
      warnings.push("Many verified addresses - verify legitimacy")
      riskScore += 5
    }

    // 8. Username Pattern Check
    if (data.username.match(/^[0-9]+$/)) {
      flags.push("Numeric username pattern")
      riskScore += 10
    } else if (data.username.length < 3) {
      warnings.push("Very short username")
      riskScore += 5
    }

    // 9. Display Name Check
    if (!data.displayName || data.displayName.length < 2) {
      warnings.push("No display name set")
      riskScore += 3
    }

    // 10. Wallet Address Validation (if provided)
    if (address) {
      if (address === "0x0000000000000000000000000000000000000000") {
        flags.push("Invalid wallet address")
        riskScore += 20
      }
      
      // Check if custody address matches connected wallet
      if (data.custody && data.custody !== address) {
        warnings.push("Wallet address doesn't match Farcaster custody")
        riskScore += 10
      }
    }

    // 11. Network Activity Consistency
    const expectedMinActivity = Math.max(1, Math.floor(data.ageDays / 30)) // At least 1 cast per month
    if (data.casts < expectedMinActivity) {
      warnings.push("Activity below expected minimum for account age")
      riskScore += 8
    }

    // Determine final verdict
    let canMint = true
    let isValid = true

    if (riskScore >= 70) {
      canMint = false
      isValid = false
      recommendations.push("Manual review required")
    } else if (riskScore >= 50) {
      canMint = true // Allow but with warnings
      warnings.push("Higher risk account - proceed with caution")
    }

    // Adjust confidence based on data availability
    if (data.ageDays < 30 || data.followers < 10 || data.casts < 5) {
      confidence = "medium"
    }
    if (data.ageDays < 7 || data.followers < 5) {
      confidence = "low"
    }

    return {
      isValid,
      riskScore: Math.min(Math.max(riskScore, 0), 100),
      flags,
      warnings,
      recommendations,
      canMint,
      confidence
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-600"
    if (score >= 50) return "text-yellow-600"
    return "text-green-600"
  }

  const getRiskBadgeColor = (score: number) => {
    if (score >= 70) return "bg-red-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-green-500"
  }

  if (isValidating) {
    return (
      <Card className={cn("p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800", className)}>
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Validating anti-Sybil protection...</span>
        </div>
      </Card>
    )
  }

  if (!validationResult) {
    return null
  }

  return (
    <Card className={cn("p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-purple-200/50 dark:border-purple-800/50 shadow-lg", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">Anti-Sybil Protection</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn(
              "text-white text-xs",
              getRiskBadgeColor(validationResult.riskScore)
            )}>
              {validationResult.riskScore}/100 Risk
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-purple-600 hover:text-purple-700 h-6 w-6 p-0"
            >
              {showDetails ? "−" : "+"}
            </Button>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className={cn(
          "p-3 rounded-lg border",
          validationResult.riskScore >= 70 
            ? "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800"
            : validationResult.riskScore >= 50
            ? "bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800"
            : "bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800"
        )}>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {validationResult.riskScore >= 70 ? "🚫" : validationResult.riskScore >= 50 ? "⚠️" : "✅"}
            </span>
            <div className="flex-1">
              <p className={cn(
                "text-sm font-semibold",
                getRiskColor(validationResult.riskScore)
              )}>
                {validationResult.riskScore >= 70 
                  ? "High Risk - Manual Review Required"
                  : validationResult.riskScore >= 50
                  ? "Medium Risk - Proceed with Caution"
                  : "Low Risk - Account Verified"
                }
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Confidence: {validationResult.confidence.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Critical Flags */}
        {validationResult.flags.length > 0 && (
          <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50">
            <AlertDescription>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  Critical Issues Detected:
                </p>
                {validationResult.flags.map((flag, index) => (
                  <p key={index} className="text-xs text-red-600 dark:text-red-400">
                    • {flag}
                  </p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {validationResult.warnings.length > 0 && (
          <Alert className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/50">
            <AlertDescription>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                  Warnings:
                </p>
                {validationResult.warnings.map((warning, index) => (
                  <p key={index} className="text-xs text-yellow-600 dark:text-yellow-400">
                    • {warning}
                  </p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Detailed Breakdown */}
        {showDetails && (
          <div className="space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Account Age</p>
                <p className="font-medium">{passportData.ageDays} days</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Followers</p>
                <p className="font-medium">{passportData.followers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Cast Activity</p>
                <p className="font-medium">{passportData.casts} casts</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Transactions</p>
                <p className="font-medium">{passportData.txCount}</p>
              </div>
            </div>

            {validationResult.recommendations.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  Recommendations:
                </p>
                {validationResult.recommendations.map((rec, index) => (
                  <p key={index} className="text-xs text-blue-600 dark:text-blue-400">
                    • {rec}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Status */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {validationResult.canMint ? "✅" : "🚫"}
            </span>
            <span className="text-sm font-medium">
              {validationResult.canMint ? "Mint Allowed" : "Mint Blocked"}
            </span>
          </div>
          
          {validationResult.canMint && (
            <Badge variant="outline" className="text-xs">
              Protected by Anti-Sybil
            </Badge>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded p-2">
          <p>
            <strong>Anti-Sybil Protection:</strong> This system analyzes multiple factors to detect 
            potentially fake or spam accounts. High-risk accounts may require manual review.
          </p>
        </div>
      </div>
    </Card>
  )
}
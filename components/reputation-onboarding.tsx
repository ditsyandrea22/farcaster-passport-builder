"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: string
  details: string[]
  example?: {
    metric: string
    value: string
    points: string
  }
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "What is a Reputation Passport?",
    description: "Your on-chain reputation identity powered by Farcaster activity",
    icon: "🎯",
    details: [
      "Generates a unique NFT passport based on your Farcaster activity",
      "Score reflects your authentic engagement and on-chain presence",
      "Mintable on Base network for permanent storage",
      "Shareable across the Farcaster ecosystem"
    ]
  },
  {
    id: 2,
    title: "How We Calculate Your Score",
    description: "Transparent methodology using multiple data points",
    icon: "🧮",
    details: [
      "Followers: Up to 250 points (with diminishing returns)",
      "Engagement Rate: Up to 200 points (quality over quantity)",
      "Account Age: Up to 150 points (up to 2 years)",
      "Cast Activity: Up to 150 points (up to 1,000 casts)",
      "On-chain Activity: Up to 200 points (Base transactions)",
      "Power Badge: +50 points (Farcaster verified)",
      "Verified Addresses: Up to 50 points (wallet verification)"
    ],
    example: {
      metric: "Example Score Breakdown",
      value: "750/1000",
      points: "OG Badge"
    }
  },
  {
    id: 3,
    title: "Data Sources & Validation",
    description: "All data is verified and sourced transparently",
    icon: "🔗",
    details: [
      "Farcaster API: Profile, followers, casts, power badge",
      "Base Network: Transaction count and wallet verification",
      "Real-time updates: Score refreshes with new activity",
      "On-chain validation: All data verifiable on blockchain"
    ]
  },
  {
    id: 4,
    title: "Mint Your NFT Passport",
    description: "One-click minting with transparent costs",
    icon: "⚡",
    details: [
      "Free to generate your reputation score",
      "Small gas fee for minting (~$2-5 Base ETH)",
      "Wallet connection via Farcaster SDK",
      "Automatic sharing to your Farcaster feed"
    ]
  }
]

interface ReputationOnboardingProps {
  onComplete: () => void
  onSkip?: () => void
}

export function ReputationOnboarding({ onComplete, onSkip }: ReputationOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isVisible, setIsVisible] = useState(true)

  const step = onboardingSteps.find(s => s.id === currentStep)!
  const progress = (currentStep / onboardingSteps.length) * 100

  const handleNext = () => {
    if (currentStep < onboardingSteps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsVisible(false)
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    setIsVisible(false)
    onSkip?.()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[80vh] bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Reputation Passport</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-2 bg-white/20" />
            <p className="text-sm text-white/80">
              Step {currentStep} of {onboardingSteps.length}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step Icon and Title */}
          <div className="text-center space-y-3">
            <div className="text-4xl">{step.icon}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {step.description}
              </p>
            </div>
          </div>

          {/* Step Details */}
          <div className="space-y-3">
            {step.details.map((detail, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {detail}
                </p>
              </div>
            ))}
          </div>

          {/* Example Score Breakdown */}
          {step.example && (
            <div className="bg-purple-50 dark:bg-purple-950/50 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {step.example.metric}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {step.example.value}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                    {step.example.points}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Badges Preview */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Available Badges:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "OG", desc: "Power badge + 1 year", color: "from-yellow-500 to-orange-500" },
                  { name: "Onchain", desc: "500+ transactions", color: "from-blue-500 to-cyan-500" },
                  { name: "Active", desc: "1000+ casts + 6 months", color: "from-green-500 to-emerald-500" },
                  { name: "Builder", desc: "3+ verified addresses", color: "from-purple-500 to-pink-500" }
                ].map((badge) => (
                  <div key={badge.name} className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Badge className={cn(`bg-gradient-to-r ${badge.color} text-white text-xs mb-1`)}>
                      {badge.name}
                    </Badge>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{badge.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex-1"
                size="sm"
              >
                Previous
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={cn(
                "flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
                currentStep === 1 && "ml-auto"
              )}
              size="sm"
            >
              {currentStep === onboardingSteps.length ? "Get Started" : "Next"}
            </Button>
          </div>
          
          {currentStep < onboardingSteps.length && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full mt-2 text-gray-500 hover:text-gray-700 text-xs"
              size="sm"
            >
              Skip tutorial
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
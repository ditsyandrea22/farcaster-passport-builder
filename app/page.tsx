"use client"

import { EnhancedPassportGenerator } from "@/components/enhanced-passport-generator"
import { ThemeToggle } from "@/components/theme-toggle"
import { AnalyticsTracker } from "@/components/analytics-tracker"
import { useAnalytics } from "@/components/analytics-tracker"
import { useEffect } from "react"

export default function Home() {
  const { trackFrameView } = useAnalytics()

  // Track frame view when component mounts
  useEffect(() => {
    trackFrameView()
  }, [trackFrameView])

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-100 via-fuchsia-100 to-cyan-100 dark:from-gray-950 dark:via-purple-950 dark:to-indigo-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-400/40 dark:bg-purple-600/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-fuchsia-400/40 dark:bg-blue-600/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-400/40 dark:bg-pink-600/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-balance bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Farcaster Reputation Passport
            </h1>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Your on-chain reputation identity powered by Farcaster + Base
            </p>
          </div>

          <EnhancedPassportGenerator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 animate-fade-in-up">
            <div className="group p-6 bg-white/80 dark:bg-gray-900/80 rounded-xl backdrop-blur-md border border-purple-200/50 dark:border-purple-800/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🎯</div>
              <h3 className="font-semibold mb-2 text-lg">Real Data</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Accurate score from Farcaster activity, engagement, and Base transaction history
              </p>
            </div>
            <div className="group p-6 bg-white/80 dark:bg-gray-900/80 rounded-xl backdrop-blur-md border border-blue-200/50 dark:border-blue-800/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">⚡</div>
              <h3 className="font-semibold mb-2 text-lg">Instant Mint</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Generate and mint your passport NFT on Base network in seconds
              </p>
            </div>
            <div className="group p-6 bg-white/80 dark:bg-gray-900/80 rounded-xl backdrop-blur-md border border-pink-200/50 dark:border-pink-800/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🔗</div>
              <h3 className="font-semibold mb-2 text-lg">Shareable</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Share your reputation score and passport directly to Farcaster
              </p>
            </div>
          </div>

          {/* About Me Section */}
          <div className="mt-16 animate-fade-in-up">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl border border-purple-200/50 dark:border-purple-800/50 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
                <h2 className="text-2xl font-bold text-white mb-2">About Me</h2>
                <p className="text-purple-100">Meet the creator behind this passport builder</p>
              </div>
              
              <div className="p-6">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <img
                      src="/original.webp"
                      alt="lizlabs.eth Profile"
                      className="w-20 h-20 rounded-full border-2 border-white/50 shadow-lg object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      LZ
                    </div>
                  </div>
                  
                  <div className="flex-1 text-left">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      lizlabs.eth
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                      Builder in the Farcaster ecosystem, creating tools that bridge social identity with on-chain reputation.
                      Passionate about decentralized social networks and the future of digital identity.
                    </p>
                    
                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                        🚀 Builder
                      </span>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                        ⛓️ Onchain
                      </span>
                      <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 rounded-full text-sm font-medium">
                        🎯 Farcaster
                      </span>
                    </div>
                    
                    <div className="flex gap-4">
                      <a
                        href="https://farcaster.xyz/lizlabs.eth"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        data-analytics='{"name": "about_section_click", "properties": {"section": "profile_link", "platform": "farcaster"}}'
                      >
                        <span>🌟</span>
                        <span className="font-medium">View on Farcaster</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Tracker */}
      <AnalyticsTracker 
        trackPageViews={true}
        trackClicks={true}
        events={["homepage_view"]}
      />
    </main>
  )
}

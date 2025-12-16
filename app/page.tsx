"use client"

import dynamicImport from 'next/dynamic'
import { ThemeToggle } from "@/components/theme-toggle"
import { WalletErrorHandler } from "@/components/wallet-error-handler"
import { TimeoutWrapper } from "@/components/timeout-wrapper"
import { EnhancedErrorBoundary } from "@/components/enhanced-error-boundary"

// Dynamic import to avoid SSR issues with Frame hooks
const MiniAppOptimizedPassportGenerator = dynamicImport(
  () => import('@/components/miniapp-optimized-passport-generator').then(mod => ({ default: mod.MiniAppOptimizedPassportGenerator })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="text-sm text-muted-foreground">Loading enhanced passport generator...</p>
        </div>
      </div>
    )
  }
)

const ReputationLeaderboard = dynamicImport(
  () => import('@/components/reputation-leaderboard').then(mod => ({ default: mod.ReputationLeaderboard })),
  { ssr: false }
)

const AnalyticsTracker = dynamicImport(
  () => import('@/components/analytics-tracker').then(mod => ({ default: mod.AnalyticsTracker })),
  { ssr: false }
)

// Disable static optimization for this page due to Frame hooks
export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <EnhancedErrorBoundary>
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-100 via-fuchsia-100 to-cyan-100 dark:from-gray-950 dark:via-purple-950 dark:to-indigo-950">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-400/40 dark:bg-purple-600/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-fuchsia-400/40 dark:bg-blue-600/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-400/40 dark:bg-pink-600/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>

        <div className="relative container mx-auto px-4 py-8 md:py-16">
          <div className="max-w-6xl mx-auto text-center space-y-6 md:space-y-8">
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-balance bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                Farcaster Reputation Passport
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground text-balance max-w-3xl mx-auto px-4">
                Your on-chain reputation identity powered by Farcaster + Base with transparent scoring, anti-Sybil protection, and social features
              </p>
            </div>

            {/* Enhanced Features Banner */}
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl border border-purple-200/50 dark:border-purple-800/50 shadow-2xl p-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                ✨ Enhanced Features Now Available
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-lg">
                  <div className="text-2xl mb-2">🎯</div>
                  <h3 className="font-semibold text-sm mb-1">Transparent Scoring</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Real-time breakdown of reputation calculation</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg">
                  <div className="text-2xl mb-2">🛡️</div>
                  <h3 className="font-semibold text-sm mb-1">Anti-Sybil Protection</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Multi-factor abuse resistance system</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-lg">
                  <div className="text-2xl mb-2">⛽</div>
                  <h3 className="font-semibold text-sm mb-1">Gas Transparency</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Real-time fee estimation and network status</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-950/50 rounded-lg">
                  <div className="text-2xl mb-2">🏆</div>
                  <h3 className="font-semibold text-sm mb-1">Social Features</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Leaderboards and user rankings</p>
                </div>
              </div>
            </div>

            {/* Main Enhanced Generator */}
            <TimeoutWrapper timeoutMs={15000}>
              <MiniAppOptimizedPassportGenerator />
            </TimeoutWrapper>

            {/* Wallet Error Handler */}
            <WalletErrorHandler />

            {/* Enhanced Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12 animate-fade-in-up px-4">
              <div className="group p-4 md:p-6 bg-white/80 dark:bg-gray-900/80 rounded-xl backdrop-blur-md border border-purple-200/50 dark:border-purple-800/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-3xl md:text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🎯</div>
                <h3 className="font-semibold mb-2 text-base md:text-lg">Transparent Methodology</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  See exactly how your reputation score is calculated with real-time breakdown of all factors
                </p>
              </div>
              <div className="group p-4 md:p-6 bg-white/80 dark:bg-gray-900/80 rounded-xl backdrop-blur-md border border-blue-200/50 dark:border-blue-800/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-3xl md:text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">⚡</div>
                <h3 className="font-semibold mb-2 text-base md:text-lg">Enhanced Wallet Flow</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Real-time gas estimation, network status, and transparent transaction costs
                </p>
              </div>
              <div className="group p-4 md:p-6 bg-white/80 dark:bg-gray-900/80 rounded-xl backdrop-blur-md border border-green-200/50 dark:border-green-800/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-3xl md:text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🛡️</div>
                <h3 className="font-semibold mb-2 text-base md:text-lg">Anti-Abuse System</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Multi-factor Sybil detection protects reputation integrity and prevents manipulation
                </p>
              </div>
              <div className="group p-4 md:p-6 bg-white/80 dark:bg-gray-900/80 rounded-xl backdrop-blur-md border border-pink-200/50 dark:border-pink-800/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-3xl md:text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🏆</div>
                <h3 className="font-semibold mb-2 text-base md:text-lg">Social Rankings</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Compare your reputation with others on interactive leaderboards and rankings
                </p>
              </div>
              <div className="group p-4 md:p-6 bg-white/80 dark:bg-gray-900/80 rounded-xl backdrop-blur-md border border-yellow-200/50 dark:border-yellow-800/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-3xl md:text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🔗</div>
                <h3 className="font-semibold mb-2 text-base md:text-lg">Enhanced Sharing</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Share your reputation passport directly to Farcaster with rich previews
                </p>
              </div>
              <div className="group p-4 md:p-6 bg-white/80 dark:bg-gray-900/80 rounded-xl backdrop-blur-md border border-red-200/50 dark:border-red-800/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-3xl md:text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">⚠️</div>
                <h3 className="font-semibold mb-2 text-base md:text-lg">Error Recovery</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Comprehensive error handling with automatic recovery and user-friendly messages
                </p>
              </div>
            </div>

            {/* Leaderboard Section */}
            <div className="mt-12 md:mt-16 animate-fade-in-up px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                🏆 Reputation Leaderboard
              </h2>
              <div className="max-w-4xl mx-auto">
                <ReputationLeaderboard 
                  compact={false}
                  onUserClick={(fid) => {
                    console.log('User clicked:', fid)
                    // In a real app, this would navigate to user profile
                  }}
                />
              </div>
            </div>

            {/* Enhanced About Section */}
            <div className="mt-12 md:mt-16 animate-fade-in-up px-4">
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl border border-purple-200/50 dark:border-purple-800/50 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 md:p-6">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2">About the Enhanced System</h2>
                  <p className="text-purple-100 text-sm md:text-base">Built with comprehensive improvements for security, transparency, and user experience</p>
                </div>
                
                <div className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                    <div className="flex-shrink-0 self-center sm:self-start">
                      <img
                        src="/original.webp"
                        alt="lizlabs.eth Profile"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/50 shadow-lg object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg">
                        LZ
                      </div>
                    </div>
                    
                    <div className="flex-1 text-left w-full">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        lizlabs.eth
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed text-sm md:text-base">
                        Enhanced the Farcaster Reputation Passport with comprehensive improvements including transparent scoring methodology, anti-Sybil protection, gas fee transparency, social features, and robust error handling. Building the future of on-chain social reputation.
                      </p>
                      
                      <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
                        <span className="px-2 md:px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-xs md:text-sm font-medium">
                          🚀 Enhanced Builder
                        </span>
                        <span className="px-2 md:px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs md:text-sm font-medium">
                          🛡️ Security Focus
                        </span>
                        <span className="px-2 md:px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-xs md:text-sm font-medium">
                          🎯 UX Optimized
                        </span>
                        <span className="px-2 md:px-3 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 rounded-full text-xs md:text-sm font-medium">
                          📚 Well Documented
                        </span>
                      </div>
                      
                      <div className="flex justify-center sm:justify-start">
                        <a
                          href="https://farcaster.xyz/lizlabs.eth"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm md:text-base"
                          data-analytics='{"name": "about_section_click", "properties": {"section": "profile_link", "platform": "farcaster"}}'
                        >
                          <span>🌟</span>
                          <span className="font-medium">View Enhanced System</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Improvements Summary */}
            <div className="mt-12 md:mt-16 animate-fade-in-up px-4">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-950/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                  🔧 Technical Improvements
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✨ New Components</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• ReputationOnboarding - Step-by-step tutorial</li>
                      <li>• ScoringBreakdown - Transparent score calculation</li>
                      <li>• AntiSybilProtection - Multi-factor abuse detection</li>
                      <li>• EnhancedWalletWithGasInfo - Gas transparency</li>
                      <li>• ReputationLeaderboard - Social rankings</li>
                      <li>• EnhancedErrorBoundary - Robust error handling</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📚 Documentation</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Developer Guide - Complete technical documentation</li>
                      <li>• Testing Guide - Comprehensive testing strategies</li>
                      <li>• Improvements Summary - All changes documented</li>
                      <li>• API Documentation - Endpoint specifications</li>
                      <li>• Architecture Guide - Component relationships</li>
                      <li>• Security Documentation - Anti-Sybil details</li>
                    </ul>
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
          events={["homepage_view", "enhanced_features_view"]}
        />
      </main>
    </EnhancedErrorBoundary>
  )
}

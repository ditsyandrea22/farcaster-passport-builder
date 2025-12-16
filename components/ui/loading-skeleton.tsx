"use client"

import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  lines?: number
  showAvatar?: boolean
  showStats?: boolean
  variant?: "passport" | "card" | "simple"
}

export function LoadingSkeleton({ 
  className, 
  lines = 3, 
  showAvatar = false, 
  showStats = false,
  variant = "passport" 
}: LoadingSkeletonProps) {
  if (variant === "simple") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse"
            style={{
              animationDelay: `${i * 200}ms`,
              animationDuration: '1.5s'
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === "card") {
    return (
      <div className={cn("p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-purple-200/50 dark:border-purple-800/50 shadow-xl rounded-lg", className)}>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
            </div>
          </div>
          {showStats && (
            <div className="grid grid-cols-2 gap-4 pt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto animate-pulse" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Passport variant
  return (
    <div className={cn("p-8 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white shadow-2xl border-0 overflow-hidden relative rounded-xl", className)}>
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
        {/* Header section */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            {showAvatar && (
              <div className="w-16 h-16 bg-white/30 rounded-full animate-pulse" />
            )}
            <div className="flex-1 space-y-2">
              <div className="h-8 bg-white/30 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-white/20 rounded w-1/2 animate-pulse" />
              <div className="h-3 bg-white/20 rounded w-1/3 animate-pulse" />
            </div>
          </div>
          <div className="w-20 h-8 bg-white/30 rounded-full animate-pulse" />
        </div>

        {/* Score section */}
        <div className="py-8 border-y border-white/20 bg-white/5 rounded-xl">
          <div className="w-32 h-16 bg-white/30 rounded mx-auto mb-4 animate-pulse" />
          <div className="h-6 bg-white/20 rounded w-48 mx-auto animate-pulse" />
          <div className="h-4 bg-white/20 rounded w-32 mx-auto mt-2 animate-pulse" />
        </div>

        {/* Stats section */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="h-8 bg-white/30 rounded mb-2 animate-pulse" />
                <div className="h-4 bg-white/20 rounded w-2/3 mx-auto animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="pt-4 space-y-2">
          <div className="w-full h-12 bg-white/30 rounded-lg animate-pulse" />
          <div className="w-full h-12 bg-white/20 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  return (
    <div className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-purple-600", sizeClasses[size], className)} />
  )
}

interface LoadingStateProps {
  isLoading: boolean
  error?: string | null
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

export function LoadingState({ isLoading, error, children, fallback, className }: LoadingStateProps) {
  if (error) {
    return (
      <div className={cn("p-6 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg", className)}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <span className="text-xl">⚠️</span>
          <div>
            <h3 className="font-semibold">Something went wrong</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {fallback || (
          <>
            <LoadingSkeleton variant="card" />
            <LoadingSkeleton variant="passport" showAvatar showStats />
          </>
        )}
      </div>
    )
  }

  return <>{children}</>
}
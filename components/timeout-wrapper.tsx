"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface TimeoutWrapperProps {
  children: React.ReactNode
  timeoutMs?: number
  fallback?: React.ReactNode
}

export function TimeoutWrapper({ 
  children, 
  timeoutMs = 15000, // 15 seconds default timeout
  fallback 
}: TimeoutWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  useEffect(() => {
    // Set timeout
    const timeoutId = setTimeout(() => {
      console.warn("Component loading timed out after", timeoutMs, "ms")
      setIsLoading(false)
      setHasTimedOut(true)
    }, timeoutMs)

    // Component mounted successfully
    const mountedId = setTimeout(() => {
      setIsLoading(false)
    }, 100) // Give components 100ms to mount

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(mountedId)
    }
  }, [timeoutMs])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="text-sm text-muted-foreground">Loading components...</p>
        </div>
      </div>
    )
  }

  if (hasTimedOut) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Card className="p-6 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
              Loading Timeout
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
              The component is taking longer than expected to load. This might be due to network issues or missing dependencies.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                🔄 Reload Page
              </Button>
              <Button
                onClick={() => setHasTimedOut(false)}
                variant="outline"
                size="sm"
                className="border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return <>{children}</>
}
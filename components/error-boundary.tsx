"use client"

import React, { Component, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo)
    this.setState({
      error,
      errorInfo
    })

    // Log error to analytics in production
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false
      })
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-100 via-fuchsia-100 to-cyan-100 dark:from-gray-950 dark:via-purple-950 dark:to-indigo-950">
          <Card className="max-w-md w-full p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-red-200 dark:border-red-800">
            <div className="text-center space-y-4">
              <div className="text-6xl">😵</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  We're sorry for the inconvenience. Please try refreshing the page.
                </p>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs">
                  <summary className="cursor-pointer font-semibold mb-2">Error Details</summary>
                  <pre className="whitespace-pre-wrap text-red-600 dark:text-red-400">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="space-y-2">
                <Button 
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  🔄 Refresh Page
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="w-full"
                >
                  🏠 Go Home
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                If the problem persists, please contact support.
              </p>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
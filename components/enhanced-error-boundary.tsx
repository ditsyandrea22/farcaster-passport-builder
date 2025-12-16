"use client"

import { Component, ErrorInfo, ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  enableRetry?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  retryCount: number
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      retryCount: 0
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo)

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Report to analytics/monitoring service (if configured)
    this.reportError(error, errorInfo)
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to your error reporting service
    // e.g., Sentry, LogRocket, etc.
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    console.log("Error Report:", errorReport)

    // Example: Send to error reporting service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // })
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private getErrorType = (error: Error): string => {
    if (error.message.includes("Network")) return "Network Error"
    if (error.message.includes("Wallet")) return "Wallet Error"
    if (error.message.includes("Frame")) return "Frame Error"
    if (error.message.includes("API")) return "API Error"
    return "Application Error"
  }

  private getErrorSeverity = (error: Error): "low" | "medium" | "high" => {
    if (error.message.includes("Network") || error.message.includes("timeout")) return "medium"
    if (error.message.includes("Frame") || error.message.includes("wallet")) return "high"
    return "low"
  }

  private getSuggestions = (error: Error): string[] => {
    const suggestions: string[] = []

    if (error.message.includes("Network")) {
      suggestions.push("Check your internet connection")
      suggestions.push("Try refreshing the page")
      suggestions.push("Wait a moment and try again")
    }

    if (error.message.includes("Wallet")) {
      suggestions.push("Make sure your wallet is connected")
      suggestions.push("Check if you're in a Farcaster frame")
      suggestions.push("Try disconnecting and reconnecting your wallet")
    }

    if (error.message.includes("Frame")) {
      suggestions.push("This feature works best in Farcaster")
      suggestions.push("Open this app in a Farcaster frame")
      suggestions.push("Check if Farcaster is properly loaded")
    }

    if (error.message.includes("API")) {
      suggestions.push("The service might be temporarily unavailable")
      suggestions.push("Try again in a few minutes")
      suggestions.push("Contact support if the issue persists")
    }

    if (suggestions.length === 0) {
      suggestions.push("Try refreshing the page")
      suggestions.push("Check the browser console for more details")
      suggestions.push("Contact support with the error details")
    }

    return suggestions
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const error = this.state.error!
      const errorType = this.getErrorType(error)
      const errorSeverity = this.getErrorSeverity(error)
      const suggestions = this.getSuggestions(error)
      const canRetry = this.state.retryCount < this.maxRetries

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 shadow-lg">
            <div className="p-6 space-y-6">
              {/* Error Icon and Title */}
              <div className="text-center space-y-3">
                <div className="text-4xl">
                  {errorSeverity === "high" ? "🚨" : errorSeverity === "medium" ? "⚠️" : "🛠️"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Oops! Something went wrong
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    We encountered an unexpected error
                  </p>
                </div>
              </div>

              {/* Error Details */}
              <Alert className={
                errorSeverity === "high" 
                  ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50"
                  : errorSeverity === "medium"
                  ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/50"
                  : "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50"
              }>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={
                      errorSeverity === "high" 
                        ? "border-red-300 text-red-700"
                        : errorSeverity === "medium"
                        ? "border-yellow-300 text-yellow-700"
                        : "border-blue-300 text-blue-700"
                    }>
                      {errorType}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Attempt {this.state.retryCount + 1}/{this.maxRetries + 1}
                    </span>
                  </div>
                  <AlertDescription className="text-sm">
                    <strong>Error:</strong> {error.message}
                  </AlertDescription>
                  {process.env.NODE_ENV === "development" && error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                        Stack trace (dev only)
                      </summary>
                      <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </Alert>

              {/* Suggestions */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                  💡 Try these solutions:
                </h3>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {this.props.enableRetry !== false && canRetry && (
                    <Button
                      onClick={this.handleRetry}
                      variant="outline"
                      className="flex-1"
                      size="sm"
                    >
                      🔄 Try Again
                    </Button>
                  )}
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    🔃 Reload Page
                  </Button>
                </div>

                {(!this.props.enableRetry || !canRetry) && (
                  <Button
                    onClick={this.handleReload}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover-to-blue-700"
                    size="sm"
                  >
                    🔃 Reload Page
                  </Button>
                )}

                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const errorReport = {
                        message: error.message,
                        stack: error.stack,
                        timestamp: new Date().toISOString(),
                        url: window.location.href
                      }
                      const mailtoLink = `mailto:support@example.com?subject=Reputation Passport Error&body=${encodeURIComponent(
                        JSON.stringify(errorReport, null, 2)
                      )}`
                      window.open(mailtoLink)
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    📧 Report this error
                  </Button>
                </div>
              </div>

              {/* Help Text */}
              <div className="text-xs text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded p-3 border border-gray-200 dark:border-gray-700">
                <p>
                  <strong>Need help?</strong> If this error keeps happening, 
                  please contact support with the error details above.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for error handling in components
export function useErrorHandler() {
  return {
    handleError: (error: Error, context?: string) => {
      console.error(`Error in ${context || 'component'}:`, error)
      // In a real app, you might want to send this to an error reporting service
    },
    reportError: (error: Error, metadata?: Record<string, any>) => {
      // Enhanced error reporting with metadata
      console.error("Reported error:", {
        error: error.message,
        stack: error.stack,
        metadata,
        timestamp: new Date().toISOString(),
        url: window.location.href
      })
    }
  }
}
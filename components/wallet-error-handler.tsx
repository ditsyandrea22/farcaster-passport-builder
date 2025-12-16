"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Shield, RefreshCw } from "lucide-react"

interface WalletConflictError {
  type: 'ethereum-conflict' | 'zerion-conflict' | 'origin-mismatch' | 'csp-violation'
  message: string
  details?: string
  timestamp: number
}

export function WalletErrorHandler() {
  const [conflicts, setConflicts] = useState<WalletConflictError[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Set up error detection
    const detectConflicts = () => {
      const detectedConflicts: WalletConflictError[] = []

      // Check for window.ethereum conflicts - only report if it's actually causing issues
      try {
        if (typeof window !== 'undefined') {
          const ethereumDescriptor = Object.getOwnPropertyDescriptor(window, 'ethereum')
          if (ethereumDescriptor && !ethereumDescriptor.configurable) {
            // Only report if we don't have our own protection active
            const hasOurProtection = ethereumDescriptor.get && ethereumDescriptor.get.toString().includes('safeEthereum')
            if (!hasOurProtection) {
              detectedConflicts.push({
                type: 'ethereum-conflict',
                message: 'External wallet provider detected',
                details: 'window.ethereum is read-only, preventing proper FarCaster wallet integration',
                timestamp: Date.now()
              })
            }
          }
        }
      } catch (error) {
        // Silently ignore
      }

      // Check for Zerion conflicts - only report if it's actually problematic
      try {
        if (typeof window !== 'undefined' && (window as any).isZerion) {
          // Check if our protection is already handling this
          const hasProtection = typeof (window as any).ethereum !== 'undefined' &&
                               Object.getOwnPropertyDescriptor(window, 'ethereum')?.configurable === false
          if (!hasProtection) {
            detectedConflicts.push({
              type: 'zerion-conflict',
              message: 'Zerion wallet injection detected',
              details: 'External wallet is conflicting with FarCaster wallet',
              timestamp: Date.now()
            })
          }
        }
      } catch (error) {
        // Silently ignore
      }

      // Check for CSP violations in console
      const originalError = console.error
      console.error = function(...args) {
        const message = args.join(' ')
        if (message.includes('Content Security Policy') || message.includes('CSP')) {
          detectedConflicts.push({
            type: 'csp-violation',
            message: 'Content Security Policy blocking external connections',
            details: 'External APIs are being blocked by CSP configuration',
            timestamp: Date.now()
          })
        }
        originalError.apply(console, args)
      }

      // Check for origin mismatches
      window.addEventListener('message', (event) => {
        if (event.data && typeof event.data === 'object') {
          const dataString = JSON.stringify(event.data)
          if (event.data.type === 'ORIGIN_MISMATCH' ||
              dataString.includes('origins don\'t match') ||
              dataString.includes('origin provided')) {
            detectedConflicts.push({
              type: 'origin-mismatch',
              message: 'Frame origin communication issue',
              details: 'Parent and iframe origins are not matching properly',
              timestamp: Date.now()
            })
          }
        }
      })

      if (detectedConflicts.length > 0) {
        setConflicts(prev => [...prev, ...detectedConflicts])
        setIsVisible(true)
      }
    }

    // Run detection after a delay to let other scripts load
    setTimeout(detectConflicts, 2000)

    // Set up periodic checking
    const interval = setInterval(detectConflicts, 10000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setConflicts([])
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (!isVisible || conflicts.length === 0) {
    return null
  }

  const criticalConflicts = conflicts.filter(c => 
    c.type === 'ethereum-conflict' || c.type === 'zerion-conflict'
  )

  if (criticalConflicts.length === 0) {
    return null // Don't show warnings for non-critical issues
  }

  return (
    <Card className="p-4 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
            Wallet Integration Issue Detected
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
            External wallet conflicts detected. This may affect wallet functionality.
          </p>
          
          {criticalConflicts.length > 0 && (
            <div className="space-y-1 mb-3">
              {criticalConflicts.map((conflict, index) => (
                <div key={index} className="text-xs text-amber-600 dark:text-amber-400">
                  • {conflict.message}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              className="text-xs h-7 bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900"
            >
              <Shield className="h-3 w-3 mr-1" />
              Continue Anyway
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="text-xs h-7 bg-white dark:bg-gray-800 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-gray-700"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Hook for components to check wallet status
export function useWalletStatus() {
  const [hasConflicts, setHasConflicts] = useState(false)
  const [isProtected, setIsProtected] = useState(false)

  useEffect(() => {
    const checkStatus = () => {
      try {
        // Check if our protection is active
        const ethereumDescriptor = Object.getOwnPropertyDescriptor(window, 'ethereum')
        setIsProtected(!!ethereumDescriptor && !ethereumDescriptor.configurable)

        // Check for external conflicts
        const hasExternalWallet = !!(window as any).isZerion || !!(window as any).isMetaMask
        setHasConflicts(hasExternalWallet && !ethereumDescriptor)

      } catch (error) {
        // Silently handle
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  return {
    hasConflicts,
    isProtected,
    canUseWallet: !hasConflicts || isProtected
  }
}
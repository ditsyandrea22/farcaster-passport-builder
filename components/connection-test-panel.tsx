"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'failed' | 'warning'
  message: string
  details?: any
}

export function ConnectionTestPanel() {
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'success' | 'partial' | 'failed'>('idle')

  const runTests = async () => {
    setIsRunning(true)
    setOverallStatus('running')
    const results: TestResult[] = []

    try {
      // Test 1: Window Ethereum Protection
      results.push({
        name: 'Window Ethereum Protection',
        status: 'pending',
        message: 'Testing...'
      })
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      try {
        const ethereum = (window as any).ethereum
        const isProtected = ethereum && ethereum.isFarcaster
        results[0] = {
          name: 'Window Ethereum Protection',
          status: isProtected ? 'success' : 'warning',
          message: isProtected ? 'Protected wallet interface active' : 'No protected wallet interface found',
          details: { hasEthereum: !!ethereum, isFarcaster: ethereum?.isFarcaster }
        }
      } catch (error) {
        results[0] = {
          name: 'Window Ethereum Protection',
          status: 'failed',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }

      // Test 2: Cross-Origin Communication
      results.push({
        name: 'Cross-Origin Communication',
        status: 'pending',
        message: 'Testing...'
      })

      await new Promise(resolve => setTimeout(resolve, 300))

      try {
        if (typeof window !== 'undefined' && (window as any).crossOriginComm) {
          const allowedOrigins = (window as any).crossOriginComm.getAllowedOrigins()
          results[1] = {
            name: 'Cross-Origin Communication',
            status: allowedOrigins.length > 0 ? 'success' : 'warning',
            message: `${allowedOrigins.length} allowed origins configured`,
            details: { allowedOrigins }
          }
        } else {
          results[1] = {
            name: 'Cross-Origin Communication',
            status: 'warning',
            message: 'Cross-origin communication not available'
          }
        }
      } catch (error) {
        results[1] = {
          name: 'Cross-Origin Communication',
          status: 'failed',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }

      // Test 3: Error Handler
      results.push({
        name: 'Enhanced Error Handler',
        status: 'pending',
        message: 'Testing...'
      })

      await new Promise(resolve => setTimeout(resolve, 300))

      try {
        if (typeof window !== 'undefined' && (window as any).enhancedErrorHandler) {
          const stats = (window as any).enhancedErrorHandler.getErrorStats()
          results[2] = {
            name: 'Enhanced Error Handler',
            status: 'success',
            message: 'Error handler active',
            details: { errorStats: stats }
          }
        } else {
          results[2] = {
            name: 'Enhanced Error Handler',
            status: 'warning',
            message: 'Enhanced error handler not available'
          }
        }
      } catch (error) {
        results[2] = {
          name: 'Enhanced Error Handler',
          status: 'failed',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }

      // Test 4: Wallet Detection
      results.push({
        name: 'Wallet Detection',
        status: 'pending',
        message: 'Testing...'
      })

      await new Promise(resolve => setTimeout(resolve, 300))

      try {
        const farcaster = (window as any).farcaster
        const hasWallet = !!(farcaster?.wallet?.address)
        const walletAddress = farcaster?.wallet?.address || null
        
        results[3] = {
          name: 'Wallet Detection',
          status: hasWallet ? 'success' : 'warning',
          message: hasWallet ? `Wallet detected: ${walletAddress?.slice(0, 6)}...` : 'No wallet detected',
          details: { 
            hasFarcaster: !!farcaster,
            hasWallet,
            walletAddress,
            chainId: farcaster?.wallet?.chainId
          }
        }
      } catch (error) {
        results[3] = {
          name: 'Wallet Detection',
          status: 'failed',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }

      // Test 5: Unified Wallet Manager
      results.push({
        name: 'Unified Wallet Manager',
        status: 'pending',
        message: 'Testing...'
      })

      await new Promise(resolve => setTimeout(resolve, 300))

      try {
        if (typeof window !== 'undefined' && (window as any).unifiedWalletManager) {
          const state = (window as any).unifiedWalletManager.getCurrentState()
          results[4] = {
            name: 'Unified Wallet Manager',
            status: state ? 'success' : 'warning',
            message: state?.isConnected ? 'Wallet connected via unified manager' : 'Unified manager active (no wallet)',
            details: { state }
          }
        } else {
          results[4] = {
            name: 'Unified Wallet Manager',
            status: 'warning',
            message: 'Unified wallet manager not available'
          }
        }
      } catch (error) {
        results[4] = {
          name: 'Unified Wallet Manager',
          status: 'failed',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }

      // Test 6: PostMessage Communication
      results.push({
        name: 'PostMessage Communication',
        status: 'pending',
        message: 'Testing...'
      })

      await new Promise(resolve => setTimeout(resolve, 300))

      try {
        // Test if we can send a message without errors
        const testMessage = {
          type: 'TEST_MESSAGE',
          timestamp: Date.now(),
          test: true
        }
        
        // Try to post to parent if in iframe
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(testMessage, '*')
          results[5] = {
            name: 'PostMessage Communication',
            status: 'success',
            message: 'PostMessage functionality available'
          }
        } else {
          results[5] = {
            name: 'PostMessage Communication',
            status: 'warning',
            message: 'Not in iframe environment'
          }
        }
      } catch (error) {
        results[5] = {
          name: 'PostMessage Communication',
          status: 'failed',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }

      setTestResults(results)

      // Determine overall status
      const successCount = results.filter(r => r.status === 'success').length
      const failedCount = results.filter(r => r.status === 'failed').length
      
      if (failedCount === 0) {
        setOverallStatus(successCount === results.length ? 'success' : 'partial')
      } else {
        setOverallStatus('failed')
      }

    } catch (error) {
      console.error('Test suite failed:', error)
      setOverallStatus('failed')
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'failed': return '❌'
      default: return '⏳'
    }
  }

  useEffect(() => {
    // Auto-run tests on component mount
    runTests()
  }, [])

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">🔧 Connection Test Panel</h3>
        <div className="flex items-center gap-2">
          {overallStatus === 'running' && <LoadingSpinner size="sm" />}
          <Badge variant={overallStatus === 'success' ? 'default' : overallStatus === 'partial' ? 'secondary' : 'destructive'}>
            {overallStatus === 'running' ? 'Running...' : 
             overallStatus === 'success' ? 'All Systems OK' :
             overallStatus === 'partial' ? 'Some Issues' :
             overallStatus === 'failed' ? 'Problems Found' : 'Ready'}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {testResults.map((result, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <span className="text-lg">{getStatusIcon(result.status)}</span>
              <div>
                <p className="font-medium">{result.name}</p>
                <p className="text-sm text-muted-foreground">{result.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(result.status)}`} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newResults = [...testResults]
                  newResults[index].status = 'pending'
                  setTestResults(newResults)
                  runTests()
                }}
                disabled={isRunning}
              >
                Retest
              </Button>
            </div>
          </div>
        ))}
      </div>

      {testResults.length > 0 && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Test Results: {testResults.filter(r => r.status === 'success').length} passed, 
              {testResults.filter(r => r.status === 'warning').length} warnings, 
              {testResults.filter(r => r.status === 'failed').length} failed
            </p>
            <Button
              onClick={runTests}
              disabled={isRunning}
              variant="outline"
              size="sm"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
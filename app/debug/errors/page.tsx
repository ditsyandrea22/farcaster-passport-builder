"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SafeDialogContent } from "@/components/ui/dialog-accessibility"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Icon } from "@/src/components/common/Icon"
import { errorHandler, logWalletError, logFrameError, logNetworkError, logUIError } from "@/lib/error-handler"

export default function ErrorDebugPage() {
  const [errorSummary, setErrorSummary] = useState<any>(null)
  const [showTestDialog, setShowTestDialog] = useState(false)

  useEffect(() => {
    // Initialize error handler
    if (typeof window !== 'undefined') {
      errorHandler.setNoiseReduction(true)
      
      // Get initial error summary
      setErrorSummary(errorHandler.getErrorSummary())
    }
  }, [])

  const generateTestErrors = () => {
    // Test different types of errors
    logWalletError("Test wallet error - window.ethereum conflict")
    logFrameError("Test frame error - origin mismatch")
    logNetworkError("Test network error - CSP violation")
    logUIError("Test UI error - SVG attribute invalid")
    
    // Simulate some of the original errors
    try {
      throw new Error("Cannot set property ethereum of #<Window> which has only a getter")
    } catch (error) {
      console.error(error)
    }

    // Update summary
    setErrorSummary(errorHandler.getErrorSummary())
  }

  const testSVGValidation = () => {
    // Test SVG with different size values
    const sizes = ["small", "24", "32", "large"]
    
    sizes.forEach(size => {
      try {
        // This would normally cause SVG validation errors
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        svg.setAttribute("width", size)
        svg.setAttribute("height", size)
        console.log(`SVG size test: ${size} - ${svg.getAttribute("width")}x${svg.getAttribute("height")}`)
      } catch (error) {
        console.error(`SVG validation error for size "${size}":`, error)
      }
    })
  }

  const testDialogAccessibility = () => {
    setShowTestDialog(true)
  }

  const clearErrors = () => {
    errorHandler.clearErrors()
    setErrorSummary(errorHandler.getErrorSummary())
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🛠️ Error Handling Debug Page</h1>
        <p className="text-muted-foreground">
          Testing and demonstrating the enhanced error handling system
        </p>
      </div>

      {/* Error Summary */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">📊 Error Summary</h2>
        {errorSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium">By Type</h3>
              <ul className="text-sm space-y-1">
                {Object.entries(errorSummary.byType).map(([type, count]) => (
                  <li key={type}>{type}: {count as number}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium">By Severity</h3>
              <ul className="text-sm space-y-1">
                {Object.entries(errorSummary.bySeverity).map(([severity, count]) => (
                  <li key={severity}>{severity}: {count as number}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium">Recent Errors</h3>
              <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                {errorSummary.recent.map((error: any, index: number) => (
                  <li key={index} className="truncate" title={error.message}>
                    {error.type}: {error.message.substring(0, 30)}...
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Card>

      {/* Test Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🧪 Test Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Button onClick={generateTestErrors} className="w-full">
              Generate Test Errors
            </Button>
            <Button onClick={testSVGValidation} variant="outline" className="w-full">
              Test SVG Validation
            </Button>
          </div>
          <div className="space-y-4">
            <Button onClick={testDialogAccessibility} variant="outline" className="w-full">
              Test Dialog Accessibility
            </Button>
            <Button onClick={clearErrors} variant="destructive" className="w-full">
              Clear All Errors
            </Button>
          </div>
        </div>
      </Card>

      {/* Component Tests */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🎨 Component Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Icon Component Tests</h3>
            <div className="flex items-center gap-4 flex-wrap">
              <Icon width={24} height={24} />
              <Icon width="32" height="32" />
              <Icon width="large" height="large" />
              <Icon width="sm" height="sm" />
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Error Handler Status</h3>
            <div className="text-sm space-y-1">
              <p>Noise Reduction: {errorHandler?.isNoiseReductionEnabled() ? "Enabled" : "Disabled"}</p>
              <p>Total Errors: {errorSummary?.total || 0}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogTrigger asChild>
          <Button variant="outline">Open Accessible Dialog</Button>
        </DialogTrigger>
        <SafeDialogContent 
          title="Test Accessible Dialog"
          description="This dialog demonstrates proper accessibility attributes"
          className="max-w-md"
        >
          <div className="space-y-4">
            <p>This dialog has proper title and description for screen readers.</p>
            <div className="flex gap-2">
              <Button onClick={() => setShowTestDialog(false)}>Close</Button>
              <Button variant="outline">Action</Button>
            </div>
          </div>
        </SafeDialogContent>
      </Dialog>

      {/* Status Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">✅ Fixed Issues Status</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>CSP violations for WalletConnect API calls</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Wallet conflict manager improvements</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>SVG attribute validation errors</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Dialog accessibility components</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Origin mismatch error handling</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Enhanced error handling and noise reduction</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
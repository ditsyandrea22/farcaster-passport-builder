"use client"

import { useEffect, useState } from "react"

export default function DebugPage() {
  const [sdkInfo, setSdkInfo] = useState<any>({})
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    // Check all possible SDK locations
    const info: any = {
      timestamp: new Date().toISOString(),
      windowFarcaster: !!(window as any).farcaster,
      windowFarcasterSDK: !!(window as any).farcaster?.sdk,
      windowFarcasterSDKActions: !!(window as any).farcaster?.sdk?.actions,
      windowFarcasterSDKReady: !!(window as any).farcaster?.sdk?.actions?.ready,
      windowFarcasterSDKContext: (window as any).farcaster?.sdk?.context,
      window__FARCASTER__: !!(window as any).__FARCASTER__,
      window__FARCASTER__SDK: !!(window as any).__FARCASTER__?.sdk,
      window__FARCASTER__Context: (window as any).__FARCASTER__?.sdk?.context,
      window__MINIAPP__: !!(window as any).__MINIAPP__,
      window__MINIAPP__SDK: !!(window as any).__MINIAPP__?.sdk,
      window__MINIAPP__Context: (window as any).__MINIAPP__?.sdk?.context,
      sdkReadyCalled: !!(window as any).__sdk_ready_called__,
      miniappReady: !!(window as any).__miniapp_ready__,
    }

    setSdkInfo(info)

    // Get logs from console
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    const captureLog = (prefix: string, args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      setLogs(prev => [...prev.slice(-99), `[${prefix}] ${message}`])
    }

    console.log = (...args: any[]) => {
      originalLog(...args)
      if (String(args[0]).includes('🔍') || String(args[0]).includes('✅') || String(args[0]).includes('⏳') || String(args[0]).includes('❌')) {
        captureLog('LOG', args)
      }
    }

    console.warn = (...args: any[]) => {
      originalWarn(...args)
      captureLog('WARN', args)
    }

    console.error = (...args: any[]) => {
      originalError(...args)
      captureLog('ERROR', args)
    }

    return () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
    }
  }, [])

  return (
    <div className="p-8 bg-black text-green-400 font-mono text-sm">
      <h1 className="text-2xl font-bold mb-4">🔍 SDK Debug Info</h1>
      
      <div className="mb-8 p-4 bg-gray-900 rounded border border-green-700">
        <h2 className="text-lg font-bold mb-3">SDK Detection Status</h2>
        <pre className="whitespace-pre-wrap break-words">
{JSON.stringify(sdkInfo, null, 2)}
        </pre>
      </div>

      <div className="mb-8 p-4 bg-gray-900 rounded border border-green-700">
        <h2 className="text-lg font-bold mb-3">Console Logs (Last 100)</h2>
        <div className="max-h-96 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className={log.includes('ERROR') ? 'text-red-400' : log.includes('WARN') ? 'text-yellow-400' : ''}>
              {log}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gray-900 rounded border border-green-700">
        <h2 className="text-lg font-bold mb-3">Instructions</h2>
        <p>1. Open your Farcaster app and navigate to your mini app</p>
        <p>2. Check the console above for SDK detection logs</p>
        <p>3. Look for ✅ or ❌ messages about SDK availability</p>
        <p>4. If SDK is not found, check if Farcaster is injecting it correctly</p>
        <p>5. Share this debug info if SDK detection is failing</p>
      </div>
    </div>
  )
}

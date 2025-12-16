"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

interface ShareContext {
  castHash?: string
  castFid?: number
  viewerFid?: number
  cast?: any
}

function SharePageContent() {
  const searchParams = useSearchParams()
  const [context, setContext] = useState<ShareContext>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Extract cast parameters from URL
    const castHash = searchParams.get("castHash")
    const castFid = searchParams.get("castFid")
    const viewerFid = searchParams.get("viewerFid")

    setContext({
      castHash: castHash || undefined,
      castFid: castFid ? parseInt(castFid) : undefined,
      viewerFid: viewerFid ? parseInt(viewerFid) : undefined
    })

    setLoading(false)
  }, [searchParams])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared cast...</p>
        </div>
      </div>
    )
  }

  // If no cast context, show info
  if (!context.castHash) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reputation Passport Builder</h1>
          <p className="text-gray-600 mb-6">
            Share a cast to this app to analyze the author's reputation and build their passport NFT.
          </p>
          <p className="text-sm text-gray-500">
            Open a cast, tap share, and select this Mini App from the share sheet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-fuchsia-100 to-cyan-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Cast Shared Successfully
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Cast Hash</p>
              <p className="font-mono text-sm break-all">{context.castHash}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Author FID</p>
              <p className="font-mono text-sm">{context.castFid || "N/A"}</p>
            </div>
          </div>

          {context.viewerFid && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Your FID</p>
              <p className="font-mono text-sm">{context.viewerFid}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Next Steps:</strong> You can now build a reputation passport for the cast author (FID: {context.castFid}) and track their on-chain activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SharePageContent />
    </Suspense>
  )
}

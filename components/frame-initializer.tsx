"use client"

import { useEffect } from "react"
import { useFarcasterFrame } from "@/hooks/use-farcaster-frame"

// Component to initialize Frame SDK at app level
export function FrameInitializer() {
  // This will trigger SDK initialization via useFarcasterFrame
  const { isFrame, isLoading } = useFarcasterFrame()

  useEffect(() => {
    if (!isLoading) {
      console.log(`Frame initialized: ${isFrame ? 'Running in Frame context' : 'Running as standalone web app'}`)
    }
  }, [isFrame, isLoading])

  // This component doesn't render anything visible
  return null
}
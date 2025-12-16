"use client"

import { useEffect } from "react"
import { useFrame } from "@/providers/frame-provider"

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: number
}

interface AnalyticsTrackerProps {
  trackPageViews?: boolean
  trackClicks?: boolean
  events?: string[]
}

export function AnalyticsTracker({ 
  trackPageViews = true, 
  trackClicks = true, 
  events = [] 
}: AnalyticsTrackerProps) {
  const { isFrame, user, sdk } = useFrame()

  // Track page views
  useEffect(() => {
    if (trackPageViews) {
      trackEvent("page_view", {
        path: window.location.pathname,
        isFrame,
        userFid: user?.fid,
        timestamp: Date.now()
      })
    }
  }, [trackPageViews, isFrame, user])

  // Track clicks
  useEffect(() => {
    if (!trackClicks) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target) {
        const dataAttribute = target.getAttribute('data-analytics')
        if (dataAttribute) {
          try {
            const eventData = JSON.parse(dataAttribute)
            trackEvent(eventData.name, eventData.properties)
          } catch (err) {
            console.warn("Invalid analytics data attribute:", dataAttribute)
          }
        }
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [trackClicks])

  // Custom event tracking function
  const trackEvent = (name: string, properties?: Record<string, any>) => {
    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        isFrame,
        userFid: user?.fid,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    }

    // Send to Frame analytics if available
    if (sdk?.analytics && sdk.analytics.track) {
      try {
        sdk.analytics.track(event.name, event.properties)
      } catch (err) {
        console.warn("Failed to send Frame analytics:", err)
      }
    }

    // Also send to external analytics if configured
    if (typeof window !== 'undefined' && (window as any).gtag) {
      try {
        (window as any).gtag('event', name, event.properties)
      } catch (err) {
        console.warn("Failed to send external analytics:", err)
      }
    }

    // Log for debugging
    console.log("📊 Analytics Event:", event)
  }

  // Track specific events
  useEffect(() => {
    events.forEach(eventName => {
      trackEvent(eventName)
    })
  }, [events])

  return null
}

// Hook for manual event tracking
export function useAnalytics() {
  const { isFrame, user, sdk } = useFrame()

  const track = (name: string, properties?: Record<string, any>) => {
    const event = {
      name,
      properties: {
        ...properties,
        isFrame,
        userFid: user?.fid,
        timestamp: Date.now(),
        url: window.location.href
      }
    }

    // Frame analytics
    if (sdk?.analytics?.track) {
      try {
        sdk.analytics.track(event.name, event.properties)
      } catch (err) {
        console.warn("Failed to send Frame analytics:", err)
      }
    }

    // External analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      try {
        (window as any).gtag('event', name, event.properties)
      } catch (err) {
        console.warn("Failed to send external analytics:", err)
      }
    }

    console.log("📊 Manual Analytics:", event)
  }

  const trackFrameView = () => {
    track("frame_view", {
      userFid: user?.fid,
      username: user?.username,
      timestamp: Date.now()
    })
  }

  const trackPassportGenerated = (fid: number, score: number) => {
    track("passport_generated", {
      fid,
      score,
      timestamp: Date.now()
    })
  }

  const trackNFTMinted = (fid: number, tokenId: string, txHash: string) => {
    track("nft_minted", {
      fid,
      tokenId,
      txHash,
      timestamp: Date.now()
    })
  }

  const trackShareCompleted = (platform: string, text: string) => {
    track("share_completed", {
      platform,
      textLength: text.length,
      timestamp: Date.now()
    })
  }

  return {
    track,
    trackFrameView,
    trackPassportGenerated,
    trackNFTMinted,
    trackShareCompleted
  }
}
import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { EnhancedAuthKitProvider } from "@/providers/auth-kit-provider"
import { FrameProvider } from "@/providers/frame-provider"
import { FrameInitializer } from "@/components/frame-initializer"
import { NotificationSystem } from "@/components/notification-system"
import { ErrorBoundary } from "@/components/error-boundary"

export const metadata: Metadata = {
  title: "Farcaster Reputation Passport",
  description: "Generate your on-chain reputation passport powered by Farcaster + Base. Build and showcase your decentralized reputation identity.",
  generator: "Farcaster Passport Builder",
  keywords: ["farcaster", "reputation", "passport", "blockchain", "base", "nft", "identity"],
  authors: [{ name: "lizlabs.eth" }],
  creator: "lizlabs.eth",
  publisher: "Farcaster Passport Builder",
  openGraph: {
    title: "Farcaster Reputation Passport",
    description: "Generate your on-chain reputation passport powered by Farcaster + Base",
    type: "website",
    url: "https://farcaster-passport-builder.vercel.app",
    siteName: "Farcaster Reputation Passport",
    images: [
      {
        url: "/icon.jpg",
        width: 1200,
        height: 630,
        alt: "Farcaster Reputation Passport",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Farcaster Reputation Passport",
    description: "Generate your on-chain reputation passport powered by Farcaster + Base",
    images: ["/icon.jpg"],
    creator: "@lizlabs_eth"
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "/api/frame/image",
    "fc:frame:button:1": "Check Reputation",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "/splash.jpg",
    "fc:frame:button:2": "Mint Passport",
    "fc:frame:button:2:action": "post",
    "fc:frame:button:2:target": "/api/frame/mint",
  },
  icons: {
    icon: [
      {
        url: "/icon.jpg",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icon-192.jpg",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon.jpg",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: "/apple-icon.jpg",
  },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <script src="/sdk-ready.js"></script>
      <body className={`font-sans antialiased`}>
        <ErrorBoundary>
          <EnhancedAuthKitProvider>
            <FrameProvider>
              <FrameInitializer />
              {children}
              <NotificationSystem />
              <Analytics />
            </FrameProvider>
          </EnhancedAuthKitProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

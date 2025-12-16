import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Farcaster Reputation Passport",
  description: "Generate your on-chain reputation passport powered by Farcaster + Base",
  generator: "Farcaster Passport Builder",
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "/api/frame/image",
    "fc:frame:button:1": "Check Reputation",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "/splash.jpg",
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
    ],
    apple: "/apple-icon.jpg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

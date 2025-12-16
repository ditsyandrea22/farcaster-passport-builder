import { NextResponse } from "next/server"
import { transactionHistory } from "@/lib/transaction-history"

export async function POST(req: Request) {
  // Add CORS headers to all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  }

  try {
    const body = await req.json()
    const fid = body.untrustedData?.fid

    // Get the current host for dynamic URL building
    const host = req.headers.get("host") || process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, "")
    const protocol = host?.includes("localhost") ? "http" : "https"
    const baseUrl = `${protocol}://${host}`

    console.log("Frame request - host:", host, "fid:", fid)

    if (!fid) {
      return NextResponse.json(
        {
          image: `${baseUrl}/api/frame/image`,
          buttons: [{ label: "Generate Passport" }],
        },
        { headers: corsHeaders },
      )
    }

    // Fetch score data using dynamic base URL
    const scoreRes = await fetch(`${baseUrl}/api/score?fid=${fid}`)
    const scoreData = await scoreRes.json()

    console.log("Score data:", scoreData)

    if (scoreData.error) {
      return NextResponse.json(
        {
          image: `${baseUrl}/api/frame/image?error=${encodeURIComponent(scoreData.error)}`,
          buttons: [{ label: "Try Again" }],
        },
        { headers: corsHeaders },
      )
    }

    // Get transaction history for enhanced sharing
    const txSummary = transactionHistory.getTransactionSummary(fid)
    
    const imageUrl = `${baseUrl}/api/frame/image?fid=${fid}&score=${scoreData.score}&badge=${scoreData.badge}&username=${scoreData.username}`

    // Enhanced share text with transaction history
    const enhancedShareText = `My Farcaster Reputation Score is ${scoreData.score} ${scoreData.badge} 🎯\nTotal Transactions: ${txSummary.totalTransactions} 🚀`

    return NextResponse.json(
      {
        image: imageUrl,
        buttons: [
          {
            label: "Mint Passport",
            action: "tx",
            target: `${baseUrl}/api/mint?fid=${fid}`,
          },
          {
            label: "Share",
            action: "link",
            target: `https://warpcast.com/~/compose?text=${encodeURIComponent(enhancedShareText + `\n\nGenerate yours: ${baseUrl}?fid=${fid}`)}`,
          },
          // Add a new button to view transaction history if user has previous transactions
          ...(txSummary.totalTransactions > 0 ? [{
            label: `📊 History (${txSummary.totalTransactions})`,
            action: "link",
            target: `${baseUrl}?fid=${fid}&view=history`
          }] : [])
        ],
      },
      { headers: corsHeaders },
    )
  } catch (error) {
    console.error("Frame error:", error)
    const host = req.headers.get("host") || "localhost:3000"
    const protocol = host.includes("localhost") ? "http" : "https"
    const baseUrl = `${protocol}://${host}`

    return NextResponse.json(
      {
        image: `${baseUrl}/api/frame/image?error=Server%20Error`,
        buttons: [{ label: "Try Again" }],
      },
      { headers: corsHeaders },
    )
  }
}

export async function GET(req: Request) {
  return POST(req)
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

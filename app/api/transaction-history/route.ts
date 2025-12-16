import { NextResponse } from "next/server"
import { transactionHistory } from "@/lib/transaction-history"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fid = searchParams.get("fid")

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  if (!fid) {
    return NextResponse.json({ error: "FID required" }, { status: 400, headers })
  }

  try {
    const fidNum = parseInt(fid)
    if (isNaN(fidNum) || fidNum <= 0) {
      return NextResponse.json({ error: "Invalid FID format" }, { status: 400, headers })
    }

    const txSummary = transactionHistory.getTransactionSummary(fidNum)

    return NextResponse.json({
      fid: fidNum,
      ...txSummary,
      timestamp: new Date().toISOString()
    }, { headers })
  } catch (error) {
    console.error("Transaction history API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
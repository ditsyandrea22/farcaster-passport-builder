import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  }

  try {
    const { searchParams } = new URL(req.url)
    const fid = searchParams.get("fid")

    if (!fid) {
      return NextResponse.json({ error: "FID required" }, { status: 400, headers: corsHeaders })
    }

    // Get the current host for dynamic URL building
    const host = req.headers.get("host") || process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, "")
    const protocol = host?.includes("localhost") ? "http" : "https"
    const baseUrl = `${protocol}://${host}`

    // Fetch score data
    const scoreRes = await fetch(`${baseUrl}/api/score?fid=${fid}`)
    const data = await scoreRes.json()

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400, headers: corsHeaders })
    }

    // Encode mint function call
    // This would call: mintPassport(address to, uint256 fid, uint256 score, string badge)
    const functionSelector = "0x12345678" // Replace with actual function selector
    const encodedData = functionSelector // Add ABI encoding here

    const tx = {
      chainId: "eip155:8453", // Base
      method: "eth_sendTransaction",
      params: {
        to: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
        data: encodedData,
        value: "0x0",
      },
    }

    return NextResponse.json(tx, { headers: corsHeaders })
  } catch (error) {
    console.error("Mint API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  }

  try {
    const body = await req.json()
    const { fid, to, score, badge } = body

    if (!fid || !to) {
      return NextResponse.json({ error: "FID and wallet address are required" }, { status: 400, headers: corsHeaders })
    }

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      return NextResponse.json({ error: "Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your environment variables." }, { status: 500, headers: corsHeaders })
    }

    // Validate score and badge
    const validScore = Math.min(Math.max(score || 0, 0), 1000)
    const validBadge = badge || "Newcomer"

    // Return the transaction parameters for client-side execution
    const transactionData = {
      contractAddress,
      functionName: "mintPassport",
      args: [to, fid, validScore, validBadge],
      estimatedGas: "150000",
      chainId: 8453, // Base Mainnet
    }

    return NextResponse.json({ 
      success: true, 
      transaction: transactionData,
      message: "Transaction data prepared. Use wagmi to execute on client side."
    }, { headers: corsHeaders })
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

import { NextResponse } from "next/server"
import { REPUTATION_PASSPORT_ABI } from "@/lib/contract-abi"
import { ethers } from "ethers"

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

    // Get user's wallet address from request (Frame context will provide this)
    const userAddress = searchParams.get("userAddress")
    
    // For Frame context, we can proceed without userAddress as Frame will handle wallet connection
    // For standalone web app, we still need userAddress
    const isFrameRequest = req.headers.get("user-agent")?.includes("farcaster-frame") ||
                          req.headers.get("sec-ch-ua")?.includes("farcaster-frame")

    if (!userAddress && !isFrameRequest) {
      return NextResponse.json({
        error: "User address required for web app. For Frame, wallet will be connected automatically."
      }, { status: 400, headers: corsHeaders })
    }

    // Create contract interface
    const contractInterface = new ethers.Interface(REPUTATION_PASSPORT_ABI)

    // For Frame context, we'll use a placeholder address that will be replaced by Frame wallet
    const targetAddress = userAddress || "0x0000000000000000000000000000000000000000"

    // Encode the mint function call
    const encodedData = contractInterface.encodeFunctionData("mintPassport", [
      targetAddress,
      parseInt(fid),
      data.score,
      data.badge
    ])

    // Mint fee in wei (0.0002 ETH)
    const mintFee = "0x" + (BigInt(0.0002 * 1e18).toString(16))
    
    // Estimated gas fee (Base network average ~0.0001 ETH)
    const estimatedGas = "0x" + (BigInt(0.0001 * 1e18).toString(16))
    
    // Total cost shown to user (mint fee + estimated gas)
    const totalCost = "0x" + (BigInt(0.0003 * 1e18).toString(16))

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000"

    if (isFrameRequest) {
      // Return Frame-compatible transaction format
      const frameTx = {
        chainId: "eip155:8453", // Base
        method: "eth_sendTransaction",
        params: {
          to: contractAddress,
          data: encodedData,
          value: mintFee,
        },
        // Frame-specific metadata
        meta: {
          title: "Mint Farcaster Reputation Passport NFT",
          description: `Mint your reputation passport for ${data.score} points ${data.badge} badge`,
          image: `${baseUrl}/api/passport-nft/${fid}`,
        }
      }

      return NextResponse.json(frameTx, { headers: corsHeaders })
    } else {
      // Return standard transaction data for web app
      const tx = {
        to: contractAddress,
        data: encodedData,
        value: mintFee,
        chainId: 8453, // Base
        estimatedGas: estimatedGas,
        totalCost: totalCost,
        description: "Mint Farcaster Reputation Passport NFT"
      }

      return NextResponse.json(tx, { headers: corsHeaders })
    }
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

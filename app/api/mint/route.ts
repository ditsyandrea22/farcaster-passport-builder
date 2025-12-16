import { NextResponse } from "next/server"
import { REPUTATION_PASSPORT_ABI } from "@/lib/contract-abi"
import { ethers } from "ethers"
import { transactionHistory } from "@/lib/transaction-history"

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

    // Validate FID format
    const fidNum = parseInt(fid)
    if (isNaN(fidNum) || fidNum <= 0) {
      return NextResponse.json({ error: "Invalid FID format" }, { status: 400, headers: corsHeaders })
    }

    // Get the current host for dynamic URL building
    const host = req.headers.get("host") || process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, "")
    const protocol = host?.includes("localhost") ? "http" : "https"
    const baseUrl = `${protocol}://${host}`

    // Fetch score data
    const scoreRes = await fetch(`${baseUrl}/api/score?fid=${fid}`)
    if (!scoreRes.ok) {
      return NextResponse.json({ error: "Failed to fetch score data" }, { status: 400, headers: corsHeaders })
    }
    
    const data = await scoreRes.json()

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400, headers: corsHeaders })
    }

    // Validate required score data
    if (!data.score || !data.badge) {
      return NextResponse.json({ error: "Invalid score data received" }, { status: 400, headers: corsHeaders })
    }

    // Get user's wallet address from request (Frame context will provide this)
    const userAddress = searchParams.get("userAddress")
    
    // For Frame context, we can proceed without userAddress as Frame will handle wallet connection
    // For standalone web app, we still need userAddress
    const isFrameRequest = req.headers.get("user-agent")?.includes("farcaster-frame") ||
                          req.headers.get("sec-ch-ua")?.includes("farcaster-frame") ||
                          req.headers.get("x-frame-context") === "farcaster"

    if (!userAddress && !isFrameRequest) {
      return NextResponse.json({
        error: "User address required for web app. For Frame, wallet will be connected automatically."
      }, { status: 400, headers: corsHeaders })
    }

    // Create contract interface
    const contractInterface = new ethers.Interface(REPUTATION_PASSPORT_ABI)

    // For Frame context, we'll use a placeholder address that will be replaced by Frame wallet
    // For web app, use the provided address
    const targetAddress = userAddress || "0x0000000000000000000000000000000000000000"

    // Encode the mint function call
    const encodedData = contractInterface.encodeFunctionData("mintPassport", [
      targetAddress,
      fidNum,
      data.score,
      data.badge
    ])

    // Mint fee in wei (0.0002 ETH)
    const mintFeeWei = BigInt(0.0002 * 1e18)
    const mintFee = "0x" + mintFeeWei.toString(16)
    
    // Estimated gas fee (Base network average ~0.0001 ETH)
    const estimatedGasWei = BigInt(0.0001 * 1e18)
    const estimatedGas = "0x" + estimatedGasWei.toString(16)
    
    // Total cost shown to user (mint fee + estimated gas)
    const totalCostWei = mintFeeWei + estimatedGasWei
    const totalCost = "0x" + totalCostWei.toString(16)

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS

    // Check if contract address is configured
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      return NextResponse.json({
        error: "Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in environment variables."
      }, { status: 500, headers: corsHeaders })
    }

    // Get transaction history for enhanced sharing
    const txSummary = transactionHistory.getTransactionSummary(fidNum)
    
    // Generate enhanced share content
    const enhancedShareData = {
      text: `My Farcaster Reputation Score is ${data.score} ${data.badge} 🎯\nTotal Transactions: ${txSummary.totalTransactions + 1} 🚀`,
      url: `${baseUrl}?fid=${fid}`,
      title: `${data.displayName || 'User'}'s Reputation Passport`,
      description: `Score: ${data.score} | Badge: ${data.badge} | Transactions: ${txSummary.totalTransactions + 1}`,
      image: `${baseUrl}/api/passport-nft/${fid}`,
      transactionBadges: txSummary.badges,
      totalTransactions: txSummary.totalTransactions + 1,
      previousTransactions: txSummary.totalTransactions
    }

    if (isFrameRequest) {
      // Return Frame-compatible transaction format with enhanced share data
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
          cost: {
            mintFee: mintFeeWei.toString(),
            estimatedGas: estimatedGasWei.toString(),
            totalCost: totalCostWei.toString()
          },
          // Enhanced share data for post-mint sharing
          shareData: enhancedShareData
        }
      }

      return NextResponse.json(frameTx, { headers: corsHeaders })
    } else {
      // Return standard transaction data for web app with enhanced share data
      const tx = {
        to: contractAddress,
        data: encodedData,
        value: mintFee,
        chainId: 8453, // Base
        estimatedGas: estimatedGas,
        totalCost: totalCost,
        description: "Mint Farcaster Reputation Passport NFT",
        metadata: {
          fid: fidNum,
          score: data.score,
          badge: data.badge,
          userAddress,
          timestamp: new Date().toISOString()
        },
        // Enhanced share data for post-mint sharing
        shareData: enhancedShareData
      }

      return NextResponse.json(tx, { headers: corsHeaders })
    }
  } catch (error) {
    // Provide more specific error messages
    let errorMessage = "Internal server error"
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes("FID")) {
        errorMessage = "Invalid FID provided"
        statusCode = 400
      } else if (error.message.includes("fetch")) {
        errorMessage = "Failed to fetch user data"
        statusCode = 400
      } else if (error.message.includes("Contract")) {
        errorMessage = "Contract configuration error"
        statusCode = 500
      }
    }

    return NextResponse.json({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { 
      status: statusCode, 
      headers: corsHeaders 
    })
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

// Helper function to track transaction (called after successful mint)
export function trackSuccessfulMint(fid: number, txHash: string, score: number, badge: string, userAddress: string) {
  transactionHistory.addTransaction({
    fid,
    txHash,
    timestamp: new Date().toISOString(),
    score,
    badge,
    userAddress
  })
}

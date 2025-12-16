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
      return NextResponse.json({
        error: "FID required",
        details: "Please provide a valid Farcaster FID (Farcaster ID)"
      }, { status: 400, headers: corsHeaders })
    }

    // Validate FID format
    const fidNum = parseInt(fid)
    if (isNaN(fidNum) || fidNum <= 0) {
      return NextResponse.json({
        error: "Invalid FID format",
        details: "FID must be a positive number"
      }, { status: 400, headers: corsHeaders })
    }

    // Get the current host for dynamic URL building
    const host = req.headers.get("host") || process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, "")
    const protocol = host?.includes("localhost") ? "http" : "https"
    const baseUrl = `${protocol}://${host}`

    // Fetch score data
    const scoreRes = await fetch(`${baseUrl}/api/score?fid=${fid}`)
    if (!scoreRes.ok) {
      const errorText = await scoreRes.text()
      console.error("Score API failed:", scoreRes.status, errorText)
      return NextResponse.json({
        error: "Failed to fetch score data",
        details: `Score API returned ${scoreRes.status}: ${errorText}`
      }, { status: 400, headers: corsHeaders })
    }
    
    const data = await scoreRes.json()

    if (data.error) {
      return NextResponse.json({
        error: data.error,
        details: data.details || "Failed to retrieve user score data"
      }, { status: 400, headers: corsHeaders })
    }

    // Validate required score data
    if (!data.score || !data.badge) {
      return NextResponse.json({
        error: "Invalid score data received",
        details: "Score and badge data are required for minting"
      }, { status: 400, headers: corsHeaders })
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
        error: "User address required for web app",
        details: "For Frame, wallet will be connected automatically. For web app, please provide wallet address."
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
        error: "Contract address not configured",
        details: "Smart contract address is missing. Please deploy the contract and set NEXT_PUBLIC_CONTRACT_ADDRESS in environment variables.",
        contractAddress: contractAddress || "not set"
      }, { status: 500, headers: corsHeaders })
    }

    // Validate contract address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json({
        error: "Invalid contract address format",
        details: "Contract address must be a valid 42-character Ethereum address starting with 0x",
        contractAddress
      }, { status: 500, headers: corsHeaders })
    }

    // Get transaction history for enhanced sharing
    const txSummary = transactionHistory.getTransactionSummary(fidNum)
    
    // Generate enhanced share content for NFT mint success
    const enhancedShareData = {
      text: `🎉 Just minted my Farcaster Reputation Passport NFT!\n\n📊 Score: ${data.score} ${data.badge}\n🚀 Total Transactions: ${txSummary.totalTransactions + 1}\n\nGenerate your own reputation passport:`,
      url: `${baseUrl}?fid=${fid}`,
      title: `${data.displayName || 'User'}'s Reputation Passport NFT`,
      description: `Score: ${data.score} | Badge: ${data.badge} | TX: [pending] | Total Transactions: ${txSummary.totalTransactions + 1}`,
      image: `${baseUrl}/api/passport-nft/${fid}`,
      transactionBadges: txSummary.badges,
      totalTransactions: txSummary.totalTransactions + 1,
      previousTransactions: txSummary.totalTransactions,
      isNftMint: true,
      mintData: {
        score: data.score,
        badge: data.badge,
        fid: fidNum,
        displayName: data.displayName || 'User'
      }
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
    // Provide more specific error messages with better context
    let errorMessage = "Internal server error"
    let statusCode = 500
    let errorDetails = ""

    if (error instanceof Error) {
      if (error.message.includes("FID")) {
        errorMessage = "Invalid FID provided"
        errorDetails = "Please provide a valid positive integer FID"
        statusCode = 400
      } else if (error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
        errorMessage = "Failed to fetch user data"
        errorDetails = "Unable to retrieve Farcaster user information. Please check if the FID exists and try again."
        statusCode = 400
      } else if (error.message.includes("Contract")) {
        errorMessage = "Contract configuration error"
        errorDetails = "Smart contract is not properly configured. Please check contract deployment and environment variables."
        statusCode = 500
      } else if (error.message.includes("API request failed")) {
        errorMessage = "Server API error"
        errorDetails = "Internal API request failed. Please try again in a moment."
        statusCode = 500
      } else if (error.message.includes("Invalid") && error.message.includes("data")) {
        errorMessage = "Invalid data received"
        errorDetails = "User data is incomplete or malformed. Please try again with a different FID."
        statusCode = 400
      } else {
        errorMessage = error.message
        errorDetails = "An unexpected error occurred during minting process"
      }
    } else {
      errorDetails = "Unknown error type encountered"
    }

    console.error("Mint API error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(7) // For tracking
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

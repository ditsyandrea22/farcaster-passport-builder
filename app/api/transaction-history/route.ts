import { NextResponse } from "next/server"
import { enhancedTransactionHistory, transactionHistory } from "@/lib/transaction-history"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fid = searchParams.get("fid")
  const address = searchParams.get("address")
  const mode = searchParams.get("mode") || "summary" // "summary" | "full" | "patterns"

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

    // Check if Etherscan is configured
    const isEtherscanConfigured = enhancedTransactionHistory.isEtherscanConfigured()
    
    if (!isEtherscanConfigured) {
      console.warn("Etherscan API not configured, falling back to local data only")
    }

    let result: any = {
      fid: fidNum,
      timestamp: new Date().toISOString(),
      dataSource: 'local' as const,
      etherscanConfigured: isEtherscanConfigured
    }

    if (mode === "summary") {
      // Get enhanced transaction summary
      const summary = await enhancedTransactionHistory.getEnhancedTransactionSummary(fidNum, address || undefined)
      
      result = {
        fid: fidNum,
        ...summary,
        etherscanConfigured: isEtherscanConfigured
      }
    } else if (mode === "full" && address && isEtherscanConfigured) {
      // Get full on-chain transaction data
      const onChainData = await enhancedTransactionHistory.getOnChainHistory(address, fidNum)
      
      if (onChainData) {
        result = {
          fid: fidNum,
          address,
          onChainData,
          dataSource: 'onchain' as const,
          etherscanConfigured: isEtherscanConfigured
        }
      } else {
        result = {
          fid: fidNum,
          address,
          error: "Failed to fetch on-chain data",
          dataSource: 'error' as const,
          etherscanConfigured: isEtherscanConfigured
        }
      }
    } else if (mode === "patterns" && address && isEtherscanConfigured) {
      // Get transaction patterns analysis
      const onChainData = await enhancedTransactionHistory.getOnChainHistory(address, fidNum)
      
      if (onChainData) {
        result = {
          fid: fidNum,
          address,
          patterns: onChainData.patterns,
          reputation: onChainData.reputation,
          analysis: onChainData.analysis,
          dataSource: 'patterns' as const,
          etherscanConfigured: isEtherscanConfigured
        }
      } else {
        result = {
          fid: fidNum,
          address,
          error: "Failed to fetch pattern data",
          dataSource: 'error' as const,
          etherscanConfigured: isEtherscanConfigured
        }
      }
    } else {
      // Legacy mode - get basic transaction summary using backward-compatible method
      const txSummary = transactionHistory.getTransactionSummary(fidNum)
      
      result = {
        fid: fidNum,
        ...txSummary,
        dataSource: 'local' as const,
        etherscanConfigured: isEtherscanConfigured
      }
    }

    return NextResponse.json(result, { headers })
  } catch (error) {
    console.error("Transaction history API error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500, headers }
    )
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

// Additional endpoint for cache management
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const address = searchParams.get("address")
  
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  try {
    if (action === "clear-cache") {
      if (address) {
        enhancedTransactionHistory.clearOnChainCache(address)
        return NextResponse.json({ 
          success: true, 
          message: `Cache cleared for address: ${address}` 
        }, { headers })
      } else {
        enhancedTransactionHistory.clearOnChainCache()
        return NextResponse.json({ 
          success: true, 
          message: "All caches cleared" 
        }, { headers })
      }
    }
    
    if (action === "cache-info") {
      const cacheInfo = enhancedTransactionHistory.getCacheInfo()
      return NextResponse.json({ 
        cacheInfo,
        etherscanConfigured: enhancedTransactionHistory.isEtherscanConfigured()
      }, { headers })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400, headers })
  } catch (error) {
    console.error("Cache management error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers }
    )
  }
}
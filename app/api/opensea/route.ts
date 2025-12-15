import { NextResponse } from "next/server"
import { openSeaAPI, OpenSeaAsset } from "@/lib/opensea"

export async function GET(req: Request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  }

  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action")
    const contractAddress = searchParams.get("contractAddress")
    const tokenId = searchParams.get("tokenId")

    if (!openSeaAPI) {
      return NextResponse.json(
        { error: "OpenSea API not configured" },
        { status: 400, headers: corsHeaders }
      )
    }

    const collectionSlug = process.env.NEXT_PUBLIC_OPENSEA_COLLECTION_SLUG

    switch (action) {
      case "collection":
        if (!collectionSlug) {
          return NextResponse.json(
            { error: "Collection slug not configured" },
            { status: 400, headers: corsHeaders }
          )
        }
        
        const collection = await openSeaAPI.getCollection(collectionSlug)
        return NextResponse.json(collection, { headers: corsHeaders })

      case "assets":
        if (!collectionSlug) {
          return NextResponse.json(
            { error: "Collection slug not configured" },
            { status: 400, headers: corsHeaders }
          )
        }
        
        const limit = parseInt(searchParams.get("limit") || "20")
        const offset = parseInt(searchParams.get("offset") || "0")
        const assets = await openSeaAPI.getCollectionAssets(collectionSlug, limit, offset)
        return NextResponse.json({ assets }, { headers: corsHeaders })

      case "asset":
        if (!contractAddress || !tokenId) {
          return NextResponse.json(
            { error: "Contract address and token ID required" },
            { status: 400, headers: corsHeaders }
          )
        }
        
        const asset = await openSeaAPI.getAsset(contractAddress, tokenId)
        return NextResponse.json(asset, { headers: corsHeaders })

      case "register":
        if (!contractAddress || !collectionSlug) {
          return NextResponse.json(
            { error: "Contract address and collection slug required" },
            { status: 400, headers: corsHeaders }
          )
        }
        
        const registered = await openSeaAPI.registerCollection(contractAddress, collectionSlug)
        return NextResponse.json({ registered }, { headers: corsHeaders })

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: collection, assets, asset, register" },
          { status: 400, headers: corsHeaders }
        )
    }
  } catch (error) {
    console.error("[OpenSea] API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
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
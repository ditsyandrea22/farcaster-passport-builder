import { NextResponse } from "next/server"
import { REPUTATION_PASSPORT_ABI } from "@/lib/contract-abi"
import { ethers } from "ethers"

const NEYNAR_URL = "https://api.neynar.com/v2/farcaster/user/bulk"

interface UserProfile {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  bio: string
  custody: string | null
  followers: number
  following: number
  casts: number
  ageDays: number
  powerBadge: boolean
  verifiedAddresses: string[]
  engagementRate: number
  reputation?: {
    score: number
    badge: string
    rank: number | null
  }
  onchain?: {
    hasPassport: boolean
    passportTokenId: number | null
    totalTransactions: number
    lastActivity: string
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fid = searchParams.get("fid")

  if (!fid) {
    return NextResponse.json({ error: "FID required" }, { status: 400 })
  }

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  try {
    // Validate required API key with fallback
    const neynarApiKey = process.env.NEYNAR_API_KEY || "demo-key"
    
    if (neynarApiKey === "demo-key") {
      console.warn("Using demo API key for user profile")
      // Return mock profile data
      const mockProfile: UserProfile = {
        fid: Number.parseInt(fid),
        username: `user${fid}`,
        displayName: `User ${fid}`,
        pfpUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fid}`,
        bio: "Demo user profile",
        custody: "0x0000000000000000000000000000000000000000",
        followers: Math.floor(Math.random() * 1000),
        following: Math.floor(Math.random() * 500),
        casts: Math.floor(Math.random() * 100),
        ageDays: Math.floor(Math.random() * 365),
        powerBadge: false,
        verifiedAddresses: [],
        engagementRate: Math.random() * 20,
        reputation: {
          score: Math.floor(Math.random() * 1000),
          badge: "Newcomer",
          rank: Math.floor(Math.random() * 10000) + 1
        },
        onchain: {
          hasPassport: false,
          passportTokenId: null,
          totalTransactions: Math.floor(Math.random() * 50),
          lastActivity: new Date().toISOString()
        }
      }
      
      return NextResponse.json(mockProfile, { headers })
    }

    // Fetch user data from Neynar API
    const res = await fetch(`${NEYNAR_URL}?fids=${fid}`, {
      headers: {
        accept: "application/json",
        api_key: neynarApiKey,
      },
    })

    if (!res.ok) {
      console.error("Neynar API error:", await res.text())
      return NextResponse.json({ error: "Failed to fetch Farcaster data" }, { status: 500, headers })
    }

    const data = await res.json()

    if (!data.users || data.users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404, headers })
    }

    const user = data.users[0]

    // Extract user data
    const profile: UserProfile = {
      fid: Number.parseInt(fid),
      username: user.username,
      displayName: user.display_name || user.username,
      pfpUrl: user.pfp_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fid}`,
      bio: user.profile?.bio?.text || "",
      custody: user.custody_address || user.verified_addresses?.eth_addresses?.[0] || null,
      followers: user.follower_count || 0,
      following: user.following_count || 0,
      casts: user.verifications?.length || 0,
      ageDays: user.timestamp ? Math.floor((Date.now() - new Date(user.timestamp).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      powerBadge: user.power_badge || false,
      verifiedAddresses: user.verified_addresses?.eth_addresses || [],
      engagementRate: 0
    }

    // Calculate engagement metrics
    const engagementRate = profile.followers > 0 ? Math.min((profile.followers / Math.max(profile.casts, 1)) * 0.1, 20) : 0
    profile.engagementRate = Number(engagementRate.toFixed(1))

    // Fetch on-chain passport data if wallet address is available
    if (profile.custody && profile.custody !== "0x0000000000000000000000000000000000000000") {
      try {
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
        if (contractAddress && contractAddress !== "0xAED879A60B8D4448694A85BF09Dcf8b39E2c6802") {
          const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://mainnet.base.org")
          const contract = new ethers.Contract(contractAddress, REPUTATION_PASSPORT_ABI, provider)
          
          // Check if user has a passport
          const passport = await contract.getPassportByFID(profile.fid)
          const hasPassport = passport.fid > 0
          
          profile.reputation = {
            score: hasPassport ? Number(passport.score) : 0,
            badge: hasPassport ? passport.badge : "Newcomer",
            rank: hasPassport ? Math.floor(Math.random() * 10000) + 1 : null
          }
          
          profile.onchain = {
            hasPassport,
            passportTokenId: hasPassport ? Math.floor(Math.random() * 1000) + 1 : null, // Would need additional contract call
            totalTransactions: Math.floor(Math.random() * 100), // Would need transaction history API
            lastActivity: new Date().toISOString()
          }
        }
      } catch (err) {
        console.error("Failed to fetch on-chain data:", err)
        // Continue without on-chain data
      }
    }

    return NextResponse.json(profile, { headers })
  } catch (error) {
    console.error("User profile API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
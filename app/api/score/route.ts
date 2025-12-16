import { NextResponse } from "next/server"

const NEYNAR_URL = "https://api.neynar.com/v2/farcaster/user/bulk"

interface ScoreParams {
  followers: number
  following: number
  casts: number
  ageDays: number
  txCount: number
  powerBadge: boolean
  verifiedAddresses: number
  engagementRate: number
}

function calculateScore({
  followers,
  following,
  casts,
  ageDays,
  txCount,
  powerBadge,
  verifiedAddresses,
  engagementRate,
}: ScoreParams): number {
  let score = 0

  // Followers contribution (max 250 points) - with diminishing returns
  score += Math.min(followers, 5000) * 0.05
  if (followers > 5000) {
    score += Math.min((followers - 5000) * 0.01, 50)
  }

  // Engagement rate (max 200 points) - quality over quantity
  score += engagementRate * 10

  // Casts contribution (max 150 points)
  score += Math.min(casts, 1000) * 0.15

  // Account age contribution (max 150 points)
  score += Math.min(ageDays, 730) * 0.2

  // Transaction count contribution (max 200 points)
  score += Math.min(txCount, 1000) * 0.2

  // Power badge bonus (50 points)
  if (powerBadge) {
    score += 50
  }

  // Verified addresses bonus (50 points max)
  score += Math.min(verifiedAddresses * 10, 50)

  // Follower/following ratio bonus (max 50 points)
  if (following > 0) {
    const ratio = followers / following
    if (ratio > 1) {
      score += Math.min(ratio * 10, 50)
    }
  }

  return Math.floor(Math.min(score, 1000))
}

function getBadge({
  ageDays,
  casts,
  txCount,
  powerBadge,
  verifiedAddresses,
}: Omit<ScoreParams, "followers" | "following" | "engagementRate">): string {
  if (powerBadge && ageDays > 365) return "OG"
  if (txCount > 500) return "Onchain"
  if (casts > 1000 && ageDays > 180) return "Active"
  if (verifiedAddresses > 2) return "Builder"
  return "Newcomer"
}

async function getTxCount(address: string): Promise<number> {
  try {
    const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org"
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionCount",
        params: [address, "latest"],
      }),
    })

    const json = await res.json()
    return Number.parseInt(json.result, 16)
  } catch (error) {
    return 0
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
      console.warn("Using demo API key - functionality will be limited")
      // Return mock data for demo purposes
      const mockUser = {
        fid: Number.parseInt(fid),
        username: `user${fid}`,
        displayName: `User ${fid}`,
        pfp_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fid}`,
        profile: { bio: { text: "Demo user profile" } },
        follower_count: Math.floor(Math.random() * 1000),
        following_count: Math.floor(Math.random() * 500),
        verified_addresses: { eth_addresses: [] },
        custody_address: "0x0000000000000000000000000000000000000000",
        power_badge: false,
        timestamp: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year ago
      }

      const followers = mockUser.follower_count
      const following = mockUser.following_count
      const casts = mockUser.verified_addresses.eth_addresses.length
      const custody = mockUser.custody_address
      const powerBadge = mockUser.power_badge
      const verifiedAddresses = mockUser.verified_addresses.eth_addresses

      const createdAt = new Date(mockUser.timestamp)
      const ageDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      const engagementRate = casts > 0 ? Math.min((followers / casts) * 0.1, 20) : 0
      const txCount = Math.floor(Math.random() * 100)

      const score = Math.floor(Math.min(
        Math.min(followers, 5000) * 0.05 +
        engagementRate * 10 +
        Math.min(casts, 1000) * 0.15 +
        Math.min(ageDays, 730) * 0.2 +
        Math.min(txCount, 1000) * 0.2 +
        (powerBadge ? 50 : 0) +
        Math.min(verifiedAddresses.length * 10, 50) +
        (following > 0 ? Math.min((followers / following) * 10, 50) : 0),
        1000
      ))

      const badge = powerBadge && ageDays > 365 ? "OG" :
                   txCount > 500 ? "Onchain" :
                   casts > 1000 && ageDays > 180 ? "Active" :
                   verifiedAddresses.length > 2 ? "Builder" : "Newcomer"

      return NextResponse.json({
        fid: Number.parseInt(fid),
        username: mockUser.username,
        displayName: mockUser.displayName,
        pfpUrl: mockUser.pfp_url,
        bio: mockUser.profile.bio.text,
        score,
        badge,
        custody,
        followers,
        following,
        casts,
        ageDays,
        txCount,
        powerBadge,
        verifiedAddresses,
        engagementRate: Number.parseFloat(engagementRate.toFixed(1)),
      }, { headers })
    }

    const res = await fetch(`${NEYNAR_URL}?fids=${fid}`, {
      headers: {
        accept: "application/json",
        api_key: neynarApiKey,
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch Farcaster data" }, { status: 500, headers })
    }

    const data = await res.json()

    if (!data.users || data.users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404, headers })
    }

    const user = data.users[0]

    const followers = user.follower_count || 0
    const following = user.following_count || 0
    const casts = user.verified_addresses?.eth_addresses?.length || 0
    const custody =
      user.custody_address ||
      user.verified_addresses?.eth_addresses?.[0] ||
      "0x0000000000000000000000000000000000000000"
    const pfpUrl = user.pfp_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fid}`
    const bio = user.profile?.bio?.text || ""
    const powerBadge = user.power_badge || false
    const verifiedAddresses = user.verified_addresses?.eth_addresses || []

    // Parse account creation date
    const createdAt = user.timestamp ? new Date(user.timestamp) : new Date()
    const ageDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

    const engagementRate = casts > 0 ? Math.min((followers / casts) * 0.1, 20) : 0

    // Get onchain transaction count
    const txCount = await getTxCount(custody)

    const score = calculateScore({
      followers,
      following,
      casts,
      ageDays,
      txCount,
      powerBadge,
      verifiedAddresses: verifiedAddresses.length,
      engagementRate,
    })

    const badge = getBadge({
      ageDays,
      casts,
      txCount,
      powerBadge,
      verifiedAddresses: verifiedAddresses.length,
    })

    return NextResponse.json(
      {
        fid: Number.parseInt(fid),
        username: user.username,
        displayName: user.display_name || user.username,
        pfpUrl,
        bio,
        score,
        badge,
        custody,
        followers,
        following,
        casts,
        ageDays,
        txCount,
        powerBadge,
        verifiedAddresses,
        engagementRate: Number.parseFloat(engagementRate.toFixed(1)),
      },
      { headers },
    )
  } catch (error) {
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

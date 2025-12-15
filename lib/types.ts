export interface PassportData {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  bio: string
  score: number
  badge: BadgeType
  custody: string
  followers: number
  following: number
  casts: number
  ageDays: number
  txCount: number
  powerBadge: boolean
  verifiedAddresses: string[]
  engagementRate: number
}

export type BadgeType = "OG" | "Onchain" | "Active" | "Builder" | "Newcomer"

export interface ScoreCalculationParams {
  followers: number
  following: number
  casts: number
  ageDays: number
  txCount: number
  powerBadge: boolean
  verifiedAddresses: number
  engagementRate: number
}

export interface NeynarUser {
  fid: number
  username: string
  display_name: string
  pfp_url?: string
  profile?: {
    bio?: {
      text: string
    }
  }
  follower_count: number
  following_count: number
  verified_addresses?: {
    eth_addresses?: string[]
  }
  custody_address?: string
  power_badge?: boolean
  timestamp?: string
}

export interface NeynarResponse {
  users: NeynarUser[]
}

export interface FrameMetadata {
  version: "next"
  imageUrl: string
  button: {
    title: string
    action: {
      type: "post" | "post_redirect" | "launch_frame" | "tx"
      url?: string
      target?: string
      splashImageUrl?: string
      splashBackgroundColor?: string
    }
  }
}

export interface MintRequest {
  fid: number
  score: number
  badge: BadgeType
}

export interface TransactionResponse {
  chainId: string
  method: string
  params: {
    abi: any[]
    to: string
    value?: string
    data?: string
  }
}

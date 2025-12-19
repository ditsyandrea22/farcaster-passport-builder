import { NextResponse } from "next/server"

export async function GET(_: Request, { params }: { params: { tokenId: string } }) {
  const tokenId = params.tokenId

  // In production, fetch this data from the blockchain
  // For now, we'll return a template
  const metadata = {
    name: `Farcaster Reputation Passport #${tokenId}`,
    description: "On-chain reputation identity for Farcaster users, powered by social and on-chain activity.",
    image: `${process.env.NEXT_PUBLIC_APP_URL}/api/passport-nft/${tokenId}`,
    external_url: `${process.env.NEXT_PUBLIC_APP_URL}/passport/${tokenId}`,
    attributes: [
      { trait_type: "FID", value: 0 },
      { trait_type: "Username", value: "" },
      { trait_type: "Score", value: 0 },
      { trait_type: "Badge", value: "Newcomer" },
      { trait_type: "Generation", value: 1 },
    ],
  }

  return NextResponse.json(metadata)
}

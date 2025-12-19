import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(_: Request, { params }: { params: { tokenId: string } }) {
  // In production, fetch passport data from blockchain
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
      }}
    >
      <div style={{ fontSize: 80, fontWeight: "bold", marginBottom: 30 }}>🪪</div>
      <div style={{ fontSize: 48, fontWeight: "bold" }}>Reputation Passport</div>
      <div style={{ fontSize: 32, opacity: 0.8, marginTop: 20 }}>#{params.tokenId}</div>
    </div>,
    {
      width: 1200,
      height: 1200,
    },
  )
}

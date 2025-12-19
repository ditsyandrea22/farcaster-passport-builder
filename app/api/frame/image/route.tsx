import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(req: Request) {
  // Add CORS headers
  const headers = {
    "Content-Type": "image/png",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Cache-Control": "public, max-age=3600",
  }

  const { searchParams } = new URL(req.url)
  const score = searchParams.get("score")
  const badge = searchParams.get("badge")
  const username = searchParams.get("username")
  const error = searchParams.get("error")

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "OG":
        return "#10b981"
      case "Onchain":
        return "#3b82f6"
      case "Active":
        return "#eab308"
      default:
        return "#6b7280"
    }
  }

  if (error) {
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
          padding: 40,
          fontSize: 32,
        }}
      >
        <div style={{ fontSize: 60, marginBottom: 20 }}>⚠️</div>
        <div>{error}</div>
      </div>,
      {
        width: 1200,
        height: 630,
        headers,
      },
    )
  }

  if (!score || !badge) {
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
        <div style={{ fontSize: 72, fontWeight: "bold", marginBottom: 20 }}>🪪 Farcaster Reputation Passport</div>
        <div style={{ fontSize: 36, opacity: 0.9 }}>Generate your on-chain reputation identity</div>
      </div>,
      {
        width: 1200,
        height: 630,
        headers,
      },
    )
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        padding: 60,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 40,
        }}
      >
        <div>
          <div style={{ fontSize: 48, fontWeight: "bold" }}>@{username}</div>
          <div style={{ fontSize: 24, opacity: 0.8, marginTop: 10 }}>Farcaster Reputation Passport</div>
        </div>
        <div
          style={{
            background: getBadgeColor(badge),
            padding: "10px 30px",
            borderRadius: 20,
            fontSize: 28,
            fontWeight: "bold",
          }}
        >
          {badge}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderTop: "2px solid rgba(255,255,255,0.2)",
          borderBottom: "2px solid rgba(255,255,255,0.2)",
          margin: "40px 0",
        }}
      >
        <div style={{ fontSize: 120, fontWeight: "bold" }}>{score}</div>
        <div style={{ fontSize: 32, opacity: 0.8, marginTop: 20 }}>Reputation Score</div>
      </div>

      <div style={{ fontSize: 20, opacity: 0.7, textAlign: "center" }}>Powered by Farcaster + Base</div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers,
    },
  )
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Removed ignoreBuildErrors to ensure proper type checking
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['@radix-ui/react', 'lucide-react'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://farcaster.xyz https://client.farcaster.xyz https://warpcast.com https://client.warpcast.com https://wallet.farcaster.xyz https://privy.farcaster.xyz https://privy.warpcast.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://farcaster.xyz https://client.farcaster.xyz https://warpcast.com https://client.warpcast.com https://wallet.farcaster.xyz https://privy.farcaster.xyz https://privy.warpcast.com https://auth.privy.io https://*.rpc.privy.systems https://cloudflareinsights.com https://explorer-api.walletconnect.com https://*.walletconnect.com https://*.rpc.tenderly.co https://base-mainnet.g.alchemy.com https://base.drpc.org https://api.opensea.io https://*.etherscan.io https://api.etherscan.io https://basescan.org https://api.basescan.org https://*.alchemy.com https://*.infura.io https://*.pokt.network https://*.cloudflare-eth.com",
              "frame-src https://farcaster.xyz https://client.farcaster.xyz https://wallet.farcaster.xyz",
              "frame-ancestors 'self' https://farcaster.xyz https://client.farcaster.xyz https://warpcast.com https://client.warpcast.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://farcaster.xyz https://client.farcaster.xyz"
            ].join('; ')
          },
          {
            key: "X-Frame-Options",
            value: "ALLOW-FROM https://farcaster.xyz https://client.farcaster.xyz https://warpcast.com https://client.warpcast.com"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ]
      },
      {
        // Apply CORS headers to all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
          },
        ],
      },
      {
        // Apply CORS headers to Frame manifest
        source: "/.well-known/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
        ],
      },
    ]
  },
}

export default nextConfig

// Environment configuration and validation
export interface EnvConfig {
  neynarApiKey: string
  baseRpcUrl: string
  contractAddress: string
  isProduction: boolean
  isDevelopment: boolean
  isDemo: boolean
}

export function getEnvConfig(): EnvConfig {
  const neynarApiKey = process.env.NEYNAR_API_KEY || "99444B06-5A19-493E-B66D-3F746EC2B622"
  const baseRpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org"
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xAED879A60B8D4448694A85BF09Dcf8b39E2c6802"
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isDemo = neynarApiKey === "99444B06-5A19-493E-B66D-3F746EC2B622"

  return {
    neynarApiKey,
    baseRpcUrl,
    contractAddress,
    isProduction,
    isDevelopment,
    isDemo
  }
}

export function validateEnvConfig(): { isValid: boolean; errors: string[] } {
  const config = getEnvConfig()
  const errors: string[] = []

  if (config.isDemo) {
    console.warn("⚠️ Running in demo mode - API functionality will be limited")
    errors.push("NEYNAR_API_KEY not configured - using demo data")
  }

  if (!config.baseRpcUrl) {
    errors.push("BASE_RPC_URL not configured")
  }

  if (!config.contractAddress) {
    errors.push("NEXT_PUBLIC_CONTRACT_ADDRESS not configured")
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function logConfigStatus(): void {
  const config = getEnvConfig()
  const validation = validateEnvConfig()
  
  console.log("🔧 Environment Configuration:", {
    neynarApiKey: config.neynarApiKey === "demo-key" ? "demo-key (limited)" : "configured",
    baseRpcUrl: config.baseRpcUrl ? "configured" : "missing",
    contractAddress: config.contractAddress ? "configured" : "missing",
    isProduction: config.isProduction,
    isDevelopment: config.isDevelopment,
    isDemo: config.isDemo
  })

  if (validation.errors.length > 0) {
    console.warn("⚠️ Configuration Issues:", validation.errors)
  } else {
    console.log("✅ Configuration validation passed")
  }
}
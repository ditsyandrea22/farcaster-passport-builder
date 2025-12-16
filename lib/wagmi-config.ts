import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'

/**
 * Wagmi Configuration for Mini App
 * 
 * This configuration sets up Wagmi to work with Farcaster Mini Apps
 * on the Base network (Layer 2).
 * 
 * Note: We don't need to install @farcaster/miniapp-wagmi-connector here
 * because the Mini App environment provides the wallet directly through
 * the SDK's getEthereumProvider() method, which is compatible with
 * the EIP-1193 standard that Wagmi can use directly.
 */

export const miniAppConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  // Note: Connectors will be added dynamically when in Mini App environment
  // via the useFrame hook and enhanced wallet manager
})

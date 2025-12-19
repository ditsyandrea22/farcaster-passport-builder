import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'
import { reown } from '@reown/appkit-adapter-wagmi'

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    miniAppConnector(),
    reown({
      projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!,
      metadata: {
        name: 'Farcaster Reputation Passport',
        description: 'A reputation-based NFT passport for the Farcaster ecosystem',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        icons: [`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/icon.png`]
      }
    })
  ]
})

export default config
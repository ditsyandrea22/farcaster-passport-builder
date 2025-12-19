# Farcaster Reputation Passport

A production-ready full-stack application for generating and minting on-chain reputation NFTs for Farcaster users, powered by Neynar API and Base blockchain activity.

## Features

### Core Features
- **Accurate Neynar Scoring**: Advanced scoring algorithm with engagement rate, power badge, verified addresses
- **Complete FID Metadata**: Profile picture, bio, verified addresses, and full user data
- **Professional UI**: Beautiful gradient backgrounds with dark mode, smooth animations, and loading states
- **Real-time Data**: Live Farcaster social data and Base transaction counts
- **NFT Minting**: Mint your passport as an ERC-721 NFT on Base network
- **Frame V2 Support**: Native integration with Farcaster frames with proper manifest
- **Dynamic Metadata**: NFT metadata updates based on reputation score
- **Dark Mode**: Full dark mode support with theme toggle
- **App Icons**: Professional icons and splash screen for Frame mini app

### 🚀 NEW: Wallet Integration & Transaction Tracking
- **Multi-Wallet Support**: Connect using Farcaster Wallet Kit and Reown Wallet Kit
- **Real-time Transaction Tracking**: Track on-chain transactions using Etherscan V2 API
- **Transaction History**: View ETH transfers, ERC-20 token transfers, and NFT transfers
- **Batch Transactions**: Support for EIP-5792 wallet_sendCalls (multiple transactions in one confirmation)
- **Gas Optimization**: Real-time gas price tracking and optimization suggestions
- **Multi-Chain Support**: Base mainnet with EVM compatibility
- **Transaction Analytics**: Detailed transaction insights with status, value, and timing
- **NFT Mint Tracking**: Track NFT minting transactions and collection activity

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS v4
- **Backend**: Next.js API Routes, Neynar API v2
- **Blockchain**: Base (L2), Solidity, ERC-721
- **Storage**: Upstash Redis for caching
- **Frame**: Farcaster Frames V2
- **Wallet Integration**: Wagmi, Farcaster Mini App SDK, Reown Wallet Kit
- **Transaction Tracking**: Etherscan V2 API, Real-time analytics
- **Web3 Libraries**: Viem, Ethers.js, TanStack Query

## Getting Started

### Prerequisites

- Node.js 18+
- Neynar API Key (get from [neynar.com](https://neynar.com))
- Base RPC access (or use default public RPC)
- Upstash Redis (optional, for caching)
- Wallet with Base ETH for contract deployment

### Installation

1. Clone the repository

2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Copy `.env.example` to `.env.local` and fill in your values:

\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Add your API keys in the environment variables section:
   - `NEYNAR_API_KEY`: Get from [Neynar Dashboard](https://neynar.com)
   - `BASE_RPC_URL`: Use public RPC or get from [Base](https://base.org)
   - Other variables are optional

5. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000)

### Deploy Smart Contract

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick start:

\`\`\`bash
node scripts/deploy-contract.js
\`\`\`

Then update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`

## Reputation Scoring System

The reputation score (0-1000) uses an advanced algorithm:

### Score Components

- **Followers** (max 300 points)
  - First 5000 followers: 0.05 points each
  - Additional followers: 0.01 points each (diminishing returns)

- **Engagement Rate** (max 200 points)
  - Calculated from follower/cast ratio
  - Quality over quantity

- **Casts** (max 150 points)
  - Up to 1000 casts

- **Account Age** (max 150 points)
  - Up to 2 years (730 days)

- **Base Transactions** (max 200 points)
  - Up to 1000 transactions

- **Power Badge** (50 points)
  - Farcaster power badge holders get bonus

- **Verified Addresses** (max 50 points)
  - 10 points per verified address

- **Follower Ratio Bonus** (max 50 points)
  - Rewards accounts with more followers than following

## Badge System

Badges are automatically assigned based on activity:

- **OG**: Power badge + account older than 1 year
- **Onchain**: More than 500 transactions on Base
- **Active**: More than 1000 casts + 180+ days old
- **Builder**: More than 2 verified addresses
- **Newcomer**: Default badge

## API Routes

- `GET /api/score?fid={fid}` - Get reputation score with full metadata
- `POST /api/frame` - Frame V2 handler
- `GET /api/frame/image` - Generate dynamic passport image
- `POST /api/mint` - Initiate NFT minting transaction
- `GET /api/metadata/[tokenId]` - NFT metadata endpoint
- `GET /api/passport-nft/[tokenId]` - Generate NFT image
- `GET /api/transactions` - Transaction tracking endpoint
- `POST /api/transactions` - Batch transaction tracking

## Frame V2 Configuration

The app includes proper Frame V2 configuration:

- `public/.well-known/farcaster.json` - Frame manifest file
- App icons in `/public` (icon.jpg, splash.jpg, etc.)
- Proper metadata in `layout.tsx`
- CORS headers configured for cross-origin Frame access

Update the domain in `farcaster.json` after deployment!

## Smart Contract

The `ReputationPassport.sol` contract features:

- ERC-721 standard compliance
- One passport per FID (anti-double mint)
- On-chain score and badge storage
- Update functionality for reputation changes
- Dynamic metadata URI
- Owner-only admin functions

## Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── score/route.ts          # Scoring engine
│   │   ├── frame/route.ts          # Frame handler
│   │   ├── frame/image/route.tsx   # Frame image generator
│   │   ├── mint/route.ts           # Minting endpoint
│   │   └── metadata/[tokenId]/route.ts
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout with Frame metadata
│   └── globals.css                 # Styles + animations
├── components/
│   ├── passport-generator.tsx      # Main passport component
│   ├── theme-toggle.tsx            # Dark mode toggle
│   └── ui/                         # UI components
├── contracts/
│   └── ReputationPassport.sol      # Smart contract
├── scripts/
│   └── deploy-contract.js          # Deployment script
├── public/
│   ├── .well-known/
│   │   └── farcaster.json          # Frame V2 manifest
│   ├── icon.jpg                    # App icon
│   ├── splash.jpg                  # Splash screen
│   └── ...other icons
├── lib/
│   ├── types.ts                    # TypeScript types
│   └── contract-utils.ts           # Contract utilities
├── .env.example                    # Environment template
├── README.md                       # This file
└── DEPLOYMENT.md                   # Deployment guide
\`\`\`

## Environment Variables

All environment variables are managed through Vercel or `.env.local`:

- `NEXT_PUBLIC_APP_URL`: Your deployed app URL
- `NEYNAR_API_KEY`: Neynar API key (required)
- `BASE_RPC_URL`: Base RPC endpoint (optional, has default)
- `NEXT_PUBLIC_CONTRACT_ADDRESS`: Deployed contract address
- `KV_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_URL`: Upstash Redis (optional)

See `.env.example` for complete list.

## Deployment to Vercel

1. Push your code to GitHub

2. Import project in Vercel

3. Add environment variables in Vercel dashboard or your deployment platform

4. Deploy!

\`\`\`bash
vercel deploy --prod
\`\`\`

5. Update `farcaster.json` with your production domain

## Security Features

- ✅ API keys in environment variables only
- ✅ Rate limiting per FID (with Redis)
- ✅ Score caching (24 hours)
- ✅ CORS headers configured for Frame access
- ✅ Input validation on all endpoints
- ✅ Contract ownership protection
- ✅ No self-destruct in contract
- ✅ Anti-double mint (one passport per FID)

## Performance Optimizations

- Redis caching for scores (24h TTL)
- User profile caching (12h TTL)
- Metadata caching (1h TTL)
- Parallel API calls where possible
- Optimized image generation

## UI Features

- **Dark Mode**: Toggle between light and dark themes
- **Smooth Animations**: Blob background animations and fade-in effects
- **Loading States**: Professional skeleton loaders
- **Responsive Design**: Works on all screen sizes
- **Gradient Backgrounds**: Beautiful violet, fuchsia, and cyan gradients
- **Professional Icons**: App icons for Frame mini app experience

## Launch Checklist

See the [Product Finalization Guide](./PRODUCT_FINALIZATION.md) for complete launch checklist including:

- Value proposition validation
- Security audit
- Testing strategy
- Analytics setup
- Anti-spam measures
- Launch strategy

## Testing

### Local Testing

1. Start dev server: `npm run dev`
2. Enter test FID (try: 3, 2, 1)
3. Generate passport
4. Check console for debug logs
5. Test dark mode toggle

### Staging Testing

1. Deploy to Vercel preview
2. Test with real Farcaster account
3. Test Frame in Warpcast
4. Test minting flow
5. Verify Frame manifest loads correctly

### Production Testing

1. Test with small account first
2. Test with OG account
3. Verify contract on BaseScan
4. Monitor for spam/abuse
5. Test Frame in multiple Farcaster clients

## Troubleshooting

### "Failed to fetch Farcaster data"

- Check `NEYNAR_API_KEY` is set correctly in the **Vars** section
- Verify API key has sufficient credits
- Check Neynar API status

### "User not found"

- Verify FID exists on Farcaster
- Try a known FID like 3 (dwr.eth)

### "Transaction failed"

- Ensure wallet has Base ETH
- Check contract address is correct
- Verify network is Base (chainId: 8453)

### CORS Errors

- CORS is configured globally in `next.config.mjs`
- All API routes include CORS headers
- Frame endpoints support cross-origin requests

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Test thoroughly
5. Submit pull request

## Roadmap

- [ ] Leaderboard of top scores
- [ ] Historical score tracking
- [ ] Score badges/achievements
- [ ] Social sharing improvements
- [ ] Multi-chain support
- [ ] Reputation staking

## License

MIT

## Support

- GitHub Issues: [Report bugs](https://github.com/yourusername/farcaster-passport/issues)
- Documentation: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- Farcaster: Cast @yourhandle

---

Built with ❤️ for the Farcaster community

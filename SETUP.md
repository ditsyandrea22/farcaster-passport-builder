# Setup Guide

## Quick Start

This app is ready to run immediately in demo mode with mock data. Follow these steps to enable full functionality:

## Environment Variables

Add these in the **Vars** section:

### Required for Production

1. **NEYNAR_API_KEY** (Required for real Farcaster data)
   - Get your API key at [neynar.com](https://neynar.com)
   - Free tier available
   - Without this, the app will use mock data for testing

2. **BASE_RPC_URL** (Optional, has default)
   - Default: `https://mainnet.base.org`
   - For better reliability, use Alchemy or Infura Base RPC

3. **NEXT_PUBLIC_APP_URL** (Auto-configured)
   - Automatically set to your preview URL
   - Change when deploying to production

### Required for NFT Minting

4. **NEXT_PUBLIC_CONTRACT_ADDRESS**
   - Deploy the smart contract first (see below)
   - Add the deployed contract address here

## Smart Contract Deployment

The contract is located in `contracts/ReputationPassport.sol`

### Using Remix (Easy)
1. Go to [remix.ethereum.org](https://remix.ethereum.org)
2. Copy the contract code from `contracts/ReputationPassport.sol`
3. Compile with Solidity 0.8.20+
4. Deploy to Base network
5. Use your app URL + `/api/metadata` as the `_baseTokenURI` parameter
6. Copy the deployed address to `NEXT_PUBLIC_CONTRACT_ADDRESS`

### Using Hardhat
\`\`\`bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat run scripts/deploy-contract.js --network base
\`\`\`

## Testing Without API Keys

The app works without API keys and will:
- Generate mock reputation data
- Show demo scores and badges
- Display all UI components
- Allow testing the full user experience

## Features Available in Demo Mode

- ✅ UI and layout
- ✅ Passport generation with mock data
- ✅ Score calculation display
- ✅ Badge system preview
- ✅ Frame image generation
- ❌ Real Farcaster data (needs NEYNAR_API_KEY)
- ❌ Real on-chain transactions (needs BASE_RPC_URL)
- ❌ NFT minting (needs contract deployment)

## Production Checklist

- [ ] Add NEYNAR_API_KEY in Vars section
- [ ] Deploy smart contract to Base
- [ ] Add NEXT_PUBLIC_CONTRACT_ADDRESS in Vars
- [ ] Test with real FIDs
- [ ] Deploy to Vercel
- [ ] Update NEXT_PUBLIC_APP_URL for production
- [ ] Test Frame in Warpcast

## Support

For issues, check:
1. Environment variables are set correctly in Vars
2. API keys are valid
3. Contract is deployed to Base mainnet (not testnet)

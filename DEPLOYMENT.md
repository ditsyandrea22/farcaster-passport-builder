# Deployment Guide

Complete guide for deploying Farcaster Reputation Passport to production.

## Pre-Deployment Checklist

### 1. API Keys & Credentials

- [ ] Neynar API Key obtained from [neynar.com](https://neynar.com)
- [ ] Base RPC URL (or use default public RPC)
- [ ] Upstash Redis account created (optional but recommended)
- [ ] Wallet with Base ETH for contract deployment

### 2. Code Ready

- [ ] All environment variables configured
- [ ] Smart contract tested locally
- [ ] API endpoints tested
- [ ] UI tested on multiple devices
- [ ] Frame metadata validated

### 3. Security Review

- [ ] API keys not in code
- [ ] CORS configured correctly
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Contract has no self-destruct
- [ ] Contract ownership protected

## Step 1: Deploy Smart Contract

### Option A: Using Hardhat

1. Install Hardhat:

\`\`\`bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
\`\`\`

2. Create `hardhat.config.js`:

\`\`\`javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY
    }
  }
};
\`\`\`

3. Deploy:

\`\`\`bash
npx hardhat run scripts/deploy-contract.js --network base
\`\`\`

### Option B: Using Remix

1. Go to [remix.ethereum.org](https://remix.ethereum.org)
2. Create new file `ReputationPassport.sol`
3. Paste contract code from `contracts/ReputationPassport.sol`
4. Compile with Solidity 0.8.20+
5. Connect wallet to Base network
6. Deploy with constructor parameter: your app URL
7. Copy deployed contract address

### Verify Contract

Verify on BaseScan for transparency:

\`\`\`bash
npx hardhat verify --network base DEPLOYED_CONTRACT_ADDRESS "https://your-app-url.vercel.app"
\`\`\`

Or manually on [BaseScan](https://basescan.org):
1. Go to your contract address
2. Click "Contract" → "Verify and Publish"
3. Paste contract code
4. Enter compiler version and constructor arguments

## Step 2: Configure Environment Variables

### Vercel Dashboard

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following:

\`\`\`env
# Required
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEYNAR_API_KEY=your_neynar_api_key
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Optional but Recommended
BASE_RPC_URL=https://mainnet.base.org
KV_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_token
KV_REST_API_URL=your_upstash_rest_url

# Optional
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
\`\`\`

### Local Development

Create `.env.local`:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Then edit with your actual values.

## Step 3: Deploy to Vercel

### Via GitHub

1. Push code to GitHub:

\`\`\`bash
git add .
git commit -m "Ready for production"
git push origin main
\`\`\`

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Add environment variables
6. Click "Deploy"

### Via Vercel CLI

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
\`\`\`

## Step 4: Post-Deployment Testing

### Test Checklist

- [ ] Visit deployed URL
- [ ] Test with known FID (try: 3, 2, 1)
- [ ] Generate passport successfully
- [ ] Check score calculation
- [ ] Verify profile data loads
- [ ] Test Frame in Warpcast
- [ ] Test minting flow
- [ ] Check contract interaction
- [ ] Verify BaseScan shows transaction

### Frame Testing in Warpcast

1. Cast your app URL
2. Frame should appear automatically
3. Click "Generate Passport"
4. Should show your passport
5. Test "Mint NFT" button
6. Verify transaction completes

## Step 5: Monitoring & Analytics

### Add Analytics

In `app/layout.tsx`, add your analytics:

\`\`\`tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
\`\`\`

### Monitor API Usage

Track in Vercel Analytics:
- API endpoint response times
- Error rates
- Most called endpoints

### Monitor Neynar Credits

Check your Neynar dashboard regularly:
- API calls used
- Remaining credits
- Upgrade if needed

## Step 6: Security Hardening

### Rate Limiting

Implement with Upstash Redis:

\`\`\`typescript
// lib/rate-limit.ts
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function rateLimit(fid: string) {
  const key = `ratelimit:${fid}`
  const count = await redis.incr(key)
  
  if (count === 1) {
    await redis.expire(key, 86400) // 24 hours
  }
  
  return count <= 10 // Max 10 per day
}
\`\`\`

### Error Logging

Add error tracking with Sentry:

\`\`\`bash
npm install @sentry/nextjs
\`\`\`

Configure in `sentry.client.config.ts`:

\`\`\`typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
\`\`\`

## Step 7: Launch Strategy

### Soft Launch

1. Share with small group first
2. Monitor for bugs
3. Check server load
4. Verify all features work

### Public Launch

Cast your launch message:

\`\`\`
🪪 Introducing Farcaster Reputation Passport

Your Farcaster + Base activity,
now as an on-chain identity.

• 1 click generation
• Real reputation data
• Mint on Base

Try it: [your-url]
\`\`\`

Tag relevant accounts:
- @farcaster
- @base
- @builders

### Growth Tactics

- Share top scores leaderboard
- "Score > 800 = Elite" campaign
- Viral sharing mechanics
- Community engagement

## Step 8: Maintenance

### Daily

- [ ] Check error logs
- [ ] Monitor API usage
- [ ] Check Neynar credits

### Weekly

- [ ] Review analytics
- [ ] Check contract activity
- [ ] Update any dependencies
- [ ] Respond to user feedback

### Monthly

- [ ] Security audit
- [ ] Performance optimization
- [ ] Feature updates
- [ ] Community updates

## Troubleshooting

### Deployment Fails

**Error: Environment variable not set**
- Solution: Add missing env var in Vercel dashboard

**Error: Build failed**
- Check Node.js version (must be 18+)
- Run `npm run build` locally first

### Contract Issues

**Transaction reverts**
- Check wallet has Base ETH
- Verify contract address
- Ensure correct network (Base, chainId 8453)

**User already minted**
- This is expected (one passport per FID)
- Show appropriate message to user

### API Issues

**Neynar rate limit exceeded**
- Implement caching with Redis
- Upgrade Neynar plan
- Add rate limiting per FID

**Slow API response**
- Enable Redis caching
- Use parallel API calls
- Optimize score calculation

### Frame Issues

**Frame not rendering**
- Verify Frame metadata in HTML
- Check image URL is accessible
- Test in Warpcast Frame Validator

**Buttons not working**
- Verify POST endpoint is correct
- Check button action URLs
- Test Frame responses

## Rollback Plan

If critical issues occur:

1. Revert to previous deployment:
\`\`\`bash
vercel rollback
\`\`\`

2. Or redeploy specific commit:
\`\`\`bash
vercel deploy --prod
\`\`\`

3. Disable features via environment variables

## Support

For deployment issues:
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Base Support: [base.org/discord](https://base.org/discord)
- Neynar Support: [neynar.com](https://neynar.com)

---

**Ready to launch?** Follow this guide step-by-step and you'll have a production-ready app!

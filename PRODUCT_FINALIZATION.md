# Product Finalization Checklist

Complete checklist for launching Farcaster Reputation Passport based on production best practices.

## 1. Value Proposition

**Statement**: "Your on-chain reputation passport, powered by Farcaster + Base."

### Validation Checklist

- [ ] User understands value in 3 seconds
- [ ] Clear differentiation from generic NFTs
- [ ] Explains "why Farcaster + Base" matters
- [ ] Value proposition visible on landing page
- [ ] Frame title communicates value

## 2. UX Requirements

### Core Flow

- [ ] **1 click generate** - Enter FID and click
- [ ] **1 click mint** - Single button to mint
- [ ] **1 click share** - Share to Farcaster directly
- [ ] **No manual login** - Works without auth
- [ ] **No manual wallet connect** - Frame handles it

### User Journey

\`\`\`
Land on page → Enter FID → Generate (3s) → View passport → Mint (5s) → Done
\`\`\`

**Maximum time**: 15 seconds total

### Edge Cases

- [ ] FID doesn't exist - clear error message
- [ ] Network error - retry option
- [ ] Slow loading - skeleton loader
- [ ] Already minted - show existing passport
- [ ] Invalid input - validation message

## 3. Security & Trust

### Smart Contract Security

- [ ] `mintPassport` has anti-double mint (FID → 1 NFT)
- [ ] No `selfdestruct` function
- [ ] `updateScore` restricted to `onlyOwner`
- [ ] Deployed on Base mainnet
- [ ] Contract verified on BaseScan
- [ ] Ownership properly transferred

### Backend Security

- [ ] API keys not exposed in frontend
- [ ] Rate limiting implemented (10 requests/FID/day)
- [ ] Score caching enabled (24 hours)
- [ ] API timeout handling (10 seconds)
- [ ] Input sanitization on all endpoints
- [ ] CORS configured correctly

### Audit Checklist

\`\`\`bash
# Run security checks
npm audit
npm audit fix

# Check for exposed secrets
git secrets --scan

# Test rate limiting
for i in {1..15}; do curl /api/score?fid=1; done
\`\`\`

## 4. Infrastructure

### Hosting

- [ ] Deployed on Vercel
- [ ] Region: `sfo1` (near Farcaster infrastructure)
- [ ] Auto-scaling enabled
- [ ] CDN configured

### Environment Variables

Required:
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEYNAR_API_KEY`
- [ ] `NEXT_PUBLIC_CONTRACT_ADDRESS`

Optional but recommended:
- [ ] `BASE_RPC_URL`
- [ ] `KV_URL` (Redis caching)
- [ ] `KV_REST_API_TOKEN`
- [ ] `KV_REST_API_URL`

### Caching Strategy

- [ ] **Score cache**: 24 hours (Upstash Redis)
- [ ] **User profile cache**: 12 hours
- [ ] **NFT metadata cache**: 1 hour
- [ ] **In-memory fallback** if Redis unavailable

Implementation:

\`\`\`typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function getCachedScore(fid: string) {
  const cached = await redis.get(`score:${fid}`)
  if (cached) return cached
  
  const score = await calculateScore(fid)
  await redis.setex(`score:${fid}`, 86400, score) // 24h
  return score
}
\`\`\`

## 5. NFT Image Quality

### Design Requirements

- [ ] Dark theme background
- [ ] Large, prominent score number
- [ ] Clear badge display
- [ ] Username easily readable
- [ ] Square aspect ratio (1:1)
- [ ] Frame-friendly layout
- [ ] High contrast colors
- [ ] Professional typography

### Validation Test

Post passport image in Farcaster feed:
- Does it grab attention? ✅/❌
- Is score readable on mobile? ✅/❌
- Do colors look good? ✅/❌

**If any ❌, redesign image.**

## 6. NFT Metadata Standard

### OpenSea Compliance

\`\`\`json
{
  "name": "Farcaster Reputation Passport #123",
  "description": "On-chain reputation for @username (FID: 123)",
  "image": "https://app-url.com/api/passport-nft/123",
  "attributes": [
    {
      "trait_type": "Score",
      "value": 850
    },
    {
      "trait_type": "Badge",
      "value": "OG"
    },
    {
      "trait_type": "Followers",
      "value": 5000
    },
    {
      "trait_type": "Account Age (days)",
      "value": 730
    }
  ]
}
\`\`\`

### Marketplace Checklist

- [ ] Works on OpenSea
- [ ] Works on Zora
- [ ] Visible on BaseScan
- [ ] Image renders correctly
- [ ] Attributes display properly

## 7. Frame V2 Compliance

### Required Elements

- [ ] POST handler responds correctly
- [ ] GET handler returns valid HTML
- [ ] Image URL always accessible
- [ ] Maximum 4 buttons
- [ ] TX action uses `eth_sendTransaction`
- [ ] Chain ID correct (8453 = Base)
- [ ] Splash image configured
- [ ] Splash background color set

### Frame Testing

Test in:
- [ ] Warpcast mobile
- [ ] Warpcast desktop
- [ ] Frame Validator tool

### Frame Metadata

\`\`\`typescript
{
  version: "next",
  imageUrl: "https://app/api/frame/image?fid=123",
  button: {
    title: "Generate Passport",
    action: {
      type: "post",
      url: "https://app/api/frame"
    }
  }
}
\`\`\`

## 8. Testing Strategy

### Local Testing

- [ ] Mock FID data works
- [ ] API returns expected format
- [ ] UI renders correctly
- [ ] Animations work smoothly
- [ ] Loading states display

### Staging Testing

- [ ] Real Farcaster account data
- [ ] Base testnet transactions
- [ ] Frame renders in Warpcast
- [ ] Error handling works
- [ ] Edge cases handled

### Production Testing

- [ ] Test with small account (< 100 followers)
- [ ] Test with medium account (100-1000 followers)
- [ ] Test with OG account (> 1 year old)
- [ ] Test spam prevention (multiple mints)
- [ ] Load testing (concurrent requests)

### Load Testing Script

\`\`\`bash
# Install autocannon
npm i -g autocannon

# Test score endpoint
autocannon -c 100 -d 30 https://your-app.com/api/score?fid=1
\`\`\`

Expected: < 500ms response time

## 9. Analytics Tracking

### Events to Track

- [ ] Frame opened
- [ ] Generate button clicked
- [ ] Generate success
- [ ] Generate error
- [ ] Mint button clicked
- [ ] Mint success
- [ ] Mint error
- [ ] Share button clicked

### Implementation

\`\`\`typescript
// lib/analytics.ts
export function trackEvent(event: string, properties?: any) {
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track(event, properties)
  }
}

// Usage
trackEvent('passport_generated', { fid, score, badge })
\`\`\`

### Tools

Choose one:
- [ ] Vercel Analytics
- [ ] PostHog
- [ ] Custom logging with Upstash

## 10. Anti-Spam & Anti-Abuse

### Protections Implemented

- [ ] Max 1 passport per FID (contract level)
- [ ] Cooldown period: 24 hours between regenerations
- [ ] Score cap: 1000 maximum
- [ ] API rate limit: 10 requests/FID/day
- [ ] Reject empty or invalid FIDs
- [ ] Reject FID < 1

### Spam Testing

Try to:
- [ ] Mint twice with same FID (should fail)
- [ ] Generate 100 times rapidly (should rate limit)
- [ ] Use invalid FID (should reject)
- [ ] Use FID 0 (should reject)

## 11. Trust Signals

### Before Launch

- [ ] Contract verified on BaseScan
- [ ] GitHub repo public (or README public)
- [ ] Clear "About" section
- [ ] No mint fee for MVP
- [ ] Posted from verified account
- [ ] Team/builder info visible

### Launch Post Template

\`\`\`
🪪 Farcaster Reputation Passport

I just launched a way to mint your Farcaster + Base 
reputation as an on-chain NFT.

✅ Free to mint
✅ 1-click generation
✅ Real on-chain data

Try it: [your-url]

Contract: [basescan-link]
Verified ✓
\`\`\`

## 12. Launch Strategy

### Phase 1: Soft Launch (Day 1-3)

- [ ] Post to personal Farcaster
- [ ] Share in builder channels
- [ ] Tag 5-10 close friends
- [ ] Monitor for bugs
- [ ] Gather feedback

### Phase 2: Community Launch (Day 4-7)

- [ ] Post with mentions: @farcaster @base @builders
- [ ] Share in relevant channels
- [ ] Reply to all comments
- [ ] Fix any issues quickly

### Phase 3: Viral Push (Day 8-14)

- [ ] Create "Top 100 OG Passports" leaderboard
- [ ] Run "Score > 800 = Elite" campaign
- [ ] Share top scores daily
- [ ] Engage with users who share

### Launch Metrics to Track

- Day 1: __ frames opened, __ passports generated, __ minted
- Day 7: __ total users, __ conversion rate
- Day 14: __ organic shares, __ viral coefficient

## 13. Copywriting

### Landing Page

**Hero**:
\`\`\`
Farcaster Reputation Passport

Your on-chain reputation identity powered by Farcaster + Base

[Enter your FID] [Generate →]
\`\`\`

**Features**:
- Real Data: Accurate score from Farcaster + Base
- Instant Mint: Generate and mint in seconds
- Shareable: Show off your reputation

### Frame Launch Cast

\`\`\`
🪪 Introducing Farcaster Reputation Passport

Your Farcaster + Base activity,
now as an on-chain identity.

• 1 click
• No wallet connect  
• Mint on Base

Try it 👇
[Frame appears]
\`\`\`

### Share Auto-Text

\`\`\`
My Farcaster Reputation Score is {score} 🟢
Minted as an on-chain passport.

Check yours: [your-url]
\`\`\`

## Pre-Launch Final Checks

### 24 Hours Before

- [ ] All tests passing
- [ ] Analytics configured
- [ ] Error monitoring active
- [ ] Rate limiting tested
- [ ] Cache working
- [ ] Contract verified
- [ ] Env vars set in production

### 1 Hour Before

- [ ] Test with real FID
- [ ] Verify Frame works
- [ ] Check mint flow end-to-end
- [ ] Prepare launch cast
- [ ] Screenshot working passport

### Launch

- [ ] Post launch cast
- [ ] Monitor analytics
- [ ] Respond to users
- [ ] Fix issues immediately

## Post-Launch

### First Week

- [ ] Daily check of analytics
- [ ] Respond to all feedback
- [ ] Fix critical bugs within 1 hour
- [ ] Share user success stories

### First Month

- [ ] Collect feature requests
- [ ] Plan v2 features
- [ ] Optimize performance
- [ ] Grow community

---

**Ready to launch?** Check every box, then ship it! 🚀

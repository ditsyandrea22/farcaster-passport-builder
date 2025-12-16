import { OnChainTransaction, TransactionAnalysis } from './etherscan-v2'

// Contract ABIs and function signatures for better analysis
const KNOWN_FUNCTION_SIGNATURES = {
  '0xa9059cbb': 'transfer',
  '0x23b872dd': 'transferFrom',
  '0x40c10f19': 'mint',
  '0x42966c68': 'burn',
  '0x095ea7b3': 'approve',
  '0xdd62ed3e': 'allowance',
  '0x18160ddd': 'totalSupply',
  '0x70a08231': 'balanceOf',
  '0x8f283970': 'initialize',
  '0x4f1ef286': 'deposit',
  '0x2e1a7d4d': 'withdraw',
  '0x3593564c': 'claim',
  '0x3ccfd60b': 'execute',
  '0xb61d27f6': 'execute',
  '0x7ff36ab5': 'swapExactETHForTokens',
  '0x38ed1739': 'swapExactTokensForTokens',
  '0x18084a5a': 'swapExactTokensForETH'
}

// Common contract addresses and their types
const KNOWN_CONTRACTS = {
  '0xa0b86a33e6dd8d6d4d1a8a1e5e8b4c7d1e5f2a3c': 'Uniswap V2',
  '0x88e6a0c0ddd26eeb1434a7e7e7e7e7e7e7e7e7e7e': 'Uniswap V3',
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V2 Router',
  '0xe592427a0aece92de3eddee1b18cbbc3389c9a9a': 'Uniswap V3 Router',
  '0x0000000000000000000000000000000000000000': 'ETH Transfer'
}

export interface TransactionPattern {
  type: 'defi' | 'nft' | 'eth_transfer' | 'token_transfer' | 'contract_interaction' | 'unknown'
  protocol?: string
  action?: string
  risk_level: 'low' | 'medium' | 'high'
  description: string
}

export interface OnChainReputation {
  score: number
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'legendary'
  badges: string[]
  insights: {
    oldest_transaction: number
    most_active_day: string
    favorite_protocol: string
    defi_activity_score: number
    nft_activity_score: number
    total_volume_eth: string
    unique_contracts_interacted: number
  }
  patterns: TransactionPattern[]
}

class OnChainAnalyzer {
  
  analyzeTransaction(tx: OnChainTransaction): TransactionPattern {
    const { input, contractAddress, to, value, isError } = tx
    
    // High risk transactions
    if (isError) {
      return {
        type: 'contract_interaction',
        risk_level: 'high',
        description: 'Failed transaction - possible failed contract interaction'
      }
    }
    
    // ETH Transfer
    if (!contractAddress && value !== '0') {
      return {
        type: 'eth_transfer',
        risk_level: 'low',
        description: `ETH transfer of ${this.formatEth(value)} ETH`
      }
    }
    
    // Contract interaction
    if (contractAddress && contractAddress !== '0x') {
      const functionSignature = input.substring(0, 10)
      const knownFunction = KNOWN_FUNCTION_SIGNATURES[functionSignature as keyof typeof KNOWN_FUNCTION_SIGNATURES]
      const knownProtocol = KNOWN_CONTRACTS[contractAddress.toLowerCase() as keyof typeof KNOWN_CONTRACTS]
      
      // Determine transaction type based on function signature
      let txType: TransactionPattern['type'] = 'contract_interaction'
      let protocol = knownProtocol
      let action = knownFunction
      let risk: TransactionPattern['risk_level'] = 'medium'
      let description = 'Contract interaction'
      
      if (knownFunction) {
        switch (knownFunction) {
          case 'transfer':
          case 'transferFrom':
            txType = 'token_transfer'
            action = `${knownFunction} token`
            risk = 'low'
            description = `Token transfer via ${protocol || 'unknown contract'}`
            break
          case 'mint':
            txType = 'defi'
            action = 'mint tokens'
            risk = 'medium'
            description = `Token minting via ${protocol || 'unknown contract'}`
            break
          case 'burn':
            txType = 'defi'
            action = 'burn tokens'
            risk = 'medium'
            description = `Token burning via ${protocol || 'unknown contract'}`
            break
          case 'approve':
            txType = 'defi'
            action = 'approve token spending'
            risk = 'high' // Approve transactions can be risky
            description = `Token approval via ${protocol || 'unknown contract'}`
            break
          case 'swapExactETHForTokens':
          case 'swapExactTokensForTokens':
          case 'swapExactTokensForETH':
            txType = 'defi'
            action = 'token swap'
            risk = 'medium'
            description = `Token swap via ${protocol || 'DEX'}`
            break
          case 'deposit':
          case 'withdraw':
            txType = 'defi'
            action = knownFunction
            risk = 'medium'
            description = `Liquidity ${knownFunction} via ${protocol || 'DeFi protocol'}`
            break
          default:
            txType = 'contract_interaction'
            action = knownFunction
            description = `${knownFunction} via ${protocol || 'contract'}`
        }
      } else {
        // Unknown function - could be custom contract
        description = `Unknown contract interaction (${functionSignature})`
        risk = 'high'
      }
      
      return {
        type: txType,
        protocol,
        action,
        risk_level: risk,
        description
      }
    }
    
    return {
      type: 'unknown',
      risk_level: 'medium',
      description: 'Unknown transaction type'
    }
  }

  analyzeTransactionPatterns(transactions: OnChainTransaction[]): TransactionPattern[] {
    return transactions.map(tx => this.analyzeTransaction(tx))
  }

  calculateReputationScore(analysis: TransactionAnalysis, patterns: TransactionPattern[], transactions: OnChainTransaction[]): OnChainReputation {
    const { totalTransactions, totalValue, contractInteractions, errorTransactions } = analysis
    
    // Base score calculation
    let score = 0
    
    // Transaction volume bonus
    const txVolumeScore = Math.min(totalTransactions * 2, 200)
    score += txVolumeScore
    
    // Contract interaction bonus (shows sophistication)
    const contractScore = Math.min(contractInteractions * 3, 150)
    score += contractScore
    
    // Volume bonus (logarithmic to prevent huge advantage to whales)
    const volume = parseFloat(this.formatEth(totalValue))
    const volumeScore = Math.log10(volume + 1) * 20
    score += volumeScore
    
    // Penalty for failed transactions
    const errorPenalty = errorTransactions * 5
    score -= errorPenalty
    
    // Pattern-based bonuses
    const defiPatternCount = patterns.filter(p => p.type === 'defi').length
    const nftPatternCount = patterns.filter(p => p.type === 'nft').length
    const highRiskCount = patterns.filter(p => p.risk_level === 'high').length
    
    score += Math.min(defiPatternCount * 5, 50) // DeFi interaction bonus
    score += Math.min(nftPatternCount * 8, 80)  // NFT activity bonus
    score -= Math.min(highRiskCount * 3, 30)   // High-risk penalty
    
    // Ensure score is non-negative
    score = Math.max(0, Math.round(score))
    
    // Determine level
    let level: OnChainReputation['level']
    if (score < 50) level = 'beginner'
    else if (score < 150) level = 'intermediate'
    else if (score < 300) level = 'advanced'
    else if (score < 500) level = 'expert'
    else level = 'legendary'
    
    // Generate badges
    const badges = this.generateBadges(analysis, patterns, score)
    
    // Generate insights
    const insights = this.generateInsights(analysis, patterns, transactions)
    
    return {
      score,
      level,
      badges,
      insights,
      patterns
    }
  }

  private generateBadges(analysis: TransactionAnalysis, patterns: TransactionPattern[], score: number): string[] {
    const badges: string[] = []
    const { totalTransactions, contractInteractions, totalValue } = analysis
    
    // Transaction-based badges
    if (totalTransactions >= 1) badges.push('First Transaction')
    if (totalTransactions >= 10) badges.push('Active User')
    if (totalTransactions >= 50) badges.push('Veteran')
    if (totalTransactions >= 100) badges.push('Legendary')
    
    // Contract interaction badges
    if (contractInteractions >= 5) badges.push('DeFi Explorer')
    if (contractInteractions >= 20) badges.push('Contract Master')
    if (contractInteractions >= 50) badges.push('Protocol Navigator')
    
    // Pattern-based badges
    const defiCount = patterns.filter(p => p.type === 'defi').length
    const nftCount = patterns.filter(p => p.type === 'nft').length
    const ethTransferCount = patterns.filter(p => p.type === 'eth_transfer').length
    
    if (defiCount >= 10) badges.push('DeFi Enthusiast')
    if (nftCount >= 5) badges.push('NFT Collector')
    if (ethTransferCount >= 20) badges.push('ETH Mover')
    
    // Volume-based badges
    const volume = parseFloat(this.formatEth(totalValue))
    if (volume >= 1) badges.push('Whale Watcher')
    if (volume >= 10) badges.push('High Roller')
    if (volume >= 100) badges.push('Mega Whale')
    
    // Score-based badges
    if (score >= 100) badges.push('On-Chain Veteran')
    if (score >= 250) badges.push('Blockchain Expert')
    if (score >= 500) badges.push('Crypto Legend')
    
    return [...new Set(badges)] // Remove duplicates
  }

  private generateInsights(analysis: TransactionAnalysis, patterns: TransactionPattern[], transactions: OnChainTransaction[]): OnChainReputation['insights'] {
    const { totalValue, contractInteractions } = analysis
    
    // Find most active day
    const dayCounts: Record<string, number> = {}
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp * 1000)
      const day = date.toLocaleDateString('en-US', { weekday: 'long' })
      dayCounts[day] = (dayCounts[day] || 0) + 1
    })
    const mostActiveDay = Object.entries(dayCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['Unknown', 0])[0]
    
    // Find favorite protocol
    const protocolCounts: Record<string, number> = {}
    patterns.forEach(pattern => {
      if (pattern.protocol) {
        protocolCounts[pattern.protocol] = (protocolCounts[pattern.protocol] || 0) + 1
      }
    })
    const favoriteProtocol = Object.entries(protocolCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['None', 0])[0]
    
    // Calculate activity scores
    const defiScore = Math.min(patterns.filter(p => p.type === 'defi').length * 10, 100)
    const nftScore = Math.min(patterns.filter(p => p.type === 'nft').length * 15, 100)
    
    // Count unique contracts
    const uniqueContracts = new Set(transactions.map(tx => tx.contractAddress || tx.to)).size
    
    return {
      oldest_transaction: transactions.length > 0 ? Math.min(...transactions.map(tx => tx.timestamp)) : 0,
      most_active_day: mostActiveDay,
      favorite_protocol: favoriteProtocol,
      defi_activity_score: defiScore,
      nft_activity_score: nftScore,
      total_volume_eth: this.formatEth(totalValue),
      unique_contracts_interacted: uniqueContracts
    }
  }

  private formatEth(weiString: string): string {
    try {
      const wei = BigInt(weiString)
      const ether = Number(wei) / 1e18
      return ether.toFixed(4)
    } catch {
      return '0'
    }
  }

  // Enhanced analysis that includes reputation scoring
  analyzeWithReputation(transactions: OnChainTransaction[]): {
    analysis: TransactionAnalysis
    patterns: TransactionPattern[]
    reputation: OnChainReputation
  } {
    const analysis: TransactionAnalysis = {
      totalTransactions: transactions.length,
      totalGasUsed: transactions.reduce((sum, tx) => sum + BigInt(tx.gasUsed), 0n).toString(),
      totalValue: transactions.reduce((sum, tx) => sum + BigInt(tx.value), 0n).toString(),
      averageGasPrice: transactions.length > 0 
        ? (transactions.reduce((sum, tx) => sum + BigInt(tx.gasPrice), 0n) / BigInt(transactions.length)).toString()
        : '0',
      contractInteractions: transactions.filter(tx => tx.contractAddress && tx.contractAddress !== '0x').length,
      errorTransactions: transactions.filter(tx => tx.isError).length,
      firstTransaction: transactions.length > 0 ? transactions.reduce((a, b) => a.timestamp < b.timestamp ? a : b) : undefined,
      latestTransaction: transactions.length > 0 ? transactions.reduce((a, b) => a.timestamp > b.timestamp ? a : b) : undefined,
      transactionTypes: {
        contract: transactions.filter(tx => tx.contractAddress && tx.contractAddress !== '0x' && tx.input !== '0x').length,
        ethTransfer: transactions.filter(tx => !tx.contractAddress && tx.value !== '0').length,
        tokenTransfer: transactions.filter(tx => tx.contractAddress && tx.input === '0x').length,
        other: transactions.filter(tx => !tx.contractAddress && tx.value === '0').length
      }
    }

    const patterns = this.analyzeTransactionPatterns(transactions)
    const reputation = this.calculateReputationScore(analysis, patterns, transactions)

    return {
      analysis,
      patterns,
      reputation
    }
  }
}

// Export singleton instance
export const onChainAnalyzer = new OnChainAnalyzer()
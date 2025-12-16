import { etherscanV2 } from './etherscan-v2'
import { onChainAnalyzer, OnChainReputation, TransactionPattern } from './onchain-analyzer'

export interface TransactionRecord {
  fid: number
  txHash: string
  timestamp: string
  score: number
  badge: string
  userAddress: string
}

export interface OnChainHistoryData {
  transactions: any[]
  analysis: any
  reputation: OnChainReputation
  patterns: TransactionPattern[]
  lastUpdated: string
  source: 'etherscan' | 'cache'
}

export interface EnhancedTransactionSummary {
  // Local storage data
  totalTransactions: number
  latestTransaction?: TransactionRecord
  badges: string[]
  
  // On-chain data
  onChainTransactions: number
  onChainAnalysis: any
  onChainReputation: OnChainReputation
  transactionPatterns: TransactionPattern[]
  
  // Combined data
  totalValueEth: string
  contractInteractions: number
  firstTransaction?: any
  latestOnChainTransaction?: any
  
  // Metadata
  lastUpdated: string
  dataSource: 'local' | 'onchain' | 'hybrid'
}

class EnhancedTransactionHistory {
  private storageKey = 'farcaster_passport_transactions'
  private onChainCache = new Map<string, OnChainHistoryData>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  private getStorageData(): Record<string, TransactionRecord[]> {
    if (typeof window === 'undefined') return {}
    
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.warn('Failed to read transaction history from localStorage')
      return {}
    }
  }

  private saveStorageData(data: Record<string, TransactionRecord[]>): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save transaction history to localStorage')
    }
  }

  private isCacheValid(cacheEntry: OnChainHistoryData): boolean {
    return Date.now() - new Date(cacheEntry.lastUpdated).getTime() < this.CACHE_DURATION
  }

  addTransaction(record: TransactionRecord) {
    if (typeof window === 'undefined') return // Skip on server side
    
    const data = this.getStorageData()
    const key = record.fid.toString()
    
    if (!data[key]) {
      data[key] = []
    }
    
    // Avoid duplicates
    const existingIndex = data[key].findIndex(tx => tx.txHash === record.txHash)
    if (existingIndex === -1) {
      data[key].push(record)
      this.saveStorageData(data)
    }
  }

  getTransactions(fid: number): TransactionRecord[] {
    const data = this.getStorageData()
    const key = fid.toString()
    return data[key] || []
  }

  getTotalTransactions(fid: number): number {
    return this.getTransactions(fid).length
  }

  getLatestTransaction(fid: number): TransactionRecord | undefined {
    const transactions = this.getTransactions(fid)
    return transactions.length > 0 ? transactions[transactions.length - 1] : undefined
  }

  // Enhanced badges based on both local and on-chain data
  getTransactionBadges(fid: number, onChainReputation?: OnChainReputation): string[] {
    const localBadges = this.getLocalBadges(fid)
    const onChainBadges = onChainReputation?.badges || []
    
    // Combine and deduplicate badges
    return [...new Set([...localBadges, ...onChainBadges])]
  }

  private getLocalBadges(fid: number): string[] {
    const totalTx = this.getTotalTransactions(fid)
    const badges: string[] = []

    if (totalTx >= 1) badges.push("First Mint")
    if (totalTx >= 3) badges.push("Collector")
    if (totalTx >= 5) badges.push("Veteran")
    if (totalTx >= 10) badges.push("Legend")
    if (totalTx >= 20) badges.push("Master")

    return badges
  }

  // Get on-chain transaction history for an address
  async getOnChainHistory(address: string, fid?: number): Promise<OnChainHistoryData | null> {
    try {
      // Check cache first
      const cached = this.onChainCache.get(address)
      if (cached && this.isCacheValid(cached)) {
        return cached
      }

      // Fetch from Etherscan
      const { transactions, analysis } = await etherscanV2.getFullTransactionHistory(address)
      const reputationData = onChainAnalyzer.analyzeWithReputation(transactions)
      
      const onChainData: OnChainHistoryData = {
        transactions,
        analysis: reputationData.analysis,
        reputation: reputationData.reputation,
        patterns: reputationData.patterns,
        lastUpdated: new Date().toISOString(),
        source: 'etherscan'
      }

      // Cache the result
      this.onChainCache.set(address, onChainData)
      
      return onChainData
    } catch (error) {
      console.error('Failed to fetch on-chain history:', error)
      return null
    }
  }

  // Get enhanced transaction summary combining local and on-chain data
  async getEnhancedTransactionSummary(fid: number, userAddress?: string): Promise<EnhancedTransactionSummary> {
    const localTransactions = this.getTransactions(fid)
    const localBadges = this.getLocalBadges(fid)
    
    let onChainData: OnChainHistoryData | null = null
    
    // Fetch on-chain data if address is provided
    if (userAddress) {
      onChainData = await this.getOnChainHistory(userAddress, fid)
    }

    if (!onChainData) {
      // Return local data only
      return {
        totalTransactions: localTransactions.length,
        latestTransaction: this.getLatestTransaction(fid),
        badges: localBadges,
        onChainTransactions: 0,
        onChainAnalysis: null,
        onChainReputation: {
          score: 0,
          level: 'beginner',
          badges: [],
          insights: {
            oldest_transaction: 0,
            most_active_day: 'Unknown',
            favorite_protocol: 'None',
            defi_activity_score: 0,
            nft_activity_score: 0,
            total_volume_eth: '0',
            unique_contracts_interacted: 0
          },
          patterns: []
        },
        transactionPatterns: [],
        totalValueEth: '0',
        contractInteractions: 0,
        firstTransaction: undefined,
        latestOnChainTransaction: undefined,
        lastUpdated: new Date().toISOString(),
        dataSource: 'local'
      }
    }

    // Combine local and on-chain data
    const combinedBadges = this.getTransactionBadges(fid, onChainData.reputation)
    const totalValueEth = onChainData.analysis.totalValue
    const contractInteractions = onChainData.analysis.contractInteractions

    return {
      // Local data
      totalTransactions: localTransactions.length,
      latestTransaction: this.getLatestTransaction(fid),
      badges: combinedBadges,
      
      // On-chain data
      onChainTransactions: onChainData.transactions.length,
      onChainAnalysis: onChainData.analysis,
      onChainReputation: onChainData.reputation,
      transactionPatterns: onChainData.patterns,
      
      // Combined metrics
      totalValueEth: totalValueEth,
      contractInteractions,
      firstTransaction: onChainData.analysis.firstTransaction,
      latestOnChainTransaction: onChainData.analysis.latestTransaction,
      
      // Metadata
      lastUpdated: onChainData.lastUpdated,
      dataSource: 'hybrid'
    }
  }

  // Clear on-chain cache for an address
  clearOnChainCache(address?: string): void {
    if (address) {
      this.onChainCache.delete(address)
    } else {
      this.onChainCache.clear()
    }
  }

  // Clear all transaction history (for testing/reset)
  clearAll(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.storageKey)
    this.onChainCache.clear()
  }

  // Get cache status
  getCacheInfo(): { localStorageSize: number; onChainCacheSize: number } {
    const localData = this.getStorageData()
    const localSize = Object.values(localData).flat().length
    const onChainSize = this.onChainCache.size

    return {
      localStorageSize: localSize,
      onChainCacheSize: onChainSize
    }
  }

  // Utility method to format ETH values
  static formatEth(weiString: string): string {
    try {
      const wei = BigInt(weiString)
      const ether = Number(wei) / 1e18
      return ether.toFixed(4)
    } catch {
      return '0'
    }
  }

  // Check if Etherscan API is configured
  isEtherscanConfigured(): boolean {
    return !!(process.env.ETHERSCAN_API_KEY || process.env.BASESCAN_API_KEY)
  }
}

// Export singleton instances
const enhancedTransactionHistory = new EnhancedTransactionHistory()
export { enhancedTransactionHistory }

// Backward compatibility export
export const transactionHistory = {
  addTransaction: (record: TransactionRecord) => enhancedTransactionHistory.addTransaction(record),
  getTransactions: (fid: number) => enhancedTransactionHistory.getTransactions(fid),
  getTotalTransactions: (fid: number) => enhancedTransactionHistory.getTotalTransactions(fid),
  getLatestTransaction: (fid: number) => enhancedTransactionHistory.getLatestTransaction(fid),
  getTransactionBadges: (fid: number) => enhancedTransactionHistory.getTransactionBadges(fid),
  getTransactionSummary: (fid: number) => {
    // Return simplified summary for backward compatibility
    const tx = enhancedTransactionHistory.getTransactions(fid)
    return {
      totalTransactions: tx.length,
      latestTransaction: tx.length > 0 ? tx[tx.length - 1] : undefined,
      badges: enhancedTransactionHistory.getTransactionBadges(fid)
    }
  },
  clearAll: () => enhancedTransactionHistory.clearAll()
}
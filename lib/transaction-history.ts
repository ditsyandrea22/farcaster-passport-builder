// Enhanced transaction history with localStorage fallback
// In production, this should be replaced with a proper database

export interface TransactionRecord {
  fid: number
  txHash: string
  timestamp: string
  score: number
  badge: string
  userAddress: string
}

class TransactionHistory {
  private storageKey = 'farcaster_passport_transactions'

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

  addTransaction(record: TransactionRecord) {
    if (typeof window === 'undefined') return // Skip on server side
    
    const data = this.getStorageData()
    const key = record.fid.toString()
    
    if (!data[key]) {
      data[key] = []
    }
    
    data[key].push(record)
    this.saveStorageData(data)
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

  // Enhanced badges based on transaction history
  getTransactionBadges(fid: number): string[] {
    const totalTx = this.getTotalTransactions(fid)
    const badges: string[] = []

    if (totalTx >= 1) badges.push("First Mint")
    if (totalTx >= 3) badges.push("Collector")
    if (totalTx >= 5) badges.push("Veteran")
    if (totalTx >= 10) badges.push("Legend")
    if (totalTx >= 20) badges.push("Master")

    return badges
  }

  // Get transaction history summary for sharing
  getTransactionSummary(fid: number): {
    totalTransactions: number
    latestTransaction?: TransactionRecord
    badges: string[]
  } {
    return {
      totalTransactions: this.getTotalTransactions(fid),
      latestTransaction: this.getLatestTransaction(fid),
      badges: this.getTransactionBadges(fid)
    }
  }

  // Clear all transaction history (for testing/reset)
  clearAll(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.storageKey)
  }
}

// Export singleton instance
export const transactionHistory = new TransactionHistory()
// Simple transaction history storage for demo purposes
// In production, this would use a proper database

export interface TransactionRecord {
  fid: number
  txHash: string
  timestamp: string
  score: number
  badge: string
  userAddress: string
}

class TransactionHistory {
  private transactions: Map<string, TransactionRecord[]> = new Map()

  addTransaction(record: TransactionRecord) {
    const key = record.fid.toString()
    if (!this.transactions.has(key)) {
      this.transactions.set(key, [])
    }
    this.transactions.get(key)!.push(record)
  }

  getTransactions(fid: number): TransactionRecord[] {
    const key = fid.toString()
    return this.transactions.get(key) || []
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
}

// Export singleton instance
export const transactionHistory = new TransactionHistory()
import { NextResponse } from "next/server"

// Etherscan V2 API types
export interface EtherscanTransaction {
  blockNumber: string
  timeStamp: string
  hash: string
  nonce: string
  blockHash: string
  transactionIndex: string
  from: string
  to: string
  value: string
  gas: string
  gasPrice: string
  isError: string
  txreceipt_status: string
  input: string
  contractAddress: string
  cumulativeGasUsed: string
  gasUsed: string
  confirmations: string
}

export interface EtherscanResponse<T> {
  status: string
  message: string
  result: T
}

export interface OnChainTransaction {
  hash: string
  blockNumber: number
  timestamp: number
  from: string
  to: string
  value: string
  gasUsed: string
  gasPrice: string
  isError: boolean
  contractAddress?: string
  input: string
  confirmations: number
}

export interface TransactionAnalysis {
  totalTransactions: number
  totalGasUsed: string
  totalValue: string
  averageGasPrice: string
  contractInteractions: number
  errorTransactions: number
  firstTransaction?: OnChainTransaction
  latestTransaction?: OnChainTransaction
  transactionTypes: {
    contract: number
    ethTransfer: number
    tokenTransfer: number
    other: number
  }
}

class EtherscanV2Service {
  private apiKeys: {
    etherscan?: string
    basescan?: string
  }
  private baseUrls = {
    etherscan: 'https://api.etherscan.io/api',
    basescan: 'https://api.basescan.org/api'
  }
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.apiKeys = {
      etherscan: process.env.ETHERSCAN_API_KEY,
      basescan: process.env.BASESCAN_API_KEY
    }
  }

  private getNetworkConfig(address: string) {
    // Simple heuristic to determine network
    // In production, you might want to use a more sophisticated method
    const checksumAddress = address.toLowerCase()
    
    // Base network addresses (you might want to use a more reliable method)
    if (checksumAddress.startsWith('0x') && checksumAddress.length === 42) {
      // For now, we'll use BaseScan for all addresses
      // You could implement better network detection here
      return { network: 'basescan', baseUrl: this.baseUrls.basescan }
    }
    
    return { network: 'etherscan', baseUrl: this.baseUrls.etherscan }
  }

  private getApiKey(network: string) {
    return this.apiKeys[network as keyof typeof this.apiKeys]
  }

  private async makeRequest<T>(url: string, params: Record<string, string>): Promise<T> {
    const cacheKey = `${url}?${new URLSearchParams(params).toString()}`
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      const response = await fetch(`${url}?${new URLSearchParams(params)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: EtherscanResponse<T> = await response.json()
      
      if (data.status === '0' && data.message !== 'No transactions found') {
        throw new Error(`Etherscan API error: ${data.message}`)
      }

      // Cache successful responses
      this.cache.set(cacheKey, { data, timestamp: Date.now() })
      
      return data.result
    } catch (error) {
      console.error('Etherscan API request failed:', error)
      throw error
    }
  }

  async getTransactions(address: string, startBlock = 0, endBlock = 99999999, page = 1, offset = 100): Promise<OnChainTransaction[]> {
    const { network, baseUrl } = this.getNetworkConfig(address)
    const apiKey = this.getApiKey(network)
    
    if (!apiKey) {
      throw new Error(`${network} API key not configured`)
    }

    const params = {
      module: 'account',
      action: 'txlist',
      address,
      startblock: startBlock.toString(),
      endblock: endBlock.toString(),
      page: page.toString(),
      offset: offset.toString(),
      sort: 'desc',
      apikey: apiKey
    }

    const etherscanTxs: EtherscanTransaction[] = await this.makeRequest<EtherscanTransaction[]>(baseUrl, params)
    
    return etherscanTxs.map(tx => ({
      hash: tx.hash,
      blockNumber: parseInt(tx.blockNumber),
      timestamp: parseInt(tx.timeStamp),
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      isError: tx.isError === '1',
      contractAddress: tx.contractAddress || undefined,
      input: tx.input,
      confirmations: parseInt(tx.confirmations)
    }))
  }

  async getTransactionCount(address: string): Promise<number> {
    const { network, baseUrl } = this.getNetworkConfig(address)
    const apiKey = this.getApiKey(network)
    
    if (!apiKey) {
      throw new Error(`${network} API key not configured`)
    }

    const params = {
      module: 'proxy',
      action: 'eth_getTransactionCount',
      address,
      tag: 'latest',
      apikey: apiKey
    }

    const result = await this.makeRequest<string>(baseUrl, params)
    return parseInt(result, 16)
  }

  async getERC20Transfers(address: string, startBlock = 0, endBlock = 99999999, page = 1, offset = 100): Promise<any[]> {
    const { network, baseUrl } = this.getNetworkConfig(address)
    const apiKey = this.getApiKey(network)
    
    if (!apiKey) {
      throw new Error(`${network} API key not configured`)
    }

    const params = {
      module: 'account',
      action: 'tokentx',
      address,
      startblock: startBlock.toString(),
      endblock: endBlock.toString(),
      page: page.toString(),
      offset: offset.toString(),
      sort: 'desc',
      apikey: apiKey
    }

    return this.makeRequest<any[]>(baseUrl, params)
  }

  analyzeTransactions(transactions: OnChainTransaction[]): TransactionAnalysis {
    if (transactions.length === 0) {
      return {
        totalTransactions: 0,
        totalGasUsed: '0',
        totalValue: '0',
        averageGasPrice: '0',
        contractInteractions: 0,
        errorTransactions: 0,
        transactionTypes: {
          contract: 0,
          ethTransfer: 0,
          tokenTransfer: 0,
          other: 0
        }
      }
    }

    const sortedTx = [...transactions].sort((a, b) => b.timestamp - a.timestamp)
    
    let totalGasUsed = 0n
    let totalValue = 0n
    let totalGasPrice = 0n
    let contractInteractions = 0
    let errorTransactions = 0
    
    const txTypes = {
      contract: 0,
      ethTransfer: 0,
      tokenTransfer: 0,
      other: 0
    }

    transactions.forEach(tx => {
      // Accumulate totals
      totalGasUsed += BigInt(tx.gasUsed)
      totalValue += BigInt(tx.value)
      totalGasPrice += BigInt(tx.gasPrice)
      
      // Count errors
      if (tx.isError) {
        errorTransactions++
      }
      
      // Count contract interactions
      if (tx.contractAddress) {
        contractInteractions++
      }
      
      // Categorize transaction types
      if (tx.contractAddress && tx.contractAddress !== '0x') {
        if (tx.input !== '0x') {
          txTypes.contract++
        } else {
          txTypes.tokenTransfer++
        }
      } else if (tx.to && tx.value !== '0') {
        txTypes.ethTransfer++
      } else {
        txTypes.other++
      }
    })

    const avgGasPrice = totalGasPrice / BigInt(transactions.length)
    const totalGasUsedStr = totalGasUsed.toString()
    const totalValueStr = totalValue.toString()
    const avgGasPriceStr = avgGasPrice.toString()

    return {
      totalTransactions: transactions.length,
      totalGasUsed: totalGasUsedStr,
      totalValue: totalValueStr,
      averageGasPrice: avgGasPriceStr,
      contractInteractions,
      errorTransactions,
      firstTransaction: sortedTx[sortedTx.length - 1],
      latestTransaction: sortedTx[0],
      transactionTypes: txTypes
    }
  }

  async getFullTransactionHistory(address: string, maxPages = 10): Promise<{
    transactions: OnChainTransaction[]
    analysis: TransactionAnalysis
  }> {
    const allTransactions: OnChainTransaction[] = []
    let page = 1
    let hasMore = true

    try {
      while (hasMore && page <= maxPages) {
        const txs = await this.getTransactions(address, 0, 99999999, page, 100)
        
        if (txs.length === 0) {
          hasMore = false
        } else {
          allTransactions.push(...txs)
          
          // Check if we've reached the end
          if (txs.length < 100) {
            hasMore = false
          }
          
          page++
          
          // Rate limiting - wait between requests
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      const analysis = this.analyzeTransactions(allTransactions)
      
      return {
        transactions: allTransactions,
        analysis
      }
    } catch (error) {
      console.error('Error fetching full transaction history:', error)
      throw error
    }
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.cache.clear()
  }

  // Get cache status
  getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const etherscanV2 = new EtherscanV2Service()
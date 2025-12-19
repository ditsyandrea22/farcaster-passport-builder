// Etherscan V2 API service for transaction tracking
export interface Transaction {
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

export interface TransactionHistory {
  transactions: Transaction[]
  totalTransactions: number
}

export class EtherscanService {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, network: 'mainnet' | 'base' = 'base') {
    this.apiKey = apiKey
    this.baseUrl = network === 'base' 
      ? 'https://api.basescan.org/api'
      : 'https://api.etherscan.io/api'
  }

  private async makeRequest<T>(params: Record<string, string>): Promise<T> {
    const url = new URL(this.baseUrl)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
    url.searchParams.append('apikey', this.apiKey)

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.statusText}`)
    }

    const data: EtherscanResponse<T> = await response.json()
    
    if (data.status !== '1' && data.message !== 'No transactions found') {
      throw new Error(`Etherscan API error: ${data.message}`)
    }

    return data.result
  }

  async getTransactionHistory(
    address: string,
    startBlock: number = 0,
    endBlock: number = 99999999,
    page: number = 1,
    offset: number = 10
  ): Promise<Transaction[]> {
    const params = {
      module: 'account',
      action: 'txlist',
      address,
      startblock: startBlock.toString(),
      endblock: endBlock.toString(),
      page: page.toString(),
      offset: offset.toString(),
      sort: 'desc'
    }

    return await this.makeRequest<Transaction[]>(params)
  }

  async getERC20TokenTransfers(
    address: string,
    contractAddress?: string,
    page: number = 1,
    offset: number = 10
  ): Promise<Transaction[]> {
    const params: Record<string, string> = {
      module: 'account',
      action: 'tokentx',
      address,
      page: page.toString(),
      offset: offset.toString(),
      sort: 'desc'
    }

    if (contractAddress) {
      params.contractaddress = contractAddress
    }

    return await this.makeRequest<Transaction[]>(params)
  }

  async getTransactionStatus(txHash: string): Promise<Transaction | null> {
    const params = {
      module: 'account',
      action: 'txlist',
      txhash: txHash
    }

    const transactions = await this.makeRequest<Transaction[]>(params)
    return transactions.length > 0 ? transactions[0] : null
  }

  async getERC721TokenTransfers(
    address: string,
    contractAddress?: string,
    page: number = 1,
    offset: number = 10
  ): Promise<Transaction[]> {
    const params: Record<string, string> = {
      module: 'account',
      action: 'tokennfttx',
      address,
      page: page.toString(),
      offset: offset.toString(),
      sort: 'desc'
    }

    if (contractAddress) {
      params.contractaddress = contractAddress
    }

    return await this.makeRequest<Transaction[]>(params)
  }

  async getBalance(address: string): Promise<string> {
    const params = {
      module: 'account',
      action: 'balance',
      address,
      tag: 'latest'
    }

    const result = await this.makeRequest<{ account: string; balance: string }[]>(params)
    return result.length > 0 ? result[0].balance : '0'
  }

  // Get gas tracker info
  async getGasTracker(): Promise<any> {
    const params = {
      module: 'gastracker',
      action: 'gasoracle'
    }

    return await this.makeRequest<any>(params)
  }

  // Get contract ABI
  async getContractAbi(contractAddress: string): Promise<string> {
    const params = {
      module: 'contract',
      action: 'getabi',
      address: contractAddress
    }

    const result = await this.makeRequest<{ status: string; result: string; message: string }>(params)
    return result.result
  }

  // Track NFT minting transactions
  async getNFTMints(
    contractAddress: string,
    page: number = 1,
    offset: number = 10
  ): Promise<Transaction[]> {
    const params = {
      module: 'account',
      action: 'tokennfttx',
      contractAddress,
      page: page.toString(),
      offset: offset.toString(),
      sort: 'desc'
    }

    return await this.makeRequest<Transaction[]>(params)
  }
}

// Singleton instance
let etherscanService: EtherscanService | null = null

export function getEtherscanService(): EtherscanService {
  if (!etherscanService) {
    const apiKey = process.env.ETHERSCAN_API_KEY || process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
    if (!apiKey) {
      throw new Error('Etherscan API key not found in environment variables')
    }
    etherscanService = new EtherscanService(apiKey)
  }
  return etherscanService
}
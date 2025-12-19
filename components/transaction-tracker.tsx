// Transaction tracking component with Etherscan integration
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { ExternalLink, RefreshCw, Search, TrendingUp, Activity } from 'lucide-react'
import { getEtherscanService, type Transaction } from '../lib/etherscan-service'

interface TransactionTrackerProps {
  address?: string
}

export function TransactionTracker({ address: propAddress }: TransactionTrackerProps) {
  const [address, setAddress] = useState(propAddress || '')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tokenTransfers, setTokenTransfers] = useState<Transaction[]>([])
  const [nftTransfers, setNftTransfers] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState<string>('0')
  const [gasInfo, setGasInfo] = useState<any>(null)

  const fetchTransactions = async (addr: string) => {
    if (!addr) return

    setIsLoading(true)
    try {
      const etherscan = getEtherscanService()
      
      // Fetch different types of transactions
      const [txs, tokens, nfts, bal, gas] = await Promise.all([
        etherscan.getTransactionHistory(addr),
        etherscan.getERC20TokenTransfers(addr),
        etherscan.getERC721TokenTransfers(addr),
        etherscan.getBalance(addr),
        etherscan.getGasTracker()
      ])

      setTransactions(txs)
      setTokenTransfers(tokens)
      setNftTransfers(nfts)
      setBalance(bal)
      setGasInfo(gas)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (propAddress) {
      fetchTransactions(propAddress)
    }
  }, [propAddress])

  const handleSearch = () => {
    if (address) {
      fetchTransactions(address)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatValue = (value: string) => {
    const numValue = parseInt(value) / Math.pow(10, 18) // Convert from wei
    return numValue.toFixed(4)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString()
  }

  const getTransactionType = (tx: Transaction) => {
    if (tx.to.toLowerCase() === address?.toLowerCase()) return 'received'
    if (tx.from.toLowerCase() === address?.toLowerCase()) return 'sent'
    return 'other'
  }

  const getStatusBadge = (tx: Transaction) => {
    if (tx.txreceipt_status === '1') {
      return <Badge variant="default" className="bg-green-500">Success</Badge>
    } else {
      return <Badge variant="destructive">Failed</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Transaction Tracker
        </CardTitle>
        <CardDescription>
          Track on-chain transactions using Etherscan V2 API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Section */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="address">Wallet Address</Label>
            <Input
              id="address"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} disabled={!address || isLoading}>
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Loading...' : 'Track'}
            </Button>
          </div>
        </div>

        {/* Balance and Gas Info */}
        {(balance !== '0' || gasInfo) && (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatValue(balance)} ETH</div>
                <p className="text-xs text-muted-foreground">Current Balance</p>
              </CardContent>
            </Card>
            {gasInfo && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{gasInfo.StandardGasPrice || 'N/A'} gwei</div>
                  <p className="text-xs text-muted-foreground">Gas Price</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Transaction Tabs */}
        {transactions.length > 0 || tokenTransfers.length > 0 || nftTransfers.length > 0 ? (
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transactions">
                ETH ({transactions.length})
              </TabsTrigger>
              <TabsTrigger value="tokens">
                Tokens ({tokenTransfers.length})
              </TabsTrigger>
              <TabsTrigger value="nfts">
                NFTs ({nftTransfers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.hash} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-sm">{formatAddress(tx.hash)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(tx.timeStamp)}
                      </div>
                    </div>
                    {getStatusBadge(tx)}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="text-muted-foreground">From:</span>{' '}
                      <span className="font-mono">{formatAddress(tx.from)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">To:</span>{' '}
                      <span className="font-mono">{formatAddress(tx.to)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="font-semibold">
                      {formatValue(tx.value)} ETH
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://basescan.org/tx/${tx.hash}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="tokens" className="space-y-2">
              {tokenTransfers.map((tx) => (
                <div key={tx.hash} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-sm">{formatAddress(tx.hash)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(tx.timeStamp)}
                      </div>
                    </div>
                    {getStatusBadge(tx)}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Contract:</span>{' '}
                    <span className="font-mono">{formatAddress(tx.contractAddress)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="font-semibold">
                      Token Transfer
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://basescan.org/tx/${tx.hash}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="nfts" className="space-y-2">
              {nftTransfers.map((tx) => (
                <div key={tx.hash} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-sm">{formatAddress(tx.hash)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(tx.timeStamp)}
                      </div>
                    </div>
                    {getStatusBadge(tx)}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">NFT Contract:</span>{' '}
                    <span className="font-mono">{formatAddress(tx.contractAddress)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="font-semibold">
                      NFT Transfer
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://basescan.org/tx/${tx.hash}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        ) : address && !isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            No transactions found for this address.
          </div>
        ) : null}

        {isLoading && (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Fetching transactions...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function NFTTokenTracker({ contractAddress }: { contractAddress: string }) {
  const [mints, setMints] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (contractAddress) {
      fetchNFTMints()
    }
  }, [contractAddress])

  const fetchNFTMints = async () => {
    setIsLoading(true)
    try {
      const etherscan = getEtherscanService()
      const nftMints = await etherscan.getNFTMints(contractAddress)
      setMints(nftMints)
    } catch (error) {
      console.error('Failed to fetch NFT mints:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          NFT Mint Tracker
        </CardTitle>
        <CardDescription>
          Track NFT mints for contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Fetching NFT mints...</p>
          </div>
        ) : mints.length > 0 ? (
          <div className="space-y-2">
            {mints.map((mint) => (
              <div key={mint.hash} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-mono text-sm">
                      {mint.from.slice(0, 6)}...{mint.from.slice(-4)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(parseInt(mint.timeStamp) * 1000).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://basescan.org/tx/${mint.hash}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No NFT mints found for this contract.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
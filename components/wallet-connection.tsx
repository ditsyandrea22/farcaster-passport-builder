// Wallet connection components using Wagmi hooks
'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Copy, ExternalLink, Wallet, LogOut } from 'lucide-react'

interface WalletConnectionProps {
  onTransactionSent?: (txHash: string) => void
}

export function WalletConnection({ onTransactionSent }: WalletConnectionProps) {
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors, isLoading, pendingConnector } = useConnect()
  const { disconnect } = useDisconnect()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
    }
  }

  const getConnectorIcon = (connectorName: string) => {
    // Return appropriate icon based on connector type
    return <Wallet className="h-4 w-4" />
  }

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Connection</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isConnected && address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connected Wallet
          </CardTitle>
          <CardDescription>Your wallet is connected</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">{formatAddress(address)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Badge variant="secondary">
              {connector?.name || 'Unknown'}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://basescan.org/address/${address}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on BaseScan
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => disconnect()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Wallet</CardTitle>
        <CardDescription>
          Choose your preferred wallet to connect and start transacting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {connectors.map((walletConnector) => (
          <Button
            key={walletConnector.id}
            variant="outline"
            className="w-full justify-start"
            onClick={() => connect({ connector: walletConnector })}
            disabled={isLoading && pendingConnector?.id === walletConnector.id}
          >
            {getConnectorIcon(walletConnector.name)}
            <span className="ml-2">
              {isLoading && pendingConnector?.id === walletConnector.id
                ? 'Connecting...'
                : walletConnector.name}
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

export function TransactionSender({ onTransactionSent }: WalletConnectionProps) {
  const { address, isConnected } = useAccount()
  const [isSending, setIsSending] = useState(false)
  const [batchMode, setBatchMode] = useState(false)

  const sendTransaction = async () => {
    if (!isConnected || !address) return

    setIsSending(true)
    try {
      // This would be implemented with Wagmi's useSendTransaction or useSendCalls hooks
      // For now, we'll just simulate a transaction
      const mockTxHash = `0x${Math.random().toString(16).slice(2)}`
      onTransactionSent?.(mockTxHash)
    } catch (error) {
      console.error('Transaction failed:', error)
    } finally {
      setIsSending(false)
    }
  }

  const sendBatchTransaction = async () => {
    if (!isConnected || !address) return

    setIsSending(true)
    try {
      // This would be implemented with Wagmi's useSendCalls hook
      // For batch transactions
      const mockTxHash = `0x${Math.random().toString(16).slice(2)}`
      onTransactionSent?.(mockTxHash)
    } catch (error) {
      console.error('Batch transaction failed:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Transaction</CardTitle>
        <CardDescription>
          Test wallet functionality with sample transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={sendTransaction}
            disabled={isSending}
            className="flex-1"
          >
            {isSending ? 'Sending...' : 'Send Test Transaction'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setBatchMode(!batchMode)}
            className="flex-1"
          >
            {batchMode ? 'Single Mode' : 'Batch Mode'}
          </Button>
        </div>

        {batchMode && (
          <Button
            onClick={sendBatchTransaction}
            disabled={isSending}
            className="w-full"
            variant="secondary"
          >
            {isSending ? 'Sending Batch...' : 'Send Batch Transaction'}
          </Button>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Single transactions: Simple ETH transfers</p>
          <p>• Batch transactions: Multiple operations in one confirmation</p>
          <p>• Supports approve + swap operations</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function TransactionHistory({ address }: { address?: string }) {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // This would be implemented with Etherscan service
  // For fetching and displaying transaction history

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          Track your on-chain transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No transactions found. Connect your wallet and make a transaction to see it here.
          </div>
        ) : (
          <div className="space-y-2">
            {/* Transaction list would go here */}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
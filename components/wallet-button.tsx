// Wallet button component for top-right positioning
'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from './ui/dropdown-menu'
import { 
  Wallet, 
  LogOut, 
  Copy, 
  ExternalLink,
  ChevronDown,
  CheckCircle,
  Loader2
} from 'lucide-react'

export function WalletButton() {
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors, isLoading, pendingConnector } = useConnect()
  const { disconnect } = useDisconnect()
  const [copySuccess, setCopySuccess] = useState(false)

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const handleConnect = async (walletConnector: any) => {
    try {
      await connect({ connector: walletConnector })
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="group relative overflow-hidden bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 ease-out hover:scale-105 backdrop-blur-md animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <Wallet className="h-4 w-4 text-green-600" />
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              </div>
              <span className="font-medium text-green-700 dark:text-green-400">
                {formatAddress(address)}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-64 p-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl"
        >
          <div className="px-3 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connected Wallet</span>
              <Badge variant="secondary" className="text-xs">
                {connector?.name || 'Unknown'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs font-mono text-muted-foreground">
                {formatAddress(address)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {copySuccess ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          
          <DropdownMenuItem 
            onClick={() => window.open(`https://basescan.org/address/${address}`, '_blank')}
            className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on BaseScan
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="my-2" />
          
          <DropdownMenuItem 
            onClick={() => disconnect()}
            className="cursor-pointer p-2 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 rounded-sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 ease-out hover:scale-105 backdrop-blur-md animate-fade-in hover:animate-bounce-subtle"
        >
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="font-medium">Connect Wallet</span>
            <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 p-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl"
      >
        <div className="px-3 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
          <p className="text-sm font-medium">Choose your wallet</p>
          <p className="text-xs text-muted-foreground">Connect to start transacting</p>
        </div>
        
        <div className="py-2 space-y-1">
          {connectors.map((walletConnector: any) => (
            <DropdownMenuItem
              key={walletConnector.id}
              onClick={() => handleConnect(walletConnector)}
              disabled={isLoading && pendingConnector?.id === walletConnector.id}
              className="cursor-pointer p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm transition-colors"
            >
              <div className="flex items-center gap-3 w-full">
                <Wallet className="h-4 w-4" />
                <span className="flex-1">
                  {isLoading && pendingConnector?.id === walletConnector.id ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-sm">Connecting...</span>
                    </div>
                  ) : (
                    <span className="text-sm font-medium">{walletConnector.name}</span>
                  )}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
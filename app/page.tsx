"use client"

import { PassportGenerator } from "@/components/passport-generator"
import { ThemeToggle } from "@/components/theme-toggle"
import { TransactionSender, TransactionHistory } from "@/components/wallet-connection"
import { TransactionTracker } from "@/components/transaction-tracker"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from "@/components/ui/button"
import { Wallet, LogOut, ChevronDown, Send, History, BarChart3 } from "lucide-react"
import { useState, useRef, useEffect } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function WalletDropdown() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'wallet' | 'track' | 'send'>('wallet')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isConnected && address) {
    return (
      <div className="relative" ref={dropdownRef}>
        <Button 
          variant="outline" 
          className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 ease-out hover:scale-105 backdrop-blur-md animate-fade-in"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-700 dark:text-green-400">
              {formatAddress(address)}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </Button>
        
        {isOpen && (
          <div className="absolute right-0 mt-2 w-[400px] max-h-[500px] overflow-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Connected</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { disconnect(); setIsOpen(false); }}
                  className="hover:bg-red-50 hover:text-red-600 text-xs"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Disconnect
                </Button>
              </div>
            </div>
            
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-1">
                <Button
                  variant={activeTab === 'wallet' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setActiveTab('wallet')}
                >
                  <Wallet className="h-3 w-3 mr-1" />
                  Wallet
                </Button>
                <Button
                  variant={activeTab === 'track' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setActiveTab('track')}
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Track
                </Button>
                <Button
                  variant={activeTab === 'send' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setActiveTab('send')}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Send
                </Button>
              </div>
            </div>
            
            <div className="p-4 max-h-[350px] overflow-auto">
              {activeTab === 'wallet' && (
                <div className="space-y-4">
                  <TransactionHistory />
                </div>
              )}
              {activeTab === 'track' && (
                <div className="space-y-4">
                  <TransactionTracker />
                </div>
              )}
              {activeTab === 'send' && (
                <div className="space-y-4">
                  <TransactionSender onTransactionSent={(txHash) => console.log('Transaction sent:', txHash)} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 ease-out hover:scale-105 backdrop-blur-md animate-fade-in"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <span className="font-medium">Connect Wallet</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in">
          <div className="p-4">
            <h3 className="font-semibold mb-3">Connect Wallet</h3>
            <p className="text-sm text-muted-foreground mb-4">Choose your preferred wallet to connect and start transacting</p>
            <div className="space-y-2">
              {connectors.map((connector) => (
                <Button
                  key={connector.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    connect({ connector })
                    setIsOpen(false)
                  }}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  {connector.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-100 via-fuchsia-100 to-cyan-100 dark:from-gray-950 dark:via-purple-950 dark:to-indigo-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-400/40 dark:bg-purple-600/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-fuchsia-400/40 dark:bg-blue-600/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-400/40 dark:bg-pink-600/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        <WalletDropdown />
        <ThemeToggle />
      </div>

      <div className="relative container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-balance bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Farcaster Reputation Passport
            </h1>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Your on-chain reputation identity powered by Farcaster + Base
            </p>
          </div>

          <PassportGenerator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 animate-fade-in-up">
            <div className="group p-6 bg-white/80 dark:bg-gray-900/80 rounded-xl backdrop-blur-md border border-purple-200/50 dark:border-purple-800/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🎯</div>
              <h3 className="font-semibold mb-2 text-lg">Real Data</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Accurate score from Farcaster activity, engagement, and Base transaction history
              </p>
            </div>
            <div className="group p-6 bg-white/80 dark:bg-gray-900/80 rounded-xl backdrop-blur-md border border-blue-200/50 dark:border-blue-800/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">⚡</div>
              <h3 className="font-semibold mb-2 text-lg">Instant Mint</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Generate and mint your passport NFT on Base network in seconds
              </p>
            </div>
            <div className="group p-6 bg-white/80 dark:bg-gray-900/80 rounded-xl backdrop-blur-md border border-pink-200/50 dark:border-pink-800/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🔗</div>
              <h3 className="font-semibold mb-2 text-lg">Shareable</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Share your reputation score and passport directly to Farcaster
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

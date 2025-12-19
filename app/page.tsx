import { PassportGenerator } from "@/components/passport-generator"
import { ThemeToggle } from "@/components/theme-toggle"
import { WalletConnection, TransactionSender, TransactionHistory } from "@/components/wallet-connection"
import { TransactionTracker, NFTTokenTracker } from "@/components/transaction-tracker"
import { useAccount } from "wagmi"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-100 via-fuchsia-100 to-cyan-100 dark:from-gray-950 dark:via-purple-950 dark:to-indigo-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-400/40 dark:bg-purple-600/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-fuchsia-400/40 dark:bg-blue-600/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-400/40 dark:bg-pink-600/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="absolute top-4 right-4 z-10">
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

          {/* Wallet Integration Section */}
          <div className="mt-16 space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-balance">Wallet Integration</h2>
              <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
                Connect your wallet to track transactions and interact with Base network
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Tabs defaultValue="connect" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="connect">Connect Wallet</TabsTrigger>
                  <TabsTrigger value="track">Track Transactions</TabsTrigger>
                  <TabsTrigger value="send">Send Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="connect" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <WalletConnection onTransactionSent={(txHash) => console.log('Transaction sent:', txHash)} />
                    <TransactionHistory />
                  </div>
                </TabsContent>

                <TabsContent value="track" className="space-y-6">
                  <TransactionTracker />
                </TabsContent>

                <TabsContent value="send" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TransactionSender onTransactionSent={(txHash) => console.log('Transaction sent:', txHash)} />
                    <Card>
                      <CardHeader>
                        <CardTitle>Batch Transaction Support</CardTitle>
                        <CardDescription>
                          Support for EIP-5792 wallet_sendCalls
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Features:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Multiple transactions in one confirmation</li>
                            <li>• Approve + swap operations</li>
                            <li>• Complex DeFi interactions</li>
                            <li>• NFT batch minting</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold">Supported Chains:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Base Mainnet</li>
                            <li>• All EVM chains</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

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

// Custom hooks for transaction management with Wagmi
'use client'

import { useAccount, useSendTransaction, useSendCalls, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, encodeFunctionData, createPublicClient, http } from 'viem'
import { base } from 'wagmi/chains'
import { useState, useCallback } from 'react'

// ERC-20 ABI for common operations
export const erc20Abi = [
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  }
] as const

// Uniswap V2 ABI for swap operations
export const uniswapAbi = [
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactTokensForETH',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  }
] as const

interface TransactionOptions {
  to: string
  value?: string
  data?: string
  gas?: string
  gasPrice?: string
}

interface BatchTransactionOptions {
  calls: TransactionOptions[]
  walletAddress?: string
}

export function useTransactionSender() {
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendTransaction = useSendTransaction()
  const sendCalls = useSendCalls()

  const sendSingleTransaction = useCallback(async (options: TransactionOptions) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      const txHash = await sendTransaction.writeContractAsync({
        to: options.to as `0x${string}`,
        value: options.value ? parseEther(options.value) : undefined,
        data: options.data as `0x${string}` | undefined
      })

      return txHash
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, address, sendTransaction])

  const sendBatchTransaction = useCallback(async (options: BatchTransactionOptions) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      // Format calls for wallet_sendCalls
      const formattedCalls = options.calls.map(call => ({
        to: call.to as `0x${string}`,
        data: call.data as `0x${string}` | undefined,
        value: call.value ? parseEther(call.value) : undefined
      }))

      const result = await sendCalls.sendCalls({
        calls: formattedCalls
      })

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch transaction failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, address, sendCalls])

  const approveAndSwap = useCallback(async (
    tokenAddress: string,
    swapRouter: string,
    amountIn: string,
    amountOutMin: string,
    path: string[]
  ) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      // Prepare approve call
      const approveCall = {
        to: tokenAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [swapRouter as `0x${string}`, parseEther(amountIn)]
        })
      }

      // Prepare swap call
      const swapCall = {
        to: swapRouter as `0x${string}`,
        data: encodeFunctionData({
          abi: uniswapAbi,
          functionName: 'swapExactTokensForETH',
          args: [
            parseEther(amountIn),
            parseEther(amountOutMin),
            path,
            address as `0x${string}`,
            Math.floor(Date.now() / 1000) + 300 // 5 minutes deadline
          ]
        })
      }

      const result = await sendCalls.sendCalls({
        calls: [approveCall, swapCall]
      })

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Approve and swap failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, address, sendCalls])

  const batchMintNFTs = useCallback(async (
    nftContract: string,
    recipients: string[],
    tokenURIs: string[]
  ) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    if (recipients.length !== tokenURIs.length) {
      throw new Error('Recipients and token URIs must have same length')
    }

    setIsLoading(true)
    setError(null)

    try {
      // Prepare mint calls for each NFT
      const mintCalls = recipients.map((recipient, index) => ({
        to: nftContract as `0x${string}`,
        data: encodeFunctionData({
          abi: [
            {
              inputs: [
                { name: 'to', type: 'address' },
                { name: 'uri', type: 'string' }
              ],
              name: 'mintTo',
              outputs: [{ name: '', type: 'uint256' }],
              type: 'function'
            }
          ],
          functionName: 'mintTo',
          args: [recipient as `0x${string}`, tokenURIs[index]]
        })
      }))

      const result = await sendCalls.sendCalls({
        calls: mintCalls
      })

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch mint failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, address, sendCalls])

  return {
    sendSingleTransaction,
    sendBatchTransaction,
    approveAndSwap,
    batchMintNFTs,
    isLoading,
    error,
    isConnected,
    address
  }
}

export function useTransactionStatus(txHash?: string) {
  const { data: receipt, isLoading, error } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
    confirmations: 1
  })

  return {
    receipt,
    isLoading,
    error,
    status: receipt?.status,
    isSuccess: receipt?.status === 'success',
    isFailure: receipt?.status === 'reverted'
  }
}

export function useTransactionHistory() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async (address: string, type: string = 'all') => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        address,
        type,
        page: '1',
        offset: '10'
      })

      const response = await fetch(`/api/transactions?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions')
      }

      setTransactions(data.data)
      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshTransactions = useCallback(() => {
    // Refresh transactions - could be called after new transaction
    setTransactions([])
  }, [])

  return {
    transactions,
    fetchTransactions,
    refreshTransactions,
    isLoading,
    error
  }
}
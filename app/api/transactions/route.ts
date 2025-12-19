// API route for transaction tracking using Etherscan V2 API
import { NextRequest, NextResponse } from 'next/server'
import { getEtherscanService, type Transaction } from '../../../lib/etherscan-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const type = searchParams.get('type') || 'all' // 'all', 'tx', 'tokentx', 'tokennfttx'
    const page = parseInt(searchParams.get('page') || '1')
    const offset = parseInt(searchParams.get('offset') || '10')

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      )
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      )
    }

    const etherscan = getEtherscanService()
    let transactions: Transaction[] = []

    switch (type) {
      case 'tx':
        transactions = await etherscan.getTransactionHistory(address, 0, 99999999, page, offset)
        break
      case 'tokentx':
        transactions = await etherscan.getERC20TokenTransfers(address, undefined, page, offset)
        break
      case 'tokennfttx':
        transactions = await etherscan.getERC721TokenTransfers(address, undefined, page, offset)
        break
      case 'all':
      default:
        // Fetch all types of transactions
        const [txs, tokenTxs, nftTxs] = await Promise.all([
          etherscan.getTransactionHistory(address, 0, 99999999, page, offset),
          etherscan.getERC20TokenTransfers(address, undefined, page, offset),
          etherscan.getERC721TokenTransfers(address, undefined, page, offset)
        ])
        transactions = [...txs, ...tokenTxs, ...nftTxs]
        // Sort by timestamp (newest first)
        transactions.sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp))
        break
    }

    // Add additional metadata to each transaction
    const enhancedTransactions = transactions.map(tx => ({
      ...tx,
      transactionType: tx.input === '0x' ? 'transfer' : 'contract_interaction',
      valueFormatted: (parseInt(tx.value) / Math.pow(10, 18)).toString(),
      gasUsedFormatted: (parseInt(tx.gasUsed) / Math.pow(10, 18)).toString(),
      timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      status: tx.txreceipt_status === '1' ? 'success' : 'failed'
    }))

    return NextResponse.json({
      success: true,
      data: enhancedTransactions,
      pagination: {
        page,
        offset,
        total: enhancedTransactions.length
      },
      address,
      type
    })

  } catch (error) {
    console.error('Transaction API error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Etherscan API key not configured' },
          { status: 500 }
        )
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'API rate limit exceeded' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { addresses, type = 'all', page = 1, offset = 10 } = body

    if (!addresses || !Array.isArray(addresses)) {
      return NextResponse.json(
        { error: 'Addresses array is required' },
        { status: 400 }
      )
    }

    const etherscan = getEtherscanService()
    const results: Record<string, Transaction[]> = {}

    // Process multiple addresses
    for (const address of addresses.slice(0, 10)) { // Limit to 10 addresses
      try {
        let transactions: Transaction[] = []

        switch (type) {
          case 'tx':
            transactions = await etherscan.getTransactionHistory(address, 0, 99999999, page, offset)
            break
          case 'tokentx':
            transactions = await etherscan.getERC20TokenTransfers(address, undefined, page, offset)
            break
          case 'tokennfttx':
            transactions = await etherscan.getERC721TokenTransfers(address, undefined, page, offset)
            break
          case 'all':
          default:
            const [txs, tokenTxs, nftTxs] = await Promise.all([
              etherscan.getTransactionHistory(address, 0, 99999999, page, offset),
              etherscan.getERC20TokenTransfers(address, undefined, page, offset),
              etherscan.getERC721TokenTransfers(address, undefined, page, offset)
            ])
            transactions = [...txs, ...tokenTxs, ...nftTxs]
            transactions.sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp))
            break
        }

        results[address] = transactions
      } catch (error) {
        console.error(`Failed to fetch transactions for ${address}:`, error)
        results[address] = []
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      pagination: { page, offset },
      processed: Object.keys(results).length
    })

  } catch (error) {
    console.error('Batch transaction API error:', error)
    return NextResponse.json(
      { error: 'Failed to process batch request' },
      { status: 500 }
    )
  }
}
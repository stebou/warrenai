import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ExchangeFactory } from '@/lib/trading/exchanges/exchange_factory';
import { log } from '@/lib/logger';

export async function GET() {
  try {
    // 1. Authentification
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Exchange test endpoint ready. Use POST to test specific exchanges.',
      supportedExchanges: ['binance'],
      instructions: {
        binance: 'POST with { "exchange": "binance", "apiKey": "your_key", "apiSecret": "your_secret", "testnet": true }'
      }
    });

  } catch (error) {
    log.error('[Exchange Test] Failed to get test info', { error });
    return NextResponse.json({ 
      error: 'Exchange test failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { exchange: exchangeType, apiKey, apiSecret, testnet = true } = body;

    if (!exchangeType) {
      return NextResponse.json({ 
        error: 'Exchange type is required',
        supportedExchanges: ['binance']
      }, { status: 400 });
    }

    if (exchangeType === 'binance') {
      if (!apiKey || !apiSecret) {
        return NextResponse.json({ 
          error: 'API key and secret are required for Binance'
        }, { status: 400 });
      }

      // Test de connexion Binance
      const exchange = await ExchangeFactory.create({ 
        type: 'binance',
        apiKey,
        apiSecret,
        testnet
      });
      
      // Tests basiques
      const accountInfo = await exchange.getAccountInfo();
      const ticker = await exchange.getTicker('BTC/USDT');
      const balances = await exchange.getBalance();

      log.info('[Exchange Test] Binance tested successfully', {
        userId,
        testnet,
        accountCanTrade: accountInfo.canTrade,
        balancesCount: balances.length,
        btcPrice: ticker.price
      });

      await exchange.disconnect();

      return NextResponse.json({
        success: true,
        exchange: `Binance ${testnet ? 'Testnet' : 'Live'}`,
        connected: true,
        tests: {
          account: {
            canTrade: accountInfo.canTrade,
            canWithdraw: accountInfo.canWithdraw,
            canDeposit: accountInfo.canDeposit,
            balancesCount: balances.length
          },
          ticker: {
            symbol: ticker.symbol,
            price: ticker.price,
            change24h: ticker.changePercent24h
          },
          balances: balances.filter(b => b.total > 0).map(b => ({
            asset: b.asset,
            free: b.free,
            total: b.total
          }))
        }
      });
    }

    return NextResponse.json({ 
      error: `Exchange type '${exchangeType}' not supported`,
      supportedExchanges: ['binance']
    }, { status: 400 });

  } catch (error) {
    log.error('[Exchange Test] Request failed', { error });
    return NextResponse.json({ 
      error: 'Request failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
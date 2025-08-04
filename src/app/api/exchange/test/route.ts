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

    // 2. Créer et tester le MockExchange
    const exchange = await ExchangeFactory.create({ type: 'mock' });
    
    // 3. Tests basiques
    const ticker = await exchange.getTicker('BTC/USDT');
    const balances = await exchange.getBalance();
    const orderBook = await exchange.getOrderBook('BTC/USDT', 5);
    const candles = await exchange.getCandles('BTC/USDT', '1h', 10);
    
    // 4. Test d'ordre
    const testOrder = await exchange.placeOrder({
      symbol: 'BTC/USDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: 0.001
    });

    const openOrders = await exchange.getOpenOrders();

    log.info('[Exchange Test] MockExchange tested successfully', {
      userId,
      ticker: ticker.price,
      balancesCount: balances.length,
      orderId: testOrder.id,
      openOrdersCount: openOrders.length
    });

    return NextResponse.json({
      success: true,
      exchange: 'MockExchange',
      connected: exchange.isConnected(),
      tests: {
        ticker: {
          symbol: ticker.symbol,
          price: ticker.price,
          change24h: ticker.changePercent24h
        },
        balances: balances.map(b => ({
          asset: b.asset,
          free: b.free,
          total: b.total
        })),
        orderBook: {
          symbol: orderBook.symbol,
          bestBid: orderBook.bids[0]?.[0],
          bestAsk: orderBook.asks[0]?.[0],
          spread: orderBook.asks[0]?.[0] - orderBook.bids[0]?.[0]
        },
        candles: {
          count: candles.length,
          latest: candles[candles.length - 1]
        },
        testOrder: {
          id: testOrder.id,
          status: testOrder.status,
          filled: testOrder.filled,
          remaining: testOrder.remaining
        },
        openOrders: openOrders.length
      }
    });

  } catch (error) {
    log.error('[Exchange Test] Failed to test exchange', { error });
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
    const { action, symbol, side, type, quantity, price } = body;

    const exchange = await ExchangeFactory.create({ type: 'mock' });

    switch (action) {
      case 'place_order':
        const order = await exchange.placeOrder({
          symbol: symbol || 'BTC/USDT',
          side: side || 'BUY',
          type: type || 'MARKET',
          quantity: quantity || 0.001,
          price
        });
        
        return NextResponse.json({ success: true, order });

      case 'get_ticker':
        const ticker = await exchange.getTicker(symbol || 'BTC/USDT');
        return NextResponse.json({ success: true, ticker });

      case 'get_balance':
        const balances = await exchange.getBalance();
        return NextResponse.json({ success: true, balances });

      case 'get_open_orders':
        const openOrders = await exchange.getOpenOrders(symbol);
        return NextResponse.json({ success: true, orders: openOrders });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    log.error('[Exchange API] Request failed', { error });
    return NextResponse.json({ 
      error: 'Request failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
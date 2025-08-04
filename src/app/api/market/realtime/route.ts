import { NextRequest, NextResponse } from 'next/server';

interface BinanceTickerResponse {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

interface BinanceKlineResponse {
  symbol: string;
  data: Array<[
    number, // Open time
    string, // Open price
    string, // High price
    string, // Low price
    string, // Close price
    string, // Volume
    number, // Close time
    string, // Quote asset volume
    number, // Number of trades
    string, // Taker buy base asset volume
    string, // Taker buy quote asset volume
    string  // Unused field
  ]>;
}

const BINANCE_API_BASE = 'https://testnet.binance.vision/api/v3';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTCUSDT';
    const interval = searchParams.get('interval') || '1m';
    const limit = searchParams.get('limit') || '15';

    // Fetch ticker data (24hr stats)
    const tickerResponse = await fetch(`${BINANCE_API_BASE}/ticker/24hr?symbol=${symbol}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TradingBot/1.0'
      }
    });

    if (!tickerResponse.ok) {
      throw new Error(`Binance API error: ${tickerResponse.status}`);
    }

    const tickerData: BinanceTickerResponse = await tickerResponse.json();

    // Fetch recent kline data for price history
    const klineResponse = await fetch(
      `${BINANCE_API_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TradingBot/1.0'
        }
      }
    );

    if (!klineResponse.ok) {
      throw new Error(`Binance klines API error: ${klineResponse.status}`);
    }

    const klineData = await klineResponse.json();

    // Transform kline data to price history
    const priceHistory = klineData.map((kline: any, index: number) => {
      const timestamp = new Date(kline[6]); // Close time
      return {
        time: timestamp.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        price: parseFloat(kline[4]), // Close price
        change24h: parseFloat(tickerData.priceChangePercent),
        volume: parseFloat(kline[5]), // Volume
        high: parseFloat(kline[2]), // High price
        low: parseFloat(kline[3])   // Low price
      };
    });

    // Current ticker information
    const currentTicker = {
      symbol: tickerData.symbol,
      price: parseFloat(tickerData.lastPrice),
      change24h: parseFloat(tickerData.priceChangePercent),
      volume24h: parseFloat(tickerData.volume),
      high24h: parseFloat(tickerData.highPrice),
      low24h: parseFloat(tickerData.lowPrice),
      priceChange: parseFloat(tickerData.priceChange),
      openPrice: parseFloat(tickerData.openPrice),
      prevClosePrice: parseFloat(tickerData.prevClosePrice)
    };

    return NextResponse.json({
      success: true,
      data: {
        ticker: currentTicker,
        priceHistory: priceHistory,
        timestamp: new Date().toISOString(),
        source: 'Binance Testnet API'
      }
    });

  } catch (error) {
    console.error('Market data API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch market data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
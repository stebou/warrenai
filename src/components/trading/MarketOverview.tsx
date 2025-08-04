'use client';

import { MarketOverview as TradingViewMarketOverview } from 'react-ts-tradingview-widgets';
import { BarChart3, Globe } from 'lucide-react';

interface MarketOverviewProps {
  height?: string;
  className?: string;
}

export default function MarketOverview({ 
  height = "400",
  className = ""
}: MarketOverviewProps) {
  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
            <Globe className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Vue d'Ensemble du Marché</h3>
            <p className="text-sm text-gray-400">Crypto & Actions principales</p>
          </div>
        </div>
      </div>

      {/* Widget Container */}
      <div className="p-4">
        <TradingViewMarketOverview
          colorTheme="dark"
          height={height}
          width="100%"
          market="crypto"
          showChart={true}
          locale="fr"
          tabsGuidelines={[
            {
              title: "Crypto",
              market: "crypto"
            },
            {
              title: "Actions",
              market: "stock"
            },
            {
              title: "Forex", 
              market: "forex"
            }
          ]}
          tabs={[
            {
              title: "Crypto",
              symbols: [
                { s: "BINANCE:BTCUSDT", d: "Bitcoin" },
                { s: "BINANCE:ETHUSDT", d: "Ethereum" },
                { s: "BINANCE:ADAUSDT", d: "Cardano" },
                { s: "BINANCE:SOLUSDT", d: "Solana" },
                { s: "BINANCE:DOTUSDT", d: "Polkadot" },
                { s: "BINANCE:AVAXUSDT", d: "Avalanche" }
              ]
            },
            {
              title: "Actions",
              symbols: [
                { s: "NASDAQ:AAPL", d: "Apple Inc." },
                { s: "NASDAQ:MSFT", d: "Microsoft" },
                { s: "NASDAQ:GOOGL", d: "Alphabet" },
                { s: "NASDAQ:AMZN", d: "Amazon" },
                { s: "NASDAQ:TSLA", d: "Tesla" },
                { s: "NASDAQ:NVDA", d: "NVIDIA" }
              ]
            }
          ]}
        />
      </div>
    </div>
  );
}
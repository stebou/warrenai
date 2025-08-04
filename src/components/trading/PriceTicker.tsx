'use client';

import { TickerTape } from 'react-ts-tradingview-widgets';
import { Activity, Zap } from 'lucide-react';

interface PriceTickerProps {
  className?: string;
  showSymbolLogo?: boolean;
}

export default function PriceTicker({ 
  className = "",
  showSymbolLogo = true
}: PriceTickerProps) {
  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Prix en Temps Réel</h3>
            <p className="text-sm text-gray-400">Top cryptomonnaies</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-green-400">
          <Zap className="w-4 h-4" />
          <span className="text-xs font-medium">LIVE</span>
        </div>
      </div>

      {/* Ticker Container */}
      <div className="overflow-hidden">
        <TickerTape
          symbols={[
            {
              proName: "BINANCE:BTCUSDT",
              title: "Bitcoin"
            },
            {
              proName: "BINANCE:ETHUSDT", 
              title: "Ethereum"
            },
            {
              proName: "BINANCE:ADAUSDT",
              title: "Cardano"
            },
            {
              proName: "BINANCE:SOLUSDT",
              title: "Solana"
            },
            {
              proName: "BINANCE:DOTUSDT",
              title: "Polkadot"
            },
            {
              proName: "BINANCE:AVAXUSDT",
              title: "Avalanche"
            },
            {
              proName: "BINANCE:LINKUSDT",
              title: "Chainlink"
            },
            {
              proName: "BINANCE:UNIUSDT",
              title: "Uniswap"
            },
            {
              proName: "BINANCE:LTCUSDT",
              title: "Litecoin"
            },
            {
              proName: "BINANCE:XRPUSDT",
              title: "XRP"
            }
          ]}
          showSymbolLogo={showSymbolLogo}
          colorTheme="dark"
          isTransparent={true}
          displayMode="adaptive"
          locale="fr"
        />
      </div>
    </div>
  );
}
'use client';

import { SymbolOverview as TradingViewSymbolOverview } from 'react-ts-tradingview-widgets';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SymbolOverviewProps {
  symbols?: string[];
  className?: string;
}

export default function SymbolOverview({ 
  symbols = ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT", "BINANCE:ADAUSDT", "BINANCE:SOLUSDT"],
  className = ""
}: SymbolOverviewProps) {
  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Top Cryptos</h3>
            <p className="text-sm text-gray-400">Vue d'ensemble rapide</p>
          </div>
        </div>
      </div>

      {/* Symbols Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {symbols.map((symbol, index) => (
          <div key={index}>
            <TradingViewSymbolOverview
              symbols={[[symbol]]}
              chartOnly={false}
              width="100%"
              height="200"
              locale="fr"
              colorTheme="dark"
              autosize={false}
              showVolume={false}
              showMA={false}
              hideDateRanges={false}
              hideSymbolLogo={false}
              scalePosition="right"
              scaleMode="Normal"
              fontFamily="-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif"
              fontSize="10"
              noTimeScale={false}
              valuesTracking="1"
              changeMode="price-and-percent"
              chartType="area"
              maLineColor="#2962FF"
              maLineWidth={1}
              maLength={9}
              lineWidth={2}
              lineType={0}
              dateRanges={[
                "1d|1",
                "1m|30",
                "3m|60",
                "12m|1D",
                "60m|1W",
                "all|1M"
              ]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
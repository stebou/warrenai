'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { TrendingUp, Settings, Maximize2 } from 'lucide-react';

// Dynamically import the TradingView widget to disable SSR
const AdvancedRealTimeChart = dynamic(
  () => import('react-ts-tradingview-widgets').then(mod => mod.AdvancedRealTimeChart),
  { ssr: false }
);

interface TradingViewChartProps {
  symbol?: string;
  height?: number;
  className?: string;
}

export default function TradingViewChart({
  symbol = 'BINANCE:BTCUSDT',
  height = 500,
  className = ''
}: TradingViewChartProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSymbol, setCurrentSymbol] = useState(symbol);

  useEffect(() => {
    setCurrentSymbol(symbol);
    // Minor delay to simulate load event
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [symbol]);

  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Chart Avancé</h3>
            <p className="text-sm text-gray-400">{currentSymbol}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative" style={{ width: '100%', height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-400">Chargement du chart...</span>
            </div>
          </div>
        )}
        <div className="tradingview-chart-container" style={{ width: '100%', height }}>
          <AdvancedRealTimeChart
            symbol={currentSymbol}
            theme="dark"
            width="100%"
            height={height}
            interval="60"
            locale="en"
            timezone="Etc/UTC"
          />
        </div>
      </div>
    </div>
  );
}
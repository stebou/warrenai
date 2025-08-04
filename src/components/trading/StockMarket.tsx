'use client';

import dynamic from 'next/dynamic';
import { TrendingUp } from 'lucide-react';

const StockMarketWidget = dynamic(
  () => import('react-ts-tradingview-widgets').then(mod => mod.StockMarket),
  { ssr: false }
);

interface StockMarketProps {
  height?: string;
  className?: string;
}

export default function StockMarket({ 
  height = "400",
  className = ""
}: StockMarketProps) {
  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Marchés Boursiers</h3>
            <p className="text-sm text-gray-400">Vue d'ensemble des marchés</p>
          </div>
        </div>
      </div>

      {/* Widget Container */}
      <div className="p-4">
        <StockMarketWidget
          colorTheme="dark"
          dateRange="12M"
          exchange="US"
          showChart={true}
          locale="fr"
          largeChartUrl=""
          isTransparent={true}
          showSymbolLogo={true}
          showFloatingTooltip={false}
          width="100%"
          height={height}
        />
      </div>
    </div>
  );
}
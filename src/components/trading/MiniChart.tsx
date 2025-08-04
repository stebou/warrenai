'use client';

import dynamic from 'next/dynamic';
import { BarChart3 } from 'lucide-react';

const MiniChartWidget = dynamic(
  () => import('react-ts-tradingview-widgets').then(mod => mod.MiniChart),
  { ssr: false }
);

interface MiniChartProps {
  symbol?: string;
  width?: string;
  height?: string;
  className?: string;
}

export default function MiniChart({ 
  symbol = "NASDAQ:AAPL",
  width = "350",
  height = "220",
  className = ""
}: MiniChartProps) {
  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Mini Chart</h3>
            <p className="text-sm text-gray-400">{symbol}</p>
          </div>
        </div>
      </div>

      {/* Widget Container */}
      <div className="p-4 flex justify-center">
        <MiniChartWidget
          symbol={symbol}
          width={width}
          height={height}
          locale="fr"
          dateRange="12M"
          colorTheme="dark"
          trendLineColor="rgba(41, 98, 255, 1)"
          underLineColor="rgba(41, 98, 255, 0.3)"
          underLineBottomColor="rgba(41, 98, 255, 0)"
          isTransparent={true}
          autosize={false}
          largeChartUrl=""
        />
      </div>
    </div>
  );
}
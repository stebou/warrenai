'use client';

import dynamic from 'next/dynamic';
import { Search } from 'lucide-react';

const ScreenerWidget = dynamic(
  () => import('react-ts-tradingview-widgets').then(mod => mod.Screener),
  { ssr: false }
);

interface ScreenerProps {
  width?: string;
  height?: string;
  className?: string;
}

export default function Screener({ 
  width = "100%",
  height = "490",
  className = ""
}: ScreenerProps) {
  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
            <Search className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Screener</h3>
            <p className="text-sm text-gray-400">Filtrage des actions</p>
          </div>
        </div>
      </div>

      {/* Widget Container */}
      <div className="p-4">
        <ScreenerWidget
          width={width}
          height={height}
          colorTheme="dark"
          locale="fr"
          largeChartUrl=""
          isTransparent={true}
          showToolbar={true}
          showSymbolLogo={true}
          market="america"
        />
      </div>
    </div>
  );
}
'use client';

import { TechnicalAnalysis as TradingViewTechnicalAnalysis } from 'react-ts-tradingview-widgets';
import { BarChart3, Target } from 'lucide-react';

interface TechnicalAnalysisProps {
  symbol?: string;
  height?: string;
  className?: string;
}

export default function TechnicalAnalysis({ 
  symbol = "BINANCE:BTCUSDT",
  height = "400",
  className = ""
}: TechnicalAnalysisProps) {
  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Analyse Technique</h3>
            <p className="text-sm text-gray-400">{symbol}</p>
          </div>
        </div>
      </div>

      {/* Analysis Container */}
      <div className="p-4">
        <TradingViewTechnicalAnalysis
          symbol={symbol}
          colorTheme="dark"
          isTransparent={true}
          width="100%"
          locale="fr"
          interval="1h"
          showIntervalTabs={true}
        />
      </div>
    </div>
  );
}
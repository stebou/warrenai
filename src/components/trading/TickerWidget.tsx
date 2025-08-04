'use client';

import dynamic from 'next/dynamic';
import { Activity } from 'lucide-react';

const TickerTapeWidget = dynamic(
  () => import('react-ts-tradingview-widgets').then(mod => mod.TickerTape),
  { ssr: false }
);

interface TickerWidgetProps {
  className?: string;
}

export default function TickerWidget({ 
  className = ""
}: TickerWidgetProps) {
  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Ticker des Prix</h3>
            <p className="text-sm text-gray-400">Prix en temps réel</p>
          </div>
        </div>
      </div>

      {/* Widget Container */}
      <div className="p-4">
        <TickerTapeWidget
          symbols={[
            {
              proName: "FOREXCOM:SPXUSD",
              title: "S&P 500"
            },
            {
              proName: "FOREXCOM:NSXUSD",
              title: "US 100"
            },
            {
              proName: "FX_IDC:EURUSD",
              title: "EUR/USD"
            },
            {
              proName: "BITSTAMP:BTCUSD",
              title: "Bitcoin"
            },
            {
              proName: "BITSTAMP:ETHUSD",
              title: "Ethereum"
            }
          ]}
          showSymbolLogo={true}
          colorTheme="dark"
          isTransparent={true}
          displayMode="adaptive"
          locale="fr"
        />
      </div>
    </div>
  );
}
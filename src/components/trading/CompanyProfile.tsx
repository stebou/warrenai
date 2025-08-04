'use client';

import dynamic from 'next/dynamic';
import { Building2 } from 'lucide-react';

const CompanyProfileWidget = dynamic(
  () => import('react-ts-tradingview-widgets').then(mod => mod.CompanyProfile),
  { ssr: false }
);

interface CompanyProfileProps {
  symbol?: string;
  width?: string;
  height?: string;
  className?: string;
}

export default function CompanyProfile({ 
  symbol = "NASDAQ:AAPL",
  width = "100%",
  height = "500",
  className = ""
}: CompanyProfileProps) {
  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Profil d'Entreprise</h3>
            <p className="text-sm text-gray-400">{symbol}</p>
          </div>
        </div>
      </div>

      {/* Widget Container */}
      <div className="p-4">
        <CompanyProfileWidget
          symbol={symbol}
          width={width}
          height={height}
          colorTheme="dark"
          locale="fr"
          isTransparent={true}
        />
      </div>
    </div>
  );
}
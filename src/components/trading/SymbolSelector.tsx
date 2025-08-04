'use client';

import { useState } from 'react';
import { ChevronDown, Search, TrendingUp } from 'lucide-react';

interface SymbolSelectorProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  className?: string;
}

const POPULAR_SYMBOLS = [
  { symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin', category: 'Crypto' },
  { symbol: 'BINANCE:ETHUSDT', name: 'Ethereum', category: 'Crypto' },
  { symbol: 'BINANCE:ADAUSDT', name: 'Cardano', category: 'Crypto' },
  { symbol: 'BINANCE:SOLUSDT', name: 'Solana', category: 'Crypto' },
  { symbol: 'BINANCE:DOTUSDT', name: 'Polkadot', category: 'Crypto' },
  { symbol: 'BINANCE:AVAXUSDT', name: 'Avalanche', category: 'Crypto' },
  { symbol: 'BINANCE:LINKUSDT', name: 'Chainlink', category: 'Crypto' },
  { symbol: 'BINANCE:UNIUSDT', name: 'Uniswap', category: 'Crypto' },
  { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', category: 'Actions' },
  { symbol: 'NASDAQ:MSFT', name: 'Microsoft', category: 'Actions' },
  { symbol: 'NASDAQ:GOOGL', name: 'Alphabet', category: 'Actions' },
  { symbol: 'NASDAQ:TSLA', name: 'Tesla', category: 'Actions' },
];

export default function SymbolSelector({ 
  selectedSymbol, 
  onSymbolChange, 
  className = "" 
}: SymbolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedSymbolData = POPULAR_SYMBOLS.find(s => s.symbol === selectedSymbol);
  
  const filteredSymbols = POPULAR_SYMBOLS.filter(symbol =>
    symbol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    symbol.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSymbolSelect = (symbol: string) => {
    onSymbolChange(symbol);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bouton de sélection */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 transition-all duration-200 min-w-[200px]"
      >
        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-white font-medium text-sm">
            {selectedSymbolData?.name || 'Bitcoin'}
          </div>
          <div className="text-gray-400 text-xs">
            {selectedSymbol}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Recherche */}
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un symbole..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Liste des symboles */}
          <div className="max-h-64 overflow-y-auto">
            {filteredSymbols.length > 0 ? (
              filteredSymbols.map((symbolData) => (
                <button
                  key={symbolData.symbol}
                  onClick={() => handleSymbolSelect(symbolData.symbol)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left ${
                    selectedSymbol === symbolData.symbol ? 'bg-blue-500/20 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-300">
                      {symbolData.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium text-sm">
                      {symbolData.name}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {symbolData.symbol} • {symbolData.category}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-400">
                Aucun symbole trouvé
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay pour fermer le dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
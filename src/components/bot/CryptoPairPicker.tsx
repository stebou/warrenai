'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Star,
  StarOff,
  ChevronDown,
  Filter,
  Zap,
  BarChart3,
  DollarSign,
  Volume2
} from 'lucide-react';
import { TokenIcon } from '@web3icons/react';

export interface CryptoPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
  isFavorite?: boolean;
  isActive: boolean;
}

interface CryptoPairPickerProps {
  selectedPair: string | null;
  onPairSelect: (pair: CryptoPair) => void;
  onContinue: () => void;
  exchangeType?: 'binance' | 'binance_futures' | 'coinbase';
  disabled?: boolean;
}

// Données simulées pour les paires populaires
const POPULAR_PAIRS: CryptoPair[] = [
  {
    symbol: 'BTC/USDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    price: 67420.50,
    change24h: 2.34,
    volume24h: 1245000000,
    marketCap: 1330000000000,
    isActive: true
  },
  {
    symbol: 'ETH/USDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    price: 3820.75,
    change24h: -1.12,
    volume24h: 890000000,
    marketCap: 459000000000,
    isActive: true
  },
  {
    symbol: 'BNB/USDT',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    price: 635.20,
    change24h: 0.89,
    volume24h: 156000000,
    marketCap: 92000000000,
    isActive: true
  },
  {
    symbol: 'SOL/USDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    price: 189.45,
    change24h: 4.67,
    volume24h: 234000000,
    marketCap: 87000000000,
    isActive: true
  },
  {
    symbol: 'ADA/USDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    price: 0.4523,
    change24h: -2.34,
    volume24h: 178000000,
    marketCap: 15800000000,
    isActive: true
  },
  {
    symbol: 'AVAX/USDT',
    baseAsset: 'AVAX',
    quoteAsset: 'USDT',
    price: 36.78,
    change24h: 3.21,
    volume24h: 98000000,
    marketCap: 14200000000,
    isActive: true
  },
  {
    symbol: 'DOT/USDT',
    baseAsset: 'DOT',
    quoteAsset: 'USDT',
    price: 7.89,
    change24h: -0.56,
    volume24h: 67000000,
    marketCap: 10500000000,
    isActive: true
  },
  {
    symbol: 'MATIC/USDT',
    baseAsset: 'MATIC',
    quoteAsset: 'USDT',
    price: 0.7234,
    change24h: 1.78,
    volume24h: 89000000,
    marketCap: 7200000000,
    isActive: true
  }
];

const QUOTE_CURRENCIES = ['USDT', 'BTC', 'ETH', 'BNB'];
const SORT_OPTIONS = [
  { value: 'marketCap', label: 'Capitalisation', icon: <BarChart3 className="w-4 h-4" /> },
  { value: 'volume24h', label: 'Volume 24h', icon: <Volume2 className="w-4 h-4" /> },
  { value: 'change24h', label: 'Performance', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'price', label: 'Prix', icon: <DollarSign className="w-4 h-4" /> },
];

export default function CryptoPairPicker({ 
  selectedPair, 
  onPairSelect, 
  onContinue, 
  exchangeType = 'binance',
  disabled = false 
}: CryptoPairPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState('USDT');
  const [sortBy, setSortBy] = useState<keyof CryptoPair>('marketCap');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['BTC/USDT', 'ETH/USDT']));

  const filteredAndSortedPairs = useMemo(() => {
    let filtered = POPULAR_PAIRS.filter(pair => {
      const matchesSearch = pair.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pair.baseAsset.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesQuote = pair.quoteAsset === selectedQuote;
      const matchesFavorites = !showFavoritesOnly || favorites.has(pair.symbol);
      
      return matchesSearch && matchesQuote && matchesFavorites;
    });

    // Ajout du statut favori
    filtered = filtered.map(pair => ({
      ...pair,
      isFavorite: favorites.has(pair.symbol)
    }));

    // Tri
    filtered.sort((a, b) => {
      if (sortBy === 'change24h') {
        return Math.abs(b[sortBy] as number) - Math.abs(a[sortBy] as number);
      }
      return (b[sortBy] as number) - (a[sortBy] as number);
    });

    return filtered;
  }, [searchTerm, selectedQuote, sortBy, showFavoritesOnly, favorites]);

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (favorites.has(symbol)) {
      newFavorites.delete(symbol);
    } else {
      newFavorites.add(symbol);
    }
    setFavorites(newFavorites);
  };

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(1)}B`;
    } else if (num >= 1e6) {
      return `${(num / 1e6).toFixed(1)}M`;
    } else if (num >= 1e3) {
      return `${(num / 1e3).toFixed(1)}K`;
    }
    return num.toFixed(decimals);
  };

  const selectedPairData = filteredAndSortedPairs.find(pair => pair.symbol === selectedPair);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-100">
          Sélectionner une paire de trading
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Choisissez la cryptomonnaie que votre bot va trader. Les données sont mises à jour en temps réel.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher une crypto (ex: BTC, ETH...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Quote Currency Filter */}
          <div className="relative">
            <select
              value={selectedQuote}
              onChange={(e) => setSelectedQuote(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none pr-8"
            >
              {QUOTE_CURRENCIES.map(quote => (
                <option key={quote} value={quote}>{quote}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as keyof CryptoPair)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none pr-8"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Toggle Favorites */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm transition-colors duration-200 ${
              showFavoritesOnly 
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                : 'bg-gray-700 text-gray-400 hover:text-gray-300'
            }`}
          >
            <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            <span>Favoris uniquement</span>
          </button>
          {favorites.size > 0 && (
            <span className="text-xs text-gray-500">
              {favorites.size} favori{favorites.size > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Pairs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredAndSortedPairs.map((pair, index) => {
            const isSelected = selectedPair === pair.symbol;
            const isPositive = pair.change24h >= 0;

            return (
              <motion.div
                key={pair.symbol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onClick={() => onPairSelect(pair)}
                className={`
                  relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {/* Favorite Button */}
                <button
                  onClick={(e) => toggleFavorite(pair.symbol, e)}
                  className="absolute top-2 right-2 p-1 rounded hover:bg-gray-700/50 transition-colors duration-200"
                >
                  {pair.isFavorite ? (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  ) : (
                    <StarOff className="w-4 h-4 text-gray-500 hover:text-yellow-500" />
                  )}
                </button>

                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-800/40 backdrop-blur-sm">
                      <TokenIcon symbol={pair.baseAsset} size={24} variant="branded" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-100">
                        {pair.symbol}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {pair.baseAsset} / {pair.quoteAsset}
                      </p>
                    </div>
                  </div>

                  {/* Price & Change */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xl font-bold text-gray-100">
                        ${pair.price.toLocaleString()}
                      </p>
                      <div className={`flex items-center space-x-1 text-sm ${
                        isPositive ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{isPositive ? '+' : ''}{pair.change24h.toFixed(2)}%</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500">Volume 24h</p>
                      <p className="text-gray-300 font-medium">
                        ${formatNumber(pair.volume24h)}
                      </p>
                    </div>
                    {pair.marketCap && (
                      <div>
                        <p className="text-gray-500">Market Cap</p>
                        <p className="text-gray-300 font-medium">
                          ${formatNumber(pair.marketCap)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* No Results */}
      {filteredAndSortedPairs.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-6 h-6 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-300">
            Aucune paire trouvée
          </h3>
          <p className="text-gray-500">
            Essayez de modifier vos filtres de recherche
          </p>
        </div>
      )}

      {/* Selected Pair Summary */}
      {selectedPairData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/80 border border-gray-700 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800/40 backdrop-blur-sm">
                <TokenIcon symbol={selectedPairData.baseAsset} size={28} variant="branded" />
              </div>
              <div>
                <h4 className="font-medium text-gray-100">
                  Paire sélectionnée : {selectedPairData.symbol}
                </h4>
                <p className="text-sm text-gray-400">
                  Prix actuel : ${selectedPairData.price.toLocaleString()} 
                  {selectedPairData.change24h >= 0 ? ' ↗️' : ' ↘️'} 
                  {selectedPairData.change24h.toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-green-400">
              <Zap className="w-4 h-4" />
              <span>Prêt à trader</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Continue Button */}
      <div className="flex justify-center pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          disabled={!selectedPair || disabled}
          className={`
            px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
            ${selectedPair && !disabled
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <span>Continuer avec {selectedPair || 'une paire'}</span>
          {selectedPair && <Zap className="w-4 h-4" />}
        </motion.button>
      </div>
    </div>
  );
}
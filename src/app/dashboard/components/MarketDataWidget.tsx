'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3 } from 'lucide-react';

interface MarketData {
  time: string;
  price: number;
  change24h: number;
  volume: number;
}

interface TickerData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export default function MarketDataWidget() {
  const [marketHistory, setMarketHistory] = useState<MarketData[]>([]);
  const [currentTicker, setCurrentTicker] = useState<TickerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMarketData = async () => {
    try {
      const response = await fetch('/api/exchange/test');
      const data = await response.json();
      
      if (data.success && data.tests?.ticker) {
        const ticker = data.tests.ticker;
        const timestamp = new Date().toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        const newDataPoint: MarketData = {
          time: timestamp,
          price: ticker.price,
          change24h: ticker.change24h,
          volume: Math.random() * 1000000 // Volume simulé
        };

        setMarketHistory(prevData => {
          const newData = [...prevData, newDataPoint];
          return newData.slice(-15); // Garder 15 points
        });

        setCurrentTicker({
          symbol: ticker.symbol,
          price: ticker.price,
          change24h: ticker.change24h,
          volume24h: Math.random() * 10000000,
          high24h: ticker.price * (1 + Math.random() * 0.05),
          low24h: ticker.price * (1 - Math.random() * 0.05)
        });

        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 8000); // Mise à jour toutes les 8 secondes
    return () => clearInterval(interval);
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 shadow-xl">
          <p className="text-gray-300 text-sm mb-2">{`Temps: ${label}`}</p>
          <p className="text-[#14b8a6] text-sm">{`Prix: $${data.price.toFixed(2)}`}</p>
          <p className={`text-sm ${data.change24h >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
            {`Change: ${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 h-96 flex items-center justify-center"
      >
        <div className="flex items-center gap-3 text-gray-400">
          <Activity className="w-5 h-5 animate-spin" />
          <span>Chargement des données de marché...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ticker Principal */}
      {currentTicker && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">₿</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{currentTicker.symbol}</h3>
                <p className="text-gray-400 text-sm">Bitcoin / Tether</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-[#14b8a6]">
                ${currentTicker.price.toFixed(2)}
              </p>
              <div className={`flex items-center gap-1 justify-end ${
                currentTicker.change24h >= 0 ? 'text-[#10b981]' : 'text-red-400'
              }`}>
                {currentTicker.change24h >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-semibold">
                  {currentTicker.change24h >= 0 ? '+' : ''}{currentTicker.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Statistiques 24h */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700/50">
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">24h High</p>
              <p className="text-white font-semibold">${currentTicker.high24h.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">24h Low</p>
              <p className="text-white font-semibold">${currentTicker.low24h.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">24h Volume</p>
              <p className="text-white font-semibold">{(currentTicker.volume24h / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Graphique de Prix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-[#14b8a6]" />
          <h3 className="text-lg font-bold text-white">Prix en Temps Réel</h3>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Live</span>
          </div>
        </div>

        <div className="h-64">
          {marketHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marketHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="time" 
                  stroke="#9CA3AF" 
                  fontSize={10}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={10}
                  tick={{ fill: '#9CA3AF' }}
                  domain={['dataMin - 100', 'dataMax + 100']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#14b8a6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Collecte des données en cours...</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Indicateurs de Trading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 text-[#10b981] mx-auto mb-2" />
          <p className="text-lg font-bold text-white">Bullish</p>
          <p className="text-xs text-gray-400">Tendance</p>
        </div>
        
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 text-center">
          <DollarSign className="w-6 h-6 text-[#14b8a6] mx-auto mb-2" />
          <p className="text-lg font-bold text-white">
            {currentTicker ? (currentTicker.price - currentTicker.low24h).toFixed(0) : '0'}
          </p>
          <p className="text-xs text-gray-400">Support</p>
        </div>
        
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 text-center">
          <Activity className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <p className="text-lg font-bold text-white">
            {marketHistory.length > 3 ? 
              (marketHistory[marketHistory.length - 1].price > marketHistory[marketHistory.length - 4].price ? 'UP' : 'DOWN')
              : 'FLAT'
            }
          </p>
          <p className="text-xs text-gray-400">Momentum</p>
        </div>
        
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 text-center">
          <BarChart3 className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-lg font-bold text-white">Normal</p>
          <p className="text-xs text-gray-400">Volatilité</p>
        </div>
      </motion.div>
    </div>
  );
}
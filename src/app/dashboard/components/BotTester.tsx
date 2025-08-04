'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, RefreshCw, Activity, TrendingUp, DollarSign, AlertTriangle, Bot } from 'lucide-react';

interface ExchangeTestData {
  ticker: {
    symbol: string;
    price: number;
    change24h: number;
  };
  balances: Array<{
    asset: string;
    free: number;
    total: number;
  }>;
  orderBook: {
    symbol: string;
    bestBid: number;
    bestAsk: number;
    spread: number;
  };
  testOrder: {
    id: string;
    status: string;
    filled: number;
    remaining: number;
  };
}

interface BotInstance {
  id: string;
  name: string;
  strategy: string;
  status: string;
  stats: {
    trades: number;
    profit: number;
    errors: number;
  };
}

export default function BotTester() {
  const [exchangeData, setExchangeData] = useState<ExchangeTestData | null>(null);
  const [activeBots, setActiveBots] = useState<BotInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Test de connexion à l'exchange mockup
  const testExchange = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/exchange/test');
      const data = await response.json();
      
      if (data.success) {
        setExchangeData(data.tests);
        setLastUpdate(Date.now());
      } else {
        setError(data.error || 'Failed to test exchange');
      }
    } catch (error) {
      setError('Network error');
      console.error('Exchange test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Démarrer un bot de test
  const startTestBot = async (botId: string) => {
    try {
      const response = await fetch('/api/bots/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId })
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('Bot started:', data.bot);
        await checkBotStatus();
      } else {
        setError(data.error || 'Failed to start bot');
      }
    } catch (error) {
      setError('Failed to start bot');
      console.error('Bot start failed:', error);
    }
  };

  // Redémarrer tous les bots avec les nouveaux paramètres
  const restartAllBots = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/bots/restart-all', {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('Bots restarted:', data.message);
        await checkBotStatus();
      } else {
        setError(data.error || 'Failed to restart bots');
      }
    } catch (error) {
      setError('Failed to restart bots');
      console.error('Bot restart failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Arrêter un bot
  const stopBot = async (botId: string) => {
    try {
      const response = await fetch('/api/bots/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId })
      });
      
      const data = await response.json();
      if (data.success) {
        await checkBotStatus();
      } else {
        setError(data.error || 'Failed to stop bot');
      }
    } catch (error) {
      setError('Failed to stop bot');
      console.error('Bot stop failed:', error);
    }
  };

  // Vérifier le statut des bots
  const checkBotStatus = async () => {
    try {
      const response = await fetch('/api/bots/status');
      const data = await response.json();
      
      if (data.success) {
        setActiveBots(data.bots || []);
      }
    } catch (error) {
      console.error('Failed to check bot status:', error);
    }
  };

  // Test initial au chargement
  useEffect(() => {
    testExchange();
    checkBotStatus();
  }, []);

  // Actualisation automatique toutes les 10 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      testExchange();
      checkBotStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">🧪 Bot Testing Center</h2>
          <p className="text-gray-400">Test vos bots avec l'exchange mockup en temps réel</p>
        </div>
        
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={restartAllBots}
            disabled={isRefreshing}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Redémarrage...' : 'Redémarrer Bots'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={testExchange}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#10b981] text-white font-semibold rounded-lg hover:from-[#0f9e90] hover:to-[#0d9f73] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Activity className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Test Exchange
          </motion.button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">{error}</span>
        </motion.div>
      )}

      {/* Données Exchange */}
      {exchangeData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Market Data */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-[#14b8a6]" />
              <h3 className="text-lg font-bold text-white">Market Data</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Symbol:</span>
                <span className="text-white font-semibold">{exchangeData.ticker.symbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Price:</span>
                <span className="text-[#14b8a6] font-bold">${exchangeData.ticker.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">24h Change:</span>
                <span className={`font-semibold ${exchangeData.ticker.change24h >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
                  {exchangeData.ticker.change24h >= 0 ? '+' : ''}{exchangeData.ticker.change24h.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Spread:</span>
                <span className="text-white">${exchangeData.orderBook.spread.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>

          {/* Balances */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-5 h-5 text-[#10b981]" />
              <h3 className="text-lg font-bold text-white">Balances</h3>
            </div>
            
            <div className="space-y-3">
              {exchangeData.balances.slice(0, 4).map((balance) => (
                <div key={balance.asset} className="flex justify-between items-center">
                  <span className="text-gray-400">{balance.asset}:</span>
                  <div className="text-right">
                    <div className="text-white font-semibold">{balance.free.toFixed(4)}</div>
                    <div className="text-xs text-gray-500">Total: {balance.total.toFixed(4)}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Test Order */}
      {exchangeData?.testOrder && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-[#14b8a6]" />
            <h3 className="text-lg font-bold text-white">Dernier Ordre Test</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm">Order ID</div>
              <div className="text-white font-mono text-sm">{exchangeData.testOrder.id}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Status</div>
              <div className={`font-semibold ${exchangeData.testOrder.status === 'FILLED' ? 'text-[#10b981]' : 'text-yellow-400'}`}>
                {exchangeData.testOrder.status}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Filled</div>
              <div className="text-white">{exchangeData.testOrder.filled}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Remaining</div>
              <div className="text-white">{exchangeData.testOrder.remaining}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bots Actifs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-[#14b8a6]" />
            <h3 className="text-lg font-bold text-white">Bots Actifs ({activeBots.length})</h3>
          </div>
          
          <div className="text-sm text-gray-400">
            Dernière MAJ: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>

        {activeBots.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun bot actif</p>
            <p className="text-sm">Créez un bot pour commencer les tests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeBots.map((bot) => (
              <div key={bot.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#10b981] rounded-full animate-pulse"></div>
                  <div>
                    <div className="text-white font-semibold">{bot.name}</div>
                    <div className="text-gray-400 text-sm">{bot.strategy}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="text-white">Trades: {bot.stats.trades}</div>
                    <div className={`${bot.stats.profit >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
                      P&L: ${bot.stats.profit.toFixed(2)}
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => stopBot(bot.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                  >
                    <Square className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
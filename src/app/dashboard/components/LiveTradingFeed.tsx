'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, Clock, Play, Pause } from 'lucide-react';

interface Trade {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  amount: string;
  price: string;
  profit: string;
  time: string;
  status: 'completed' | 'pending' | 'failed';
  bot: string;
}

// Générateur simple d'id unique (UUID v4 light)
function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function LiveTradingFeed() {
  const [trades, setTrades] = useState<Trade[]>([
    {
      id: generateId(),
      pair: "BTC/USDT",
      type: "buy",
      amount: "0.0245",
      price: "€43,250.00",
      profit: "+€127.50",
      time: "Il y a 2 min",
      status: "completed",
      bot: "Warren Scalping Pro"
    },
    {
      id: generateId(),
      pair: "ETH/USDT",
      type: "sell",
      amount: "1.2340",
      price: "€2,845.75",
      profit: "-€23.10",
      time: "Il y a 5 min",
      status: "completed",
      bot: "DCA Master"
    },
    {
      id: generateId(),
      pair: "SOL/USDT",
      type: "buy",
      amount: "45.67",
      price: "€198.50",
      profit: "+€89.20",
      time: "Il y a 8 min",
      status: "pending",
      bot: "Grid Bot Elite"
    },
    {
      id: generateId(),
      pair: "ADA/USDT",
      type: "sell",
      amount: "2,450.00",
      price: "€0.485",
      profit: "+€45.30",
      time: "Il y a 12 min",
      status: "completed",
      bot: "Swing Trader AI"
    }
  ]);

  const [isLive, setIsLive] = useState(true);

  // Simulation d'ajout de nouveaux trades
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newTrade: Trade = {
        id: generateId(),
        pair: ["BTC/USDT", "ETH/USDT", "SOL/USDT", "ADA/USDT", "DOT/USDT"][Math.floor(Math.random() * 5)],
        type: Math.random() > 0.5 ? "buy" : "sell",
        amount: (Math.random() * 10).toFixed(4),
        price: `€${(Math.random() * 50000 + 1000).toFixed(2)}`,
        profit: Math.random() > 0.7 ? `-€${(Math.random() * 100).toFixed(2)}` : `+€${(Math.random() * 200).toFixed(2)}`,
        time: "Maintenant",
        status: ["completed", "pending"][Math.floor(Math.random() * 2)] as "completed" | "pending",
        bot: ["Warren Scalping Pro", "DCA Master", "Grid Bot Elite", "Swing Trader AI"][Math.floor(Math.random() * 4)]
      };

      setTrades(prev => {
        // Vérifie l'unicité de l'id avant d'ajouter
        if (prev.some(t => t.id === newTrade.id)) return prev;
        return [newTrade, ...prev.slice(0, 9)];
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [isLive]);

  const getTypeColor = (type: string) => {
    return type === 'buy' 
      ? 'text-[#14b8a6] bg-[#14b8a6]/20 border-[#14b8a6]/30' 
      : 'text-[#10b981] bg-[#10b981]/20 border-[#10b981]/30';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <TrendingUp className="w-3 h-3 text-[#14b8a6]" />;
      case 'pending': return <Clock className="w-3 h-3 text-yellow-400" />;
      case 'failed': return <TrendingDown className="w-3 h-3 text-red-400" />;
      default: return <Activity className="w-3 h-3 text-gray-400" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-900/80 border border-gray-800/80 rounded-xl p-6 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#14b8a6]/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-[#14b8a6]" />
          </div>
          <h2 className="text-lg font-black text-white">
            Activité Trading
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm backdrop-blur-sm border ${
            isLive 
              ? 'bg-[#14b8a6]/20 text-[#14b8a6] border-[#14b8a6]/30' 
              : 'bg-gray-800/50 text-gray-400 border-gray-700/50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-[#14b8a6] animate-pulse' : 'bg-gray-400'}`} />
            {isLive ? 'Live' : 'Arrêté'}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsLive(!isLive)}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all text-white border border-gray-700/50 hover:border-gray-600/50"
          >
            {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2 max-h-80 overflow-y-auto"
      >
        {trades.map((trade, index) => (
          <motion.div
            key={trade.id}
            variants={itemVariants}
            whileHover={{ 
              scale: 1.02,
              y: -2,
              transition: { duration: 0.2 }
            }}
            className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 group/item"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="group-hover/item:scale-110 transition-transform duration-300">
                  {getStatusIcon(trade.status)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white group-hover/item:text-[#14b8a6] transition-colors duration-300">
                    {trade.pair}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-lg backdrop-blur-sm border ${getTypeColor(trade.type)}`}>
                    {trade.type.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <span className={`font-bold text-sm ${
                trade.profit.startsWith('+') 
                  ? 'text-[#14b8a6]' 
                  : 'text-red-400'
              }`}>
                {trade.profit}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="font-medium">{trade.amount}</span>
                <span>•</span>
                <span>{trade.price}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{trade.time}</span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-white/10">
              <span className="text-xs text-gray-500 font-medium">{trade.bot}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {trades.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
            <Activity className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 text-sm font-medium">
            Aucune activité récente
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Les trades apparaîtront ici en temps réel
          </p>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 pt-4 border-t border-gray-800/50"
      >
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center backdrop-blur-sm bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-lg font-bold text-white">127</div>
            <div className="text-xs text-gray-400">Trades</div>
          </div>
          <div className="text-center backdrop-blur-sm bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-lg font-bold text-white">€45,230</div>
            <div className="text-xs text-gray-400">Volume</div>
          </div>
          <div className="text-center backdrop-blur-sm bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-lg font-bold text-[#14b8a6]">+€2,340</div>
            <div className="text-xs text-gray-400">Profit</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
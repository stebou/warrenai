'use client';

import { useState, useEffect } from 'react';

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
    return type === 'buy' ? 'text-primary bg-primary/10 border-primary/30' : 'text-secondary bg-secondary/10 border-secondary/30';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '⚪';
    }
  };

  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-accent/5 to-primary/5 border border-white/20 p-6 rounded-3xl shadow-2xl hover:shadow-3xl hover:bg-white/10 transition-all duration-500 group">
      {/* Effet de brillance glassmorphique */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Activité Trading
        </h2>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs backdrop-blur-sm border ${
            isLive ? 'bg-primary/10 text-primary border-primary/30' : 'bg-white/5 text-muted-foreground border-white/20'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
            {isLive ? 'Live' : 'Off'}
          </div>
          
          <button
            onClick={() => setIsLive(!isLive)}
            className="p-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-xs backdrop-blur-sm border border-white/20 hover:border-white/30"
          >
            {isLive ? '⏸' : '▶'}
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {trades.map((trade) => (
          <div
            key={trade.id}
            className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all duration-300 group/trade"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm group-hover/trade:scale-110 transition-transform duration-300">{getStatusIcon(trade.status)}</span>
                <span className="font-medium text-foreground group-hover/trade:text-primary transition-colors duration-300">{trade.pair}</span>
                <span className={`px-1.5 py-0.5 text-xs rounded-full backdrop-blur-sm border ${getTypeColor(trade.type)}`}>
                  {trade.type.toUpperCase()}
                </span>
              </div>
              
              <span className={`font-medium text-sm ${trade.profit.startsWith('+') ? 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent' : 'text-secondary'}`}>
                {trade.profit}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{trade.amount} • {trade.price}</span>
              <span>{trade.time}</span>
            </div>
          </div>
        ))}
      </div>

      {trades.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            Aucune activité récente
          </p>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex justify-between text-xs text-muted-foreground backdrop-blur-sm bg-white/5 rounded-xl p-3 border border-white/10">
          <span>127 trades</span>
          <span>€45,230 volume</span>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-semibold">+€2,340</span>
        </div>
      </div>
    </div>
  );
}
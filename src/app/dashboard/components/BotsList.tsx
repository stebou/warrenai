'use client';

import { useState } from 'react';

export default function BotsList() {
  const [activeTab, setActiveTab] = useState('active');

  const bots = [
    {
      id: 1,
      name: "Warren Scalping Pro",
      strategy: "Scalping",
      status: "active",
      profit: "+€1,243.50",
      trades: 47,
      winRate: "94.2%",
      risk: "Medium",
      lastActive: "2 min ago",
      avatar: "🚀"
    },
    {
      id: 2,
      name: "DCA Master",
      strategy: "Dollar Cost Average",
      status: "active",
      profit: "+€892.30",
      trades: 23,
      winRate: "87.5%",
      risk: "Low",
      lastActive: "5 min ago",
      avatar: "💎"
    },
    {
      id: 3,
      name: "Swing Trader AI",
      strategy: "Swing Trading",
      status: "paused",
      profit: "+€2,156.75",
      trades: 15,
      winRate: "91.3%",
      risk: "High",
      lastActive: "1h ago",
      avatar: "📈"
    },
    {
      id: 4,
      name: "Grid Bot Elite",
      strategy: "Grid Trading",
      status: "active",
      profit: "+€567.20",
      trades: 89,
      winRate: "83.7%",
      risk: "Medium",
      lastActive: "1 min ago",
      avatar: "🎯"
    },
    {
      id: 5,
      name: "Arbitrage Hunter",
      strategy: "Arbitrage",
      status: "stopped",
      profit: "-€123.45",
      trades: 12,
      winRate: "75.0%",
      risk: "Low",
      lastActive: "2h ago",
      avatar: "🔍"
    }
  ];

  const tabs = [
    { id: 'active', label: 'Actifs', count: bots.filter(b => b.status === 'active').length },
    { id: 'paused', label: 'En Pause', count: bots.filter(b => b.status === 'paused').length },
    { id: 'stopped', label: 'Arrêtés', count: bots.filter(b => b.status === 'stopped').length }
  ];

  const filteredBots = bots.filter(bot => 
    activeTab === 'active' ? bot.status === 'active' :
    activeTab === 'paused' ? bot.status === 'paused' :
    bot.status === 'stopped'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-primary/10 text-primary border-primary/30';
      case 'paused': return 'bg-accent/10 text-accent border-accent/30';
      case 'stopped': return 'bg-secondary/10 text-secondary border-secondary/30';
      default: return 'bg-white/5 text-muted-foreground border-white/20';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-primary';
      case 'Medium': return 'text-accent';
      case 'High': return 'text-secondary';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-white/20 p-6 rounded-3xl shadow-2xl hover:shadow-3xl hover:bg-white/10 transition-all duration-500 group">
      {/* Effet de brillance glassmorphique */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Bots Trading
        </h2>
        <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg backdrop-blur-sm border border-white/30">
          + Nouveau
        </button>
      </div>

      {/* Tabs avec style homepage */}
      <div className="flex space-x-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 rounded-lg text-sm transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-primary hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/20'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Liste avec style homepage */}
      <div className="space-y-2">
        {filteredBots.map((bot, index) => (
          <div
            key={bot.id}
            className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 group/item"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg group-hover/item:scale-110 transition-transform duration-300">{bot.avatar}</span>
                <div>
                  <h3 className="font-medium text-foreground group-hover/item:text-primary transition-colors duration-300">{bot.name}</h3>
                  <p className="text-xs text-muted-foreground">{bot.strategy}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="text-right backdrop-blur-sm bg-white/5 rounded-xl p-2 border border-white/10">
                  <p className={`font-medium ${bot.profit.startsWith('+') ? 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent' : 'text-secondary'}`}>
                    {bot.profit}
                  </p>
                  <p className="text-xs text-muted-foreground">{bot.winRate}</p>
                </div>

                <span className={`px-2 py-1 text-xs rounded-full backdrop-blur-sm border ${getStatusColor(bot.status)}`}>
                  {bot.status === 'active' ? 'Actif' : bot.status === 'paused' ? 'Pause' : 'Arrêté'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBots.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Aucun bot {activeTab === 'active' ? 'actif' : activeTab === 'paused' ? 'en pause' : 'arrêté'}
          </p>
        </div>
      )}
    </div>
  );
}
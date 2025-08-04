'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Bot, Target, Activity } from 'lucide-react';

export default function KPICards() {
  const [kpiData, setKpiData] = useState({
    totalBalance: 10000,
    totalProfit: 0,
    activeBots: 0,
    winRate: 0,
    totalTrades: 0,
    totalErrors: 0,
    totalWinningTrades: 0,
    totalLosingTrades: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchKPIData = async () => {
    try {
      const response = await fetch('/api/bots/status');
      const data = await response.json();
      
      if (data.success && data.summary) {
        const summary = data.summary;
        
        setKpiData({
          totalBalance: 10000 + summary.totalProfit, // Balance initiale + profit
          totalProfit: summary.totalProfit,
          activeBots: summary.activeBots,
          winRate: summary.winRate || 0,
          totalTrades: summary.totalTrades,
          totalErrors: summary.totalErrors,
          totalWinningTrades: summary.totalWinningTrades || 0,
          totalLosingTrades: summary.totalLosingTrades || 0
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch KPI data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIData();
    const interval = setInterval(fetchKPIData, 15000); // Mise à jour toutes les 15 secondes
    return () => clearInterval(interval);
  }, []);

  const kpis = [
    {
      title: "Balance Totale",
      value: `€${kpiData.totalBalance.toFixed(2)}`,
      change: kpiData.totalProfit >= 0 ? `+€${kpiData.totalProfit.toFixed(2)}` : `€${kpiData.totalProfit.toFixed(2)}`,
      trend: kpiData.totalProfit >= 0 ? "up" : "down",
      icon: DollarSign,
      color: "#14b8a6"
    },
    {
      title: "P&L Total",
      value: `€${kpiData.totalProfit.toFixed(2)}`,
      change: kpiData.totalTrades > 0 ? `${kpiData.totalTrades} trades` : "0 trades",
      trend: kpiData.totalProfit >= 0 ? "up" : "down",
      icon: TrendingUp,
      color: "#10b981"
    },
    {
      title: "Bots Actifs",
      value: kpiData.activeBots.toString(),
      change: kpiData.totalTrades > 0 ? `${kpiData.totalTrades} trades` : "Pas d'activité",
      trend: kpiData.activeBots > 0 ? "up" : "neutral",
      icon: Bot,
      color: "#14b8a6"
    },
    {
      title: "Win Rate",
      value: `${kpiData.winRate.toFixed(1)}%`,
      change: kpiData.totalWinningTrades > 0 
        ? `${kpiData.totalWinningTrades}W / ${kpiData.totalLosingTrades}L` 
        : "Pas de trades",
      trend: kpiData.winRate >= 60 ? "up" : kpiData.winRate >= 40 ? "neutral" : "down",
      icon: Target,
      color: "#10b981"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
      {kpis.map((kpi, index) => {
        const IconComponent = kpi.icon;
        const trendColor = kpi.trend === 'up' ? '#10b981' : kpi.trend === 'down' ? '#ef4444' : '#6b7280';
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ 
              scale: 1.05,
              y: -5,
              boxShadow: `0 10px 25px rgba(20, 184, 166, 0.15)`
            }}
            className="relative backdrop-blur-xl bg-gray-900/80 border border-gray-800/80 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden"
          >
            {/* Effet de brillance au survol */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-pulse" />
            
            {/* Indicateur de chargement */}
            {isLoading && (
              <div className="absolute top-2 right-2">
                <Activity className="w-3 h-3 text-gray-500 animate-spin" />
              </div>
            )}
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${kpi.color}20` }}
                >
                  <IconComponent 
                    className="w-5 h-5" 
                    style={{ color: kpi.color }} 
                  />
                </div>
                <span 
                  className="text-xs px-2 py-1 rounded-full font-semibold"
                  style={{ 
                    backgroundColor: `${trendColor}20`,
                    color: trendColor
                  }}
                >
                  {kpi.change}
                </span>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">{kpi.title}</p>
                <p 
                  className="text-2xl font-black"
                  style={{ color: kpi.color }}
                >
                  {isLoading ? '...' : kpi.value}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
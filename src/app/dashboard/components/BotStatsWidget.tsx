'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Bot, TrendingUp, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

interface BotStats {
  id: string;
  name: string;
  strategy: string;
  status: string;
  stats: {
    trades: number;
    profit: number;
    errors: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
  };
}

export default function BotStatsWidget() {
  const [botStats, setBotStats] = useState<BotStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalBots: 0,
    activeBots: 0,
    totalTrades: 0,
    totalProfit: 0,
    totalErrors: 0,
    totalWinningTrades: 0,
    totalLosingTrades: 0,
    winRate: 0
  });

  const fetchBotStats = async () => {
    try {
      const response = await fetch('/api/bots/status');
      const data = await response.json();
      
      if (data.success) {
        setBotStats(data.bots || []);
        setSummary(data.summary || {
          totalBots: 0,
          activeBots: 0,
          totalTrades: 0,
          totalProfit: 0,
          totalErrors: 0,
          totalWinningTrades: 0,
          totalLosingTrades: 0,
          winRate: 0
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch bot stats:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBotStats();
    const interval = setInterval(fetchBotStats, 15000); // Mise à jour toutes les 15 secondes
    return () => clearInterval(interval);
  }, []);

  // Données pour le graphique circulaire des statuts
  const statusData = [
    { name: 'Actifs', value: summary.activeBots, color: '#10b981' },
    { name: 'Inactifs', value: summary.totalBots - summary.activeBots, color: '#6B7280' }
  ];

  // Données pour le graphique en barres des performances
  const performanceData = botStats.slice(0, 5).map(bot => ({
    name: bot.name.length > 8 ? bot.name.substring(0, 8) + '...' : bot.name,
    profit: bot.stats.profit,
    trades: bot.stats.trades,
    errors: bot.stats.errors,
    winningTrades: bot.stats.winningTrades || 0,
    losingTrades: bot.stats.losingTrades || 0,
    winRate: bot.stats.winRate || 0
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 shadow-xl">
          <p className="text-gray-300 text-sm mb-2 font-semibold">{`Bot: ${label}`}</p>
          <p className="text-sm text-green-400">Profit: €{data?.profit?.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-blue-400">Total Trades: {data?.trades || 0}</p>
          <p className="text-sm text-yellow-400">Win Rate: {data?.winRate?.toFixed(1) || '0.0'}%</p>
          <p className="text-sm text-green-300">Gagnants: {data?.winningTrades || 0}</p>
          <p className="text-sm text-red-300">Perdants: {data?.losingTrades || 0}</p>
          <p className="text-sm text-red-400">Erreurs: {data?.errors || 0}</p>
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
          <span>Chargement des statistiques...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Statuts des Bots */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Bot className="w-5 h-5 text-[#14b8a6]" />
          <h3 className="text-lg font-bold text-white">Statuts des Bots</h3>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} bots`, name]}
                labelStyle={{ color: '#fff' }}
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(55, 65, 81, 0.5)',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#10b981] rounded-full"></div>
            <span className="text-sm text-gray-300">Actifs ({summary.activeBots})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Inactifs ({summary.totalBots - summary.activeBots})</span>
          </div>
        </div>
      </motion.div>

      {/* Performance des Bots */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-[#10b981]" />
          <h3 className="text-lg font-bold text-white">Performance Top 5</h3>
        </div>

        <div className="h-48">
          {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF" 
                  fontSize={10}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={10}
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucun bot actif</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Métriques Rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 text-center">
          <CheckCircle className="w-6 h-6 text-[#10b981] mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{summary.totalTrades}</p>
          <p className="text-sm text-gray-400">Trades Total</p>
        </div>
        
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 text-[#14b8a6] mx-auto mb-2" />
          <p className="text-2xl font-bold text-[#14b8a6]">€{summary.totalProfit.toFixed(2)}</p>
          <p className="text-sm text-gray-400">Profit Total</p>
        </div>
        
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{summary.totalErrors}</p>
          <p className="text-sm text-gray-400">Erreurs</p>
        </div>
        
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 text-center">
          <Activity className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {summary.totalTrades > 0 ? ((summary.totalTrades - summary.totalErrors) / summary.totalTrades * 100).toFixed(1) : 0}%
          </p>
          <p className="text-sm text-gray-400">Taux Succès</p>
        </div>
      </motion.div>
    </div>
  );
}
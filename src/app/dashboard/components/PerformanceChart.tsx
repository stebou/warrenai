'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Plus, Bot } from 'lucide-react';
import EnhancedCreateBotModal from './EnhancedCreateBotModal';

interface PerformanceData {
  time: string;
  profit: number;
  balance: number;
  trades: number;
}

interface PerformanceChartProps {
  onBotCreated?: () => void;
}

export default function PerformanceChart({ onBotCreated }: PerformanceChartProps) {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [currentProfit, setCurrentProfit] = useState(0);
  const [profitChange, setProfitChange] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fonction pour récupérer les données de performance
  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/bots/status');
      const botData = await response.json();
      
      if (botData.success) {
        const timestamp = new Date().toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        const totalProfit = botData.summary?.totalProfit || 0;
        const totalTrades = botData.summary?.totalTrades || 0;
        const balance = 10000 + totalProfit; // Balance initiale + profit
        
        const newDataPoint: PerformanceData = {
          time: timestamp,
          profit: totalProfit,
          balance: balance,
          trades: totalTrades
        };

        setData(prevData => {
          const newData = [...prevData, newDataPoint];
          // Garder seulement les 20 derniers points
          return newData.slice(-20);
        });

        // Calculer le changement de profit
        if (data.length > 0) {
          const lastProfit = data[data.length - 1].profit;
          setProfitChange(totalProfit - lastProfit);
        }
        
        setCurrentProfit(totalProfit);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
      setIsLoading(false);
    }
  };

  // Récupération initiale et mise à jour toutes les 10 secondes
  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 10000);
    return () => clearInterval(interval);
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 shadow-xl">
          <p className="text-gray-300 text-sm mb-2">{`Temps: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.name === 'Balance' ? '€' : ''}${entry.value.toFixed(2)}`}
            </p>
          ))}
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
          <span>Chargement des données...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Performance en Temps Réel</h3>
          <p className="text-gray-400 text-sm">Évolution du P&L et de la balance</p>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#10b981] text-white font-semibold rounded-lg hover:from-[#0f9e90] hover:to-[#0d9f73] transition-all duration-200 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau Bot</span>
          </motion.button>
          
          <div className="text-right">
            <p className="text-sm text-gray-400">P&L Actuel</p>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${currentProfit >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
                €{currentProfit.toFixed(2)}
              </span>
              {profitChange !== 0 && (
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  profitChange > 0 
                    ? 'bg-[#10b981]/20 text-[#10b981]' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {profitChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {profitChange > 0 ? '+' : ''}{profitChange.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Graphique */}
      <div className="h-80">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
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
              />
              <Tooltip content={<CustomTooltip />} />
              
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#14b8a6"
                strokeWidth={2}
                fill="url(#balanceGradient)"
                name="Balance"
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#profitGradient)"
                name="P&L"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Aucune donnée disponible</p>
              <p className="text-sm">Les données apparaîtront au fur et à mesure</p>
            </div>
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#14b8a6] rounded-full"></div>
          <span className="text-sm text-gray-300">Balance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#10b981] rounded-full"></div>
          <span className="text-sm text-gray-300">P&L</span>
        </div>
      </div>
      
      {/* Modal de création de bot */}
      <EnhancedCreateBotModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onBotCreated={() => {
          onBotCreated?.();
          // Rafraîchir les données de performance après création
          fetchPerformanceData();
        }}
      />
    </motion.div>
  );
}
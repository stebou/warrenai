'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bot, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  AlertTriangle,
  Clock,
  Zap,
  RefreshCw,
  Edit,
  Trash2,
  Copy,
  Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

interface BotData {
  id: string;
  name: string;
  description: string;
  strategy: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
  createdAt: string;
  updatedAt: string;
  aiConfig: any;
  runtime?: number;
  stats?: {
    trades: number;
    profit: number;
    errors: number;
  };
  lastAction?: number;
  isRunning?: boolean;
}

interface BotDetailModalProps {
  bot: BotData;
  onClose: () => void;
  onUpdate: () => void;
}

interface PerformanceData {
  time: string;
  profit: number;
  trades: number;
  balance: number;
}

export default function BotDetailModal({ bot, onClose, onUpdate }: BotDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Actions sur le bot
  const handleBotAction = async (action: 'start' | 'stop' | 'pause') => {
    try {
      setIsActionLoading(true);
      const endpoint = action === 'pause' ? 'stop' : action;
      const response = await fetch(`/api/bots/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: bot.id }),
        credentials: 'include'
      });

      if (response.ok) {
        // Rafraîchir en arrière-plan
        onUpdate();
      }
    } catch (error) {
      console.error(`Error ${action}ing bot:`, error);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Générer des données de performance simulées
  const generatePerformanceData = () => {
    const data: PerformanceData[] = [];
    const now = new Date();
    let currentProfit = bot.stats?.profit || 0;
    let currentTrades = bot.stats?.trades || 0;
    let currentBalance = 10000 + currentProfit;

    for (let i = 19; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60 * 1000);
      
      // Simuler des variations
      if (i < 19) {
        const change = (Math.random() - 0.5) * 50;
        currentProfit += change;
        if (Math.random() > 0.7) currentTrades += 1;
        currentBalance = 10000 + currentProfit;
      }

      data.push({
        time: time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        profit: currentProfit,
        trades: currentTrades,
        balance: currentBalance
      });
    }

    setPerformanceData(data);
  };

  useEffect(() => {
    generatePerformanceData();
    const interval = setInterval(() => {
      generatePerformanceData();
      setLastUpdate(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, [bot]);

  const formatRuntime = (runtime: number): string => {
    if (runtime === 0) return '0s';
    const hours = Math.floor(runtime / (1000 * 60 * 60));
    const minutes = Math.floor((runtime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((runtime % (1000 * 60)) / 1000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getStatusIcon = () => {
    if (bot.isRunning) return <Activity className="w-5 h-5 text-[#10b981] animate-pulse" />;
    if (bot.status === 'PAUSED') return <Pause className="w-5 h-5 text-yellow-500" />;
    return <Square className="w-5 h-5 text-gray-500" />;
  };

  const getStatusText = () => {
    if (bot.isRunning) return 'En trading';
    if (bot.status === 'PAUSED') return 'En pause';
    return 'Arrêté';
  };

  const getStatusColor = () => {
    if (bot.isRunning) return 'text-[#10b981] bg-[#10b981]/20 border-[#10b981]/30';
    if (bot.status === 'PAUSED') return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
    return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  // Données pour le graphique en secteurs des résultats
  const tradeResults = [
    { name: 'Réussis', value: Math.max(0, (bot.stats?.trades || 0) - (bot.stats?.errors || 0)), color: '#10b981' },
    { name: 'Échoués', value: bot.stats?.errors || 0, color: '#ef4444' }
  ];

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'settings', label: 'Paramètres', icon: Settings },
    { id: 'logs', label: 'Logs', icon: Activity }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 shadow-xl">
          <p className="text-gray-300 text-sm mb-2">{`Temps: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey === 'profit' ? 'Profit: €' : `${entry.dataKey}: `}${entry.value.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900/95 border border-gray-700/50 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-[#14b8a6] to-[#10b981] rounded-xl flex items-center justify-center">
                  <Bot className="w-8 h-8 text-black" />
                </div>
                <div className="absolute -bottom-1 -right-1">
                  {getStatusIcon()}
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{bot.name}</h2>
                <p className="text-gray-400 mb-2">{bot.strategy}</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor()}`}>
                  {getStatusIcon()}
                  {getStatusText()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Actions rapides */}
              <div className="flex items-center gap-2">
                {bot.isRunning ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleBotAction('stop')}
                    disabled={isActionLoading}
                    className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isActionLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                    {isActionLoading ? 'Arrêt...' : 'Arrêter'}
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleBotAction('start')}
                    disabled={isActionLoading}
                    className="px-4 py-2 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded-lg hover:bg-[#10b981]/30 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isActionLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {isActionLoading ? 'Démarrage...' : 'Démarrer'}
                  </motion.button>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-gray-700/50 text-gray-400 border border-gray-600/50 rounded-lg hover:bg-gray-600/50 transition-all duration-200"
                  title="Actualiser"
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.button>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#14b8a6] to-[#10b981] text-black'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Métriques principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-8 h-8 text-[#14b8a6]" />
                      <div>
                        <p className={`text-xl font-bold ${(bot.stats?.profit || 0) >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
                          {(bot.stats?.profit || 0) >= 0 ? '+' : ''}€{(bot.stats?.profit || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-400">P&L Total</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Target className="w-8 h-8 text-blue-400" />
                      <div>
                        <p className="text-xl font-bold text-white">{bot.stats?.trades || 0}</p>
                        <p className="text-sm text-gray-400">Trades</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-8 h-8 text-orange-400" />
                      <div>
                        <p className="text-xl font-bold text-white">{bot.stats?.errors || 0}</p>
                        <p className="text-sm text-gray-400">Erreurs</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-8 h-8 text-purple-400" />
                      <div>
                        <p className="text-xl font-bold text-white">{formatRuntime(bot.runtime || 0)}</p>
                        <p className="text-sm text-gray-400">Runtime</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Graphiques côte à côte */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Répartition des trades */}
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Répartition des Trades</h3>
                    <div className="h-64">
                      {(bot.stats?.trades || 0) > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={tradeResults}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {tradeResults.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value, name) => [`${value} trades`, name]}
                              labelStyle={{ color: '#fff' }}
                              contentStyle={{
                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                border: '1px solid rgba(55, 65, 81, 0.5)',
                                borderRadius: '8px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Aucun trade effectué</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#10b981] rounded-full"></div>
                        <span className="text-sm text-gray-300">Réussis ({tradeResults[0].value})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <span className="text-sm text-gray-300">Échoués ({tradeResults[1].value})</span>
                      </div>
                    </div>
                  </div>

                  {/* Informations détaillées */}
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Informations Détaillées</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Stratégie:</span>
                        <span className="text-white font-semibold">{bot.strategy}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Créé le:</span>
                        <span className="text-white">{new Date(bot.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Dernière action:</span>
                        <span className="text-white">
                          {bot.lastAction ? new Date(bot.lastAction).toLocaleTimeString('fr-FR') : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Taux de réussite:</span>
                        <span className="text-[#10b981] font-semibold">
                          {(bot.stats?.trades || 0) > 0 
                            ? (((bot.stats?.trades || 0) - (bot.stats?.errors || 0)) / (bot.stats?.trades || 1) * 100).toFixed(1)
                            : 0
                          }%
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Profit par trade:</span>
                        <span className="text-white">
                          €{(bot.stats?.trades || 0) > 0 
                            ? ((bot.stats?.profit || 0) / (bot.stats?.trades || 1)).toFixed(2)
                            : '0.00'
                          }
                        </span>
                      </div>

                      <div className="pt-4 border-t border-gray-700/50">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 px-4 py-2 bg-[#14b8a6]/20 text-[#14b8a6] border border-[#14b8a6]/30 rounded-lg hover:bg-[#14b8a6]/30 transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Modifier
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Dupliquer
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'performance' && (
              <motion.div
                key="performance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Graphique de performance */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Performance en Temps Réel</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-400">Mis à jour: {new Date(lastUpdate).toLocaleTimeString('fr-FR')}</span>
                    </div>
                  </div>

                  <div className="h-80">
                    {performanceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <defs>
                            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                            dataKey="profit"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#profitGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>Données de performance indisponibles</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistiques détaillées */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="w-6 h-6 text-[#10b981]" />
                      <h4 className="font-bold text-white">Meilleure Performance</h4>
                    </div>
                    <p className="text-2xl font-bold text-[#10b981]">+€{Math.max(...performanceData.map(d => d.profit), 0).toFixed(2)}</p>
                    <p className="text-sm text-gray-400">Plus haut profit atteint</p>
                  </div>
                  
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingDown className="w-6 h-6 text-red-400" />
                      <h4 className="font-bold text-white">Pire Performance</h4>
                    </div>
                    <p className="text-2xl font-bold text-red-400">€{Math.min(...performanceData.map(d => d.profit), 0).toFixed(2)}</p>
                    <p className="text-sm text-gray-400">Plus bas profit atteint</p>
                  </div>
                  
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Activity className="w-6 h-6 text-blue-400" />
                      <h4 className="font-bold text-white">Volatilité</h4>
                    </div>
                    <p className="text-2xl font-bold text-blue-400">
                      {performanceData.length > 0 
                        ? (Math.max(...performanceData.map(d => d.profit)) - Math.min(...performanceData.map(d => d.profit))).toFixed(2)
                        : '0.00'
                      }
                    </p>
                    <p className="text-sm text-gray-400">Écart de performance</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Configuration du Bot</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Nom du bot</label>
                      <input
                        type="text"
                        value={bot.name}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-[#14b8a6]/50 focus:outline-none"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Stratégie</label>
                      <select className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-[#14b8a6]/50 focus:outline-none">
                        <option value={bot.strategy}>{bot.strategy}</option>
                        <option value="momentum">Momentum Trading</option>
                        <option value="scalping">Scalping</option>
                        <option value="dca">Dollar Cost Average</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Fréquence de trading (min)</label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          defaultValue="1"
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-[#14b8a6]/50 focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Allocation max (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          defaultValue="10"
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-[#14b8a6]/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-700/50">
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-2 bg-gradient-to-r from-[#14b8a6] to-[#10b981] text-white font-semibold rounded-lg hover:from-[#0f9e90] hover:to-[#0d9f73] transition-all duration-200"
                        >
                          Sauvegarder
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-2 bg-gray-700/50 text-gray-300 border border-gray-600/50 rounded-lg hover:bg-gray-600/50 transition-all duration-200"
                        >
                          Annuler
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all duration-200 ml-auto flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Logs d'Activité</h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1 bg-[#14b8a6]/20 text-[#14b8a6] border border-[#14b8a6]/30 rounded-lg hover:bg-[#14b8a6]/30 transition-all duration-200 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Exporter
                    </motion.button>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-[#10b981]">
                        <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                        <span>INFO</span>
                        <span>Bot {bot.name} - Trading cycle executed successfully</span>
                      </div>
                      <div className="flex items-center gap-3 text-blue-400">
                        <span className="text-gray-500">[{new Date(Date.now() - 60000).toLocaleTimeString()}]</span>
                        <span>DEBUG</span>
                        <span>Market analysis completed for BTC/USDT</span>
                      </div>
                      <div className="flex items-center gap-3 text-yellow-500">
                        <span className="text-gray-500">[{new Date(Date.now() - 120000).toLocaleTimeString()}]</span>
                        <span>WARN</span>
                        <span>Signal confidence below threshold (0.3)</span>
                      </div>
                      <div className="flex items-center gap-3 text-[#10b981]">
                        <span className="text-gray-500">[{new Date(Date.now() - 180000).toLocaleTimeString()}]</span>
                        <span>INFO</span>
                        <span>Order executed: BUY 0.01 BTC at $43,250.00</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400">
                        <span className="text-gray-500">[{new Date(Date.now() - 240000).toLocaleTimeString()}]</span>
                        <span>INFO</span>
                        <span>Bot started successfully</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
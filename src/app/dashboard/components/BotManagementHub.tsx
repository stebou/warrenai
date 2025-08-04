'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Play, 
  Pause, 
  Square, 
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  RefreshCw,
  Trash2
} from 'lucide-react';
import BotDetailModal from './BotDetailModal';
import EnhancedCreateBotModal from './EnhancedCreateBotModal';

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

export default function BotManagementHub() {
  const [bots, setBots] = useState<BotData[]>([]);
  const [filteredBots, setFilteredBots] = useState<BotData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingBots, setLoadingBots] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedBot, setSelectedBot] = useState<BotData | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ bot: BotData } | null>(null);

  // Récupérer les données des bots
  const fetchBots = async (isInitialLoad = false) => {
    try {
      // Pour le chargement initial, utiliser isLoading
      // Pour les rafraîchissements, utiliser isRefreshing
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      // L'API /api/bots/status contient maintenant toutes les données nécessaires
      // Un seul appel pour éviter les problèmes de synchronisation
      const statusResponse = await fetch('/api/bots/status', {
        credentials: 'include'
      });
      
      if (!statusResponse.ok) {
        throw new Error('Erreur lors de la récupération des bots');
      }
      
      const statusData = await statusResponse.json();
      const allBots = statusData.bots || [];
      
      // Transformer les données pour l'interface
      const combinedBots = allBots.map((bot: any) => ({
        // Données de base du bot
        id: bot.id,
        name: bot.name,
        description: bot.description || '',
        strategy: bot.strategy,
        createdAt: bot.createdAt,
        updatedAt: bot.updatedAt,
        aiConfig: bot.aiConfig || {},
        // États de trading (source de vérité unique)
        status: bot.dbStatus || 'INACTIVE',
        isRunning: bot.status === 'running',
        runtime: bot.runtime || 0,
        stats: bot.stats || { trades: 0, profit: 0, errors: 0 },
        lastAction: bot.lastAction
      }));
      
      setBots(combinedBots);
      setFilteredBots(combinedBots);
      setError(null);
    } catch (err) {
      console.error('Error fetching bots:', err);
      if (isInitialLoad) {
        setError('Erreur lors du chargement des bots');
      }
      // Ne pas afficher d'erreur pour les rafraîchissements en arrière-plan
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  // Actions sur les bots
  const handleBotAction = async (botId: string, action: 'start' | 'stop' | 'pause') => {
    try {
      // Ajouter le bot aux bots en cours de chargement
      setLoadingBots(prev => new Set(prev).add(botId));
      
      const endpoint = action === 'pause' ? 'stop' : action;
      const response = await fetch(`/api/bots/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId }),
        credentials: 'include'
      });

      if (response.ok) {
        // Rafraîchir en arrière-plan sans faire disparaître les bots
        await fetchBots(false);
      } else {
        const error = await response.json();
        
        // Ne pas afficher d'erreur si le bot est déjà démarré/arrêté
        if (response.status === 409 || error.message?.includes('already running') || error.message?.includes('not running')) {
          console.log(`Bot is already in desired state: ${action}`, error);
          // Rafraîchir quand même pour synchroniser l'interface
          await fetchBots(false);
        } else {
          console.error(`Failed to ${action} bot:`, error);
          // Ici on pourrait ajouter une notification d'erreur à l'utilisateur
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing bot:`, error);
    } finally {
      // Retirer le bot des bots en cours de chargement
      setLoadingBots(prev => {
        const newSet = new Set(prev);
        newSet.delete(botId);
        return newSet;
      });
    }
  };

  // Fonction pour ouvrir la modal de confirmation de suppression
  const handleDeleteBot = (botId: string, botName: string) => {
    const bot = bots.find(b => b.id === botId);
    if (bot) {
      setDeleteConfirmation({ bot });
    }
  };

  // Fonction pour confirmer la suppression
  const confirmDeleteBot = async () => {
    if (!deleteConfirmation?.bot) return;

    const { bot } = deleteConfirmation;

    try {
      // Fermer la modal de confirmation
      setDeleteConfirmation(null);

      // Ajouter le bot aux bots en cours de chargement
      setLoadingBots(prev => new Set(prev).add(bot.id));
      
      const response = await fetch('/api/bots/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: bot.id }),
        credentials: 'include'
      });

      if (response.ok) {
        // Supprimer le bot de la liste locale immédiatement
        setBots(prevBots => prevBots.filter(b => b.id !== bot.id));
        console.log(`Bot "${bot.name}" supprimé avec succès`);
        
        // Rafraîchir la liste complète en arrière-plan
        await fetchBots(false);
      } else {
        const error = await response.json();
        console.error('Failed to delete bot:', error);
        alert(`Erreur lors de la suppression du bot: ${error.details || error.error}`);
      }
    } catch (error) {
      console.error('Error deleting bot:', error);
      alert('Erreur de connexion lors de la suppression du bot');
    } finally {
      // Retirer le bot des bots en cours de chargement
      setLoadingBots(prev => {
        const newSet = new Set(prev);
        newSet.delete(bot.id);
        return newSet;
      });
    }
  };

  // Filtrage et tri
  useEffect(() => {
    let filtered = bots;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(bot => 
        bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bot.strategy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      if (statusFilter === 'running') {
        filtered = filtered.filter(bot => bot.isRunning);
      } else if (statusFilter === 'stopped') {
        filtered = filtered.filter(bot => !bot.isRunning);
      } else {
        filtered = filtered.filter(bot => bot.status === statusFilter.toUpperCase());
      }
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'profit':
          return (b.stats?.profit || 0) - (a.stats?.profit || 0);
        case 'trades':
          return (b.stats?.trades || 0) - (a.stats?.trades || 0);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredBots(filtered);
  }, [bots, searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    fetchBots(true); // Chargement initial
    const interval = setInterval(() => fetchBots(false), 60000); // Rafraîchissements toutes les minutes
    return () => clearInterval(interval);
  }, []);

  const formatRuntime = (runtime: number): string => {
    if (runtime === 0) return '0s';
    const hours = Math.floor(runtime / (1000 * 60 * 60));
    const minutes = Math.floor((runtime % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusIcon = (bot: BotData) => {
    // Si le bot est marqué ACTIVE dans la DB mais pas running, il est en récupération
    const isRecovering = (bot as any).dbStatus === 'ACTIVE' && !bot.isRunning;
    
    if (bot.isRunning) return <Activity className="w-4 h-4 text-[#10b981] animate-pulse" />;
    if (isRecovering) return <RefreshCw className="w-4 h-4 text-orange-400 animate-spin" />;
    if (bot.status === 'PAUSED') return <Pause className="w-4 h-4 text-yellow-500" />;
    return <Square className="w-4 h-4 text-gray-500" />;
  };

  const getStatusColor = (bot: BotData) => {
    const isRecovering = (bot as any).dbStatus === 'ACTIVE' && !bot.isRunning;
    
    if (bot.isRunning) return 'border-[#10b981]/30 bg-[#10b981]/10';
    if (isRecovering) return 'border-orange-400/30 bg-orange-400/10';
    if (bot.status === 'PAUSED') return 'border-yellow-500/30 bg-yellow-500/10';
    return 'border-gray-500/30 bg-gray-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-white mb-2">🤖 Centre de Contrôle des Bots</h1>
          <p className="text-gray-400">Gérez, surveillez et optimisez vos bots de trading</p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchBots(false)}
            disabled={isRefreshing}
            className="px-4 py-2 bg-gray-700/50 text-gray-300 border border-gray-600/50 rounded-lg hover:bg-gray-600/50 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2 bg-gradient-to-r from-[#14b8a6] to-[#10b981] text-white font-semibold rounded-lg hover:from-[#0f9e90] hover:to-[#0d9f73] transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau Bot
          </motion.button>
        </div>
      </motion.div>

      {/* Statistiques Rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="w-8 h-8 text-[#14b8a6]" />
              {isRefreshing && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#14b8a6] rounded-full animate-pulse"></div>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{bots.length}</p>
              <p className="text-sm text-gray-400">Total Bots</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-[#10b981]" />
            <div>
              <p className="text-2xl font-bold text-white">{bots.filter(b => b.isRunning).length}</p>
              <p className="text-sm text-gray-400">En Trading</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-[#14b8a6]" />
            <div>
              <p className="text-2xl font-bold text-[#14b8a6]">
                €{bots.reduce((sum, bot) => sum + (bot.stats?.profit || 0), 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-400">Profit Total</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {bots.reduce((sum, bot) => sum + (bot.stats?.trades || 0), 0)}
              </p>
              <p className="text-sm text-gray-400">Trades Total</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filtres et Recherche */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un bot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-[#14b8a6]/50 focus:outline-none"
            />
          </div>

          {/* Filtres */}
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:border-[#14b8a6]/50 focus:outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="running">En trading</option>
              <option value="stopped">Arrêtés</option>
              <option value="ACTIVE">Créés</option>
              <option value="PAUSED">En pause</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:border-[#14b8a6]/50 focus:outline-none"
            >
              <option value="name">Nom</option>
              <option value="profit">Profit</option>
              <option value="trades">Nombre de trades</option>
              <option value="created">Date de création</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Liste des Bots */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-4"
      >
        <AnimatePresence>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Activity className="w-8 h-8 text-[#14b8a6] animate-spin" />
              <span className="ml-3 text-gray-400">Chargement des bots...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <button 
                onClick={fetchBots}
                className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all duration-200"
              >
                Réessayer
              </button>
            </div>
          ) : filteredBots.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucun bot ne correspond aux critères de recherche'
                  : 'Aucun bot créé pour le moment'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-6 py-2 bg-gradient-to-r from-[#14b8a6] to-[#10b981] text-white font-semibold rounded-lg hover:from-[#0f9e90] hover:to-[#0d9f73] transition-all duration-200"
                >
                  Créer mon premier bot
                </button>
              )}
            </div>
          ) : (
            filteredBots.map((bot, index) => (
              <motion.div
                key={bot.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`bg-gray-900/50 backdrop-blur-sm border rounded-xl p-6 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer ${getStatusColor(bot)}`}
                onClick={() => setSelectedBot(bot)}
              >
                <div className="flex items-center justify-between">
                  {/* Info du Bot */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#14b8a6] to-[#10b981] rounded-full flex items-center justify-center">
                        <Bot className="w-6 h-6 text-black" />
                      </div>
                      <div className="absolute -bottom-1 -right-1">
                        {getStatusIcon(bot)}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{bot.name}</h3>
                      <p className="text-gray-400 text-sm">{bot.strategy}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          Runtime: {formatRuntime(bot.runtime || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Métriques */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${(bot.stats?.profit || 0) >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
                        {(bot.stats?.profit || 0) >= 0 ? '+' : ''}€{(bot.stats?.profit || 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">P&L</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{bot.stats?.trades || 0}</div>
                      <div className="text-xs text-gray-400">Trades</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-400">{bot.stats?.errors || 0}</div>
                      <div className="text-xs text-gray-400">Erreurs</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {bot.isRunning ? (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBotAction(bot.id, 'stop');
                        }}
                        disabled={loadingBots.has(bot.id) || isRefreshing}
                        className="p-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative"
                        title="Arrêter le trading"
                      >
                        {loadingBots.has(bot.id) ? (
                          <Activity className="w-4 h-4 animate-spin" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                        {loadingBots.has(bot.id) && (
                          <div className="absolute inset-0 bg-red-500/10 rounded-lg animate-pulse"></div>
                        )}
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBotAction(bot.id, 'start');
                        }}
                        disabled={loadingBots.has(bot.id) || isRefreshing}
                        className="p-2 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded-lg hover:bg-[#10b981]/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative"
                        title="Démarrer le trading"
                      >
                        {loadingBots.has(bot.id) ? (
                          <Activity className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        {loadingBots.has(bot.id) && (
                          <div className="absolute inset-0 bg-[#10b981]/10 rounded-lg animate-pulse"></div>
                        )}
                      </motion.button>
                    )}
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-[#14b8a6]/20 text-[#14b8a6] border border-[#14b8a6]/30 rounded-lg hover:bg-[#14b8a6]/30 transition-all duration-200"
                      title="Paramètres"
                    >
                      <Settings className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBot(bot.id, bot.name);
                      }}
                      disabled={loadingBots.has(bot.id) || isRefreshing}
                      className="p-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative"
                      title="Supprimer le bot"
                    >
                      {loadingBots.has(bot.id) ? (
                        <Activity className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      {loadingBots.has(bot.id) && (
                        <div className="absolute inset-0 bg-red-600/10 rounded-lg animate-pulse"></div>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {selectedBot && (
          <BotDetailModal
            bot={selectedBot}
            onClose={() => setSelectedBot(null)}
            onUpdate={fetchBots}
          />
        )}
      </AnimatePresence>

      <EnhancedCreateBotModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onBotCreated={fetchBots}
      />

      {/* Modal de confirmation de suppression */}
      <AnimatePresence>
        {deleteConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setDeleteConfirmation(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-red-500/50 rounded-xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">
                    Supprimer le bot
                  </h3>
                  <p className="text-sm text-gray-400">
                    Cette action est irréversible
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4 mb-6">
                <p className="text-gray-300">
                  Êtes-vous sûr de vouloir supprimer le bot{' '}
                  <span className="font-semibold text-white">"{deleteConfirmation.bot.name}"</span> ?
                </p>
                
                <div className="bg-red-950/50 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-200 text-sm font-medium mb-2">
                    Cette action supprimera définitivement :
                  </p>
                  <ul className="text-red-300 text-sm space-y-1">
                    <li>• Le bot et toute sa configuration</li>
                    <li>• Toutes les statistiques et l'historique</li>
                    <li>• Tous les ordres en cours (s'il y en a)</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteBot}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
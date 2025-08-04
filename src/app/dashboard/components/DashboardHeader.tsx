'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { Bell, TrendingUp, DollarSign, Bot, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface DashboardHeaderProps {
  onSidebarToggle: () => void;
}

interface BotSummary {
  totalBots: number;
  activeBots: number;
  totalTrades: number;
  totalProfit: number;
  totalErrors: number;
  totalWinningTrades: number;
  totalLosingTrades: number;
  winRate: number;
}

export default function DashboardHeader({ onSidebarToggle }: DashboardHeaderProps) {
  const { user } = useUser();
  const [summary, setSummary] = useState<BotSummary>({
    totalBots: 0,
    activeBots: 0,
    totalTrades: 0,
    totalProfit: 0,
    totalErrors: 0,
    totalWinningTrades: 0,
    totalLosingTrades: 0,
    winRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBotSummary = async () => {
      try {
        const response = await fetch('/api/bots/status');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.summary) {
            setSummary(data.summary);
          }
        }
      } catch (error) {
        console.error('Error fetching bot summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBotSummary();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchBotSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculer les métriques pour le header (même base que KPICards)
  const portfolioValue = 10000 + summary.totalProfit; // Base de $10000 + profits
  const dailyPL = summary.totalProfit; // Simplification - profits comme P&L journalier

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-16 bg-black/95 backdrop-blur-xl border-b border-gray-800/50 flex items-center justify-between px-6"
    >
      {/* Section gauche - Hamburger + Titre */}
      <div className="flex items-center gap-4">
        {/* Bouton hamburger pour mobile uniquement */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSidebarToggle}
          className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-[#14b8a6]/50"
        >
          <Menu className="w-6 h-6" />
        </motion.button>
        
        <div>
          <h1 className="text-xl font-black text-white">Tableau de Bord</h1>
          <p className="text-sm" style={{ color: '#a1a1aa' }}>
            Bienvenue, {user?.firstName || 'Trader'} ✨
          </p>
        </div>
      </div>

      {/* Section droite - Actions */}
      <div className="flex items-center gap-6">
        {/* Métriques rapides */}
        <div className="hidden lg:flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="text-center bg-gray-900/80 border border-gray-800/80 rounded-xl p-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-3 h-3 text-[#14b8a6]" />
              <p className="text-xs text-gray-400">Balance</p>
            </div>
            <p className="text-sm font-bold text-white">
              {loading ? '...' : `$${portfolioValue.toFixed(2)}`}
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="text-center bg-gray-900/80 border border-gray-800/80 rounded-xl p-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className={`w-3 h-3 ${dailyPL >= 0 ? 'text-[#10b981]' : 'text-red-400'}`} />
              <p className="text-xs text-gray-400">P&L Total</p>
            </div>
            <p className={`text-sm font-bold ${dailyPL >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
              {loading ? '...' : `${dailyPL >= 0 ? '+' : ''}$${dailyPL.toFixed(2)}`}
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="text-center bg-gray-900/80 border border-gray-800/80 rounded-xl p-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-3 h-3 text-[#14b8a6]" />
              <p className="text-xs text-gray-400">Bots Actifs</p>
            </div>
            <p className="text-sm font-bold text-white">
              {loading ? '...' : `${summary.activeBots}/${summary.totalBots}`}
            </p>
          </motion.div>
        </div>

        {/* Séparateur */}
        <div className="h-6 w-px bg-gray-800/50"></div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
          >
            <Bell className="w-5 h-5" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#14b8a6] rounded-full animate-pulse"></div>
          </motion.button>

          {/* Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-white">
                {user?.firstName || 'Trader'}
              </p>
              <p className="text-xs text-[#14b8a6] font-medium">Pro Trader</p>
            </div>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-full border border-[#14b8a6]/30 hover:border-[#14b8a6] transition-colors"
                }
              }}
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
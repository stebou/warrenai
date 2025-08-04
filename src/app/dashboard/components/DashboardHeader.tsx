'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { Bell, TrendingUp, DollarSign, Bot, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  onSidebarToggle: () => void;
}

export default function DashboardHeader({ onSidebarToggle }: DashboardHeaderProps) {
  const { user } = useUser();

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
            <p className="text-sm font-bold text-white">€127,485.50</p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="text-center bg-gray-900/80 border border-gray-800/80 rounded-xl p-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-[#10b981]" />
              <p className="text-xs text-gray-400">P&L Jour</p>
            </div>
            <p className="text-sm font-bold text-[#10b981]">+€2,340.75</p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="text-center bg-gray-900/80 border border-gray-800/80 rounded-xl p-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-3 h-3 text-[#14b8a6]" />
              <p className="text-xs text-gray-400">Bots Actifs</p>
            </div>
            <p className="text-sm font-bold text-white">12</p>
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
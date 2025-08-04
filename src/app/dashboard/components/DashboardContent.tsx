'use client';

import { useState, useCallback } from 'react';
import KPICards from './KPICards';
import LiveTradingFeed from './LiveTradingFeed';
import PerformanceChart from './PerformanceChart';
import BotStatsWidget from './BotStatsWidget';
import MarketDataWidget from './MarketDataWidget';
import AdminSection from './AdminSection';

export default function DashboardContent() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Callback pour rafraîchir tous les composants après création d'un bot
  const handleBotCreated = useCallback(() => {
    console.log('🔄 Bot créé - Rafraîchissement du dashboard...');
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="space-y-6">
      {/* KPI Cards - Version améliorée */}
      <KPICards key={`kpi-${refreshKey}`} />

      {/* Graphique de Performance Principal avec bouton de création */}
      <PerformanceChart onBotCreated={handleBotCreated} />

      {/* Contenu principal avec graphiques */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Données de Marché */}
        <div className="xl:col-span-1">
          <MarketDataWidget key={`market-${refreshKey}`} />
        </div>
        
        {/* Statistiques des Bots */}
        <div className="xl:col-span-2">
          <BotStatsWidget key={`stats-${refreshKey}`} />
        </div>
      </div>

      {/* Feed Trading en pleine largeur */}
      <LiveTradingFeed key={`feed-${refreshKey}`} />

      {/* Section Admin - Visible uniquement pour les administrateurs */}
      <AdminSection key={`admin-${refreshKey}`} />
    </div>
  );
}
'use client';

import { useState, useCallback } from 'react';
import KPICards from './KPICards';
import LiveTradingFeed from './LiveTradingFeed';
import PerformanceChart from './PerformanceChart';
import BotStatsWidget from './BotStatsWidget';
import MarketDataWidget from './MarketDataWidget';
import AdminSection from './AdminSection';
import TradingViewChart from '@/components/trading/TradingViewChart';
import MarketOverview from '@/components/trading/MarketOverview';
import PriceTicker from '@/components/trading/PriceTicker';
import TechnicalAnalysis from '@/components/trading/TechnicalAnalysis';
import SymbolOverview from '@/components/trading/SymbolOverview';
import SymbolSelector from '@/components/trading/SymbolSelector';

export default function DashboardContent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedSymbol, setSelectedSymbol] = useState('BINANCE:BTCUSDT');

  // Callback pour rafraîchir tous les composants après création d'un bot
  const handleBotCreated = useCallback(() => {
    console.log('🔄 Bot créé - Rafraîchissement du dashboard...');
    setRefreshKey(prev => prev + 1);
  }, []);

  // Callback pour changer le symbole sélectionné
  const handleSymbolChange = useCallback((symbol: string) => {
    console.log('📈 Changement de symbole:', symbol);
    setSelectedSymbol(symbol);
  }, []);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KPICards key={`kpi-${refreshKey}`} />

      {/* Prix en temps réel - Ticker horizontal */}
      <PriceTicker />

      {/* Graphique de Performance Principal avec bouton de création */}
      <PerformanceChart onBotCreated={handleBotCreated} />

      {/* Sélecteur de symboles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Analyse de Marché</h2>
          <p className="text-gray-400 text-sm">Charts et données en temps réel</p>
        </div>
        <SymbolSelector 
          selectedSymbol={selectedSymbol} 
          onSymbolChange={handleSymbolChange}
        />
      </div>

      {/* Section Trading View - Layout principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart Principal - 2/3 de la largeur */}
        <div className="xl:col-span-2">
          <TradingViewChart symbol={selectedSymbol} height="600" />
        </div>
        
        {/* Panneau latéral droite - 1/3 de la largeur */}
        <div className="xl:col-span-1 space-y-6">
          {/* Analyse Technique */}
          <TechnicalAnalysis symbol={selectedSymbol} height="300" />
          
          {/* Vue d'ensemble des symboles */}
          <SymbolOverview />
        </div>
      </div>

      {/* Vue d'ensemble du marché */}
      <MarketOverview height="400" />

      {/* Contenu existant - Stats des bots et données de marché */}
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
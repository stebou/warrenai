'use client';

import KPICards from './components/KPICards';
import BotsList from './components/BotsList';
import LiveTradingFeed from './components/LiveTradingFeed';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards - Version simplifiée */}
      <KPICards />

      {/* Contenu principal simplifié */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bots */}
        <BotsList />
        
        {/* Feed Trading */}
        <LiveTradingFeed />
      </div>
    </div>
  );
}
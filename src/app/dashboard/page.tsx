import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import KPICards from './components/KPICards';
import BotsList from './components/BotsList';
import LiveTradingFeed from './components/LiveTradingFeed';
import { UserButton } from '@clerk/nextjs';
import { getUserAuth } from '@/lib/auth/utils';


export default async function DashboardPage() {
  // Server-side auth check (recommended by Clerk)
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
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
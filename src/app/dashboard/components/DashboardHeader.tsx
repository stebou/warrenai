'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import ThemeToggle from '@/components/ThemeToggle';

export default function DashboardHeader() {
  const { user } = useUser();

  return (
    <header className="h-16 bg-background/20 backdrop-blur-xl border-b border-white/10 shadow-lg flex items-center justify-between px-6">
      {/* Section gauche - Titre */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.firstName || 'Trader'}</p>
      </div>

      {/* Section droite - Actions */}
      <div className="flex items-center gap-4">
        {/* Métriques rapides avec style homepage */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="text-right backdrop-blur-sm bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-sm font-semibold text-foreground">€127,485.50</p>
          </div>
          <div className="text-right backdrop-blur-sm bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-xs text-muted-foreground">Today P&L</p>
            <p className="text-sm font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">+€2,340.75</p>
          </div>
          <div className="text-right backdrop-blur-sm bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-xs text-muted-foreground">Active Bots</p>
            <p className="text-sm font-semibold text-foreground">12</p>
          </div>
        </div>

        {/* Séparateur glassmorphique */}
        <div className="h-6 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent"></div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          {/* Notifications avec style homepage */}
          <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors backdrop-blur-sm hover:bg-white/10 rounded-lg border border-transparent hover:border-white/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5h5m-5-15v9a3 3 0 01-3 3H9a3 3 0 01-3-3V12a3 3 0 013-3h3a3 3 0 013 3z" />
            </svg>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-secondary rounded-full shadow-lg"></div>
          </button>

          {/* Profile avec style homepage */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">
                {user?.firstName || 'User'}
              </p>
              <p className="text-xs text-muted-foreground">Pro Trader</p>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-full p-1 border border-white/20">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
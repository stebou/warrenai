'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  BarChart3, 
  Briefcase, 
  History, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/nextjs';

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function DashboardSidebar({ isOpen, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();

  const menuItems = [
    { name: 'Vue d\'ensemble', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Bots Trading', href: '/dashboard/bots', icon: Bot },
    { name: 'Test Bots', href: '/dashboard/test', icon: Zap },
    { name: 'Performances', href: '/dashboard/analytics', icon: TrendingUp },
    { name: 'Portefeuille', href: '/dashboard/portfolio', icon: Briefcase },
    { name: 'Historique', href: '/dashboard/history', icon: History },
    { name: 'Paramètres', href: '/dashboard/settings', icon: Settings }
  ];

  return (
    <>
      {/* Overlay pour mobile uniquement */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto bg-black/95 backdrop-blur-xl border-r border-gray-800/50 transition-all duration-300 
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
        ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="h-full flex flex-col">
        {/* Header avec Logo et Toggle */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'flex-col justify-center gap-1 px-2' : 'justify-between px-6'} border-b border-gray-800/50`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-[#14b8a6] to-[#10b981] rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-black" />
                </div>
                <span className="font-black text-white text-lg">Warren AI</span>
              </div>
              
              {/* Toggle button en haut à droite */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 text-gray-400 hover:text-white transition-all duration-200 hover:bg-gray-800/50 rounded-lg hover:scale-105"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {/* Logo centré en mode collapsed */}
              <div className="w-8 h-8 bg-gradient-to-r from-[#14b8a6] to-[#10b981] rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-black" />
              </div>
              
              {/* Toggle button en dessous en mode collapsed */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 text-gray-400 hover:text-white transition-all duration-200 hover:bg-gray-800/50 rounded-md hover:scale-105"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </>
          )}
        </div>

        {/* Navigation avec icônes Lucide */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const IconComponent = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'} text-sm font-semibold rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#14b8a6] to-[#10b981] text-black shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:scale-105'
                  }`}
                >
                  <IconComponent className={`${isCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'} transition-all duration-300 ${isActive ? '' : 'group-hover:scale-110'}`} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-800/50 space-y-2">
          {/* User Info */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2`}>
            {!isCollapsed ? (
              <div className="flex items-center gap-3 w-full">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt={user.firstName || 'User'} className="w-8 h-8 rounded-full" />
                  ) : (
                    <User className="w-4 h-4 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.firstName || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt={user.firstName || 'User'} className="w-8 h-8 rounded-full" />
                ) : (
                  <User className="w-5 h-5 text-gray-300" />
                )}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={() => signOut()}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2 text-sm font-semibold rounded-lg transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:scale-105`}
          >
            <LogOut className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'} transition-all duration-300`} />
            {!isCollapsed && <span>Déconnexion</span>}
          </button>

        </div>
      </div>
    </aside>
    </>
  );
}
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
  ChevronRight
} from 'lucide-react';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Bots', href: '/dashboard/bots', icon: Bot },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Portfolio', href: '/dashboard/portfolio', icon: Briefcase },
    { name: 'History', href: '/dashboard/history', icon: History },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings }
  ];

  return (
    <aside className={`bg-background/20 backdrop-blur-xl border-r border-white/10 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="h-full flex flex-col">
        {/* Logo avec dégradé comme la homepage */}
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/20">
                <span className="text-primary-foreground font-bold text-sm">W</span>
              </div>
              <span className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Warren AI</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mx-auto shadow-lg backdrop-blur-sm border border-white/20">
              <span className="text-primary-foreground font-bold text-sm">W</span>
            </div>
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
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg'
                      : 'text-foreground hover:text-primary hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/20'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'} transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Toggle button avec icônes Lucide */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 text-muted-foreground hover:text-primary transition-all duration-300 backdrop-blur-sm hover:bg-white/10 rounded-lg border border-transparent hover:border-white/20 group"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            ) : (
              <ChevronLeft className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
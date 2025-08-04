'use client';

import { useState } from 'react';
import DashboardHeader from './components/DashboardHeader';
import DashboardSidebar from './components/DashboardSidebar';
import { ApiTestContainer } from './components/ApiTestContainer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="flex h-screen">
        <DashboardSidebar 
          isOpen={isSidebarOpen} 
          onToggle={toggleSidebar}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader onSidebarToggle={toggleSidebar} />
          
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      {/* Le conteneur de test est ajouté ici, en dehors du flux principal */}
      <ApiTestContainer />
    </div>
  );
}
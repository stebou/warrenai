'use client';

import { useState } from 'react';// Nous réutilisons le bouton que vous avez déjà
import { Bot, X } from 'lucide-react'; // Icônes pour un meilleur design
import { ApiTestButton } from '@/components/ui/ApiTestButton';
// Assurez-vous que le chemin est correct
export function ApiTestContainer() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-lg transition-transform hover:scale-110"
        aria-label="Ouvrir le panneau de test API"
      >
        <Bot className="h-7 w-7" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[calc(100vw-40px)] max-w-lg rounded-2xl border border-white/20 bg-background/80 p-4 shadow-2xl backdrop-blur-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Panneau de Test API</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          aria-label="Fermer le panneau de test"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-2">
        {/* Le bouton de test est maintenant à l'intérieur de ce panneau */}
        <ApiTestButton />
      </div>
    </div>
  );
}
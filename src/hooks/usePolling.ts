import { useEffect, useRef, useCallback } from 'react';

interface PollingOptions {
  interval: number;
  immediate?: boolean;
  enabled?: boolean;
}

/**
 * Hook pour gérer le polling intelligent avec contrôle de visibilité
 * @param callback Fonction à exécuter
 * @param options Options de polling
 */
export function usePolling(
  callback: () => void | Promise<void>,
  options: PollingOptions
) {
  const { interval, immediate = true, enabled = true } = options;
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Mettre à jour la référence du callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, interval);
  }, [interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }

    // Exécution immédiate si demandée
    if (immediate) {
      callbackRef.current();
    }

    // Démarrer le polling
    startPolling();

    // Gérer la visibilité de l'onglet pour économiser les ressources
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Exécuter immédiatement au retour sur l'onglet
        callbackRef.current();
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, immediate, startPolling, stopPolling]);

  return { startPolling, stopPolling };
}

/**
 * Hook spécialisé pour le polling des bots avec gestion intelligente
 */
export function useBotPolling(fetchFunction: () => Promise<void>) {
  return usePolling(fetchFunction, {
    interval: 45000, // 45 secondes au lieu de 10
    immediate: true,
    enabled: true
  });
}
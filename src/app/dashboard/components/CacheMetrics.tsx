'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  totalEntries: number;
  hitRate: number;
  cacheSize: number;
  timestamp: string;
}

export default function CacheMetrics() {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cache/metrics');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch metrics');
      }
      
      setMetrics(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vider le cache ? Cette action est irréversible.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cache/metrics', {
        method: 'DELETE'
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear cache');
      }
      
      // Rafraîchir les métriques après suppression
      await fetchMetrics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Rafraîchir les métriques toutes les 5 minutes (les cache metrics changent lentement)
    const interval = setInterval(fetchMetrics, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cache Metrics</h3>
        <div className="text-center text-gray-500">Chargement des métriques...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-red-600">Cache Metrics - Erreur</h3>
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={fetchMetrics} disabled={loading}>
          Réessayer
        </Button>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercentage = (num: number) => `${num.toFixed(1)}%`;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Cache Metrics LLM</h3>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMetrics}
            disabled={loading}
          >
            🔄 Actualiser
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={clearCache}
            disabled={loading}
          >
            🗑️ Vider Cache
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(metrics.hits)}
          </div>
          <div className="text-sm text-gray-500">Cache Hits</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {formatNumber(metrics.misses)}
          </div>
          <div className="text-sm text-gray-500">Cache Misses</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatPercentage(metrics.hitRate)}
          </div>
          <div className="text-sm text-gray-500">Hit Rate</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {formatNumber(metrics.totalEntries)}
          </div>
          <div className="text-sm text-gray-500">Entrées</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Sets (écritures):</span>
            <span className="font-medium">{formatNumber(metrics.sets)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Évictions:</span>
            <span className="font-medium">{formatNumber(metrics.evictions)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Taille mémoire:</span>
            <span className="font-medium">{formatNumber(metrics.cacheSize)} entrées</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Dernière MAJ:</span>
            <span className="font-medium">
              {new Date(metrics.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="text-xs text-gray-500">
          💡 Un taux de hit élevé (&gt;70%) indique une bonne utilisation du cache.
          Les évictions fréquentes peuvent indiquer un besoin d&lsquo;augmenter la taille du cache.
        </div>
      </div>
    </Card>
  );
}
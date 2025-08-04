// src/app/api/cache/metrics/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { enhancedCache } from '@/lib/trading/cache/enhanced-cache';

/**
 * GET /api/cache/metrics
 * Récupère les métriques du cache (admin seulement)
 */
export async function GET() {
  try {
    // Vérification d'authentification
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtenir les métriques du cache
    const metrics = enhancedCache.getMetrics();

    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        cacheSize: enhancedCache.size(),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Cache Metrics API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve cache metrics' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cache/metrics
 * Vide le cache (admin seulement)
 */
export async function DELETE() {
  try {
    // Vérification d'authentification
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtenir les métriques avant suppression
    const beforeMetrics = enhancedCache.getMetrics();
    
    // Vider le cache
    enhancedCache.clear();
    
    // Obtenir les métriques après suppression
    const afterMetrics = enhancedCache.getMetrics();

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      data: {
        before: beforeMetrics,
        after: afterMetrics,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Cache Clear API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
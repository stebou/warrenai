#!/usr/bin/env tsx

/**
 * Test pour vérifier que l'API /api/bots/status retourne les bonnes données pour les KPI
 */

import { log } from '../src/lib/logger.js';

async function testKPIData() {
  log.info('🧪 [Test] Testing KPI data from bot status API');

  try {
    const response = await fetch('http://localhost:3001/api/bots/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Vous devrez peut-être ajouter des headers d'auth si nécessaire
      }
    });

    if (!response.ok) {
      log.error('[Test] API call failed', { status: response.status, statusText: response.statusText });
      return;
    }

    const data = await response.json();
    
    if (data.success && data.summary) {
      log.info('✅ [Test] KPI data retrieved successfully:', {
        totalBots: data.summary.totalBots,
        activeBots: data.summary.activeBots,
        totalTrades: data.summary.totalTrades,
        totalProfit: data.summary.totalProfit,
        totalErrors: data.summary.totalErrors,
        winRate: data.summary.winRate,
        totalWinningTrades: data.summary.totalWinningTrades,
        totalLosingTrades: data.summary.totalLosingTrades
      });

      // Calculer les KPI comme dans le composant
      const portfolioValue = 1000 + data.summary.totalProfit;
      const dailyChangePercent = portfolioValue > 0 ? (data.summary.totalProfit / (portfolioValue - data.summary.totalProfit)) * 100 : 0;

      log.info('📊 [Test] Calculated KPI values:', {
        portfolioValue: `$${portfolioValue.toFixed(2)}`,
        dailyChangePercent: `${dailyChangePercent >= 0 ? '+' : ''}${dailyChangePercent.toFixed(1)}%`,
        profitLoss: `${data.summary.totalProfit >= 0 ? '+' : ''}$${data.summary.totalProfit.toFixed(2)}`,
        winRate: `${data.summary.winRate.toFixed(1)}%`,
        winLossRatio: `${data.summary.totalWinningTrades}W/${data.summary.totalLosingTrades}L`,
        avgProfitPerTrade: data.summary.totalTrades > 0 ? (data.summary.totalProfit / data.summary.totalTrades).toFixed(2) : '0.00'
      });

    } else {
      log.error('[Test] Invalid response format', { data });
    }

  } catch (error) {
    log.error('❌ [Test] Test failed:', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Exécuter le test
if (require.main === module) {
  console.log(`
🧪 TEST DES DONNÉES KPI

🎯 OBJECTIF :
- Vérifier que l'API /api/bots/status retourne les bonnes données
- Tester les calculs des KPI comme dans le composant React
- S'assurer que les données réelles apparaîtront dans le dashboard

📊 TEST EN COURS...
`);
  
  testKPIData().catch(console.error);
}

export { testKPIData };
// src/lib/trading/agents/market_analysis/market_agent.ts

/**
 * Agent d'analyse de marché : fournit signaux, tendances, anomalies.
 * Pour l'instant c'est un stub.
 */
export async function analyzeMarket(symbol: string) {
  // Mock : renvoie un signal neutre
  return {
    symbol,
    trend: 'neutral',
    volatility: 0.1,
    timestamp: Date.now(),
  };
}
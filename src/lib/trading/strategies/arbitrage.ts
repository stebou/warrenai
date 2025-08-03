export interface ArbitrageConfig {
  minSpreadBps: number;
}

export function runArbitrage(config: ArbitrageConfig) {
  console.log('[Strategy] Running arbitrage with', config);
}
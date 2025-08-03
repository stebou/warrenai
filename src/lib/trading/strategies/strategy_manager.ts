// File: src/lib/trading/strategies/strategy_manager.ts
export interface StrategyConfig {
  type: string;
  allocation?: number;
  [key: string]: any;
}

export const StrategyManager = {
  register: (name: string, config: StrategyConfig) => {
    // stub : plus tard tu feras de l’orchestration réelle
    console.log(`Registered strategy ${name}`, config);
    return { id: `${name}-${Date.now()}` };
  },
  list: () => {
    return []; // stub
  },
};
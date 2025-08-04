/**
 * Niveaux de risque disponibles pour un bot de trading
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Types de stratégies supportées
 */
export type StrategyType = 'scalping' | 'swing' | 'momentum' | 'arbitrage' | 'grid' | 'dca' | 'mean_reversion' | 'trend_following' | 'market_making';

/**
 * Contraintes de risque étendues avec validation stricte
 */
export interface RiskLimits {
  /** Allocation maximale du portefeuille (0-1, ex: 0.1 = 10%) */
  maxAllocation: number;
  /** Perte maximale par jour en pourcentage (0-1, ex: 0.05 = 5%) */
  maxDailyLoss: number;
  /** Taille maximale d'une position en pourcentage du capital (0-1) */
  maxPositionSize: number;
  /** Stop loss en pourcentage (0-1, ex: 0.02 = 2%) */
  stopLoss: number;
  /** Take profit en pourcentage (0-1, ex: 0.05 = 5%) */
  takeProfit?: number;
  /** Drawdown maximum autorisé (0-1, ex: 0.15 = 15%) */
  maxDrawdown: number;
}

/**
 * Configuration d'allocation de capital
 */
export interface AllocationConfig {
  /** Montant initial en USD */
  initialAmount: number;
  /** Devise de base */
  baseCurrency: 'USD' | 'EUR' | 'BTC' | 'ETH';
  /** Répartition automatique si true */
  autoRebalance: boolean;
  /** Fréquence de rééquilibrage en heures */
  rebalanceFrequency?: number;
}

/**
 * La configuration initiale fournie par l'utilisateur pour créer un bot.
 * Version étendue avec validation stricte et champs obligatoires.
 */
export interface BotCreationConfig {
  /** Nom unique du bot (3-50 caractères) */
  name: string;
  
  /** Description détaillée du bot (10-500 caractères) */
  description: string;
  
  /** Configuration d'allocation de capital */
  initialAllocation: AllocationConfig;
  
  /** Suggestions de stratégies (1-5 suggestions) */
  strategyHints: StrategyType[];
  
  /** Contraintes de risque avec validation stricte */
  riskLimits: RiskLimits;
  
  /** Niveau de risque global (optionnel, calculé automatiquement si absent) */
  riskLevel?: RiskLevel;
  
  /** Paires de trading ciblées (optionnel) */
  targetPairs?: string[];
  
  /** Indicateurs techniques préférés (optionnel) */
  preferredIndicators?: string[];
  
  /** Mode backtesting activé */
  enableBacktest?: boolean;
  
  /** Configuration avancée (optionnel) */
  advancedConfig?: {
    /** Utiliser l'IA pour l'optimisation */
    aiOptimization: boolean;
    /** Fréquence de trading (en minutes) */
    tradingFrequency: number;
    /** Activer les notifications */
    notifications: boolean;
  };
}

/**
 * La spécification complète du bot, générée par le LLM.
 */
export interface BotSpec {
  name: string;
  strategy: string;
  description: string;
  aiConfig: Record<string, any>;
  fromCache?: boolean;
  promptVersion?: string;
}
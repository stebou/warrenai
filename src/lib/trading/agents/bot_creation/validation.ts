// src/lib/trading/agents/bot_creation/validation.ts
import { z } from 'zod';
import type { RiskLevel, StrategyType, RiskLimits, AllocationConfig, BotCreationConfig } from './types';

/**
 * Validation Zod pour les niveaux de risque
 */
export const riskLevelSchema = z.enum(['low', 'medium', 'high']);

/**
 * Validation Zod pour les types de stratégies
 */
export const strategyTypeSchema = z.enum([
  'scalping', 'swing', 'momentum', 'arbitrage', 'grid', 
  'dca', 'mean_reversion', 'trend_following', 'market_making'
]);

/**
 * Validation Zod pour les devises de base
 */
export const baseCurrencySchema = z.enum(['USD', 'EUR', 'BTC', 'ETH']);

/**
 * Validation pour les pourcentages (0-1)
 */
export const percentageSchema = z.number()
  .min(0, 'Le pourcentage doit être >= 0')
  .max(1, 'Le pourcentage doit être <= 1');

/**
 * Validation pour les pourcentages stricts (0-1, excluant 0 et 1)
 */
export const strictPercentageSchema = z.number()
  .gt(0, 'Le pourcentage doit être > 0')
  .lt(1, 'Le pourcentage doit être < 1');

/**
 * Validation pour les contraintes de risque
 */
export const riskLimitsSchema = z.object({
  maxAllocation: strictPercentageSchema
    .max(0.5, 'L\'allocation maximale ne peut pas dépasser 50%')
    .describe('Allocation maximale du portefeuille (0-0.5)'),
    
  maxDailyLoss: strictPercentageSchema
    .max(0.2, 'La perte quotidienne maximale ne peut pas dépasser 20%')
    .describe('Perte maximale par jour (0-0.2)'),
    
  maxPositionSize: strictPercentageSchema
    .max(0.3, 'La taille de position maximale ne peut pas dépasser 30%')
    .describe('Taille maximale d\'une position (0-0.3)'),
    
  stopLoss: z.number()
    .gt(0, 'Le stop loss doit être > 0')
    .lte(0.15, 'Le stop loss ne peut pas dépasser 15%')
    .describe('Stop loss en pourcentage (0-0.15)'),
    
  takeProfit: z.number()
    .gt(0, 'Le take profit doit être > 0')
    .lte(0.5, 'Le take profit ne peut pas dépasser 50%')
    .optional()
    .describe('Take profit en pourcentage (0-0.5, optionnel)'),
    
  maxDrawdown: z.number()
    .gt(0, 'Le drawdown maximal doit être > 0')
    .lte(0.3, 'Le drawdown maximal ne peut pas dépasser 30%')
    .describe('Drawdown maximum autorisé (0-0.3)')
}).refine((data) => {
  // Vérifications de cohérence entre les limites
  if (data.takeProfit && data.takeProfit <= data.stopLoss) {
    return false;
  }
  if (data.maxPositionSize > data.maxAllocation) {
    return false;
  }
  return true;
}, {
  message: 'Incohérence dans les limites de risque: take profit doit être > stop loss, et position size <= allocation'
});

/**
 * Validation pour la configuration d'allocation
 */
export const allocationConfigSchema = z.object({
  initialAmount: z.number()
    .min(100, 'Le montant initial doit être >= 100')
    .max(1000000, 'Le montant initial ne peut pas dépasser 1,000,000')
    .describe('Montant initial en devise de base'),
    
  baseCurrency: baseCurrencySchema
    .describe('Devise de base pour les calculs'),
    
  autoRebalance: z.boolean()
    .describe('Activation du rééquilibrage automatique'),
    
  rebalanceFrequency: z.number()
    .int('La fréquence doit être un nombre entier')
    .min(1, 'La fréquence doit être >= 1 heure')
    .max(168, 'La fréquence ne peut pas dépasser 168 heures (1 semaine)')
    .optional()
    .describe('Fréquence de rééquilibrage en heures')
}).refine((data) => {
  // Si autoRebalance est true, rebalanceFrequency est requis
  if (data.autoRebalance && !data.rebalanceFrequency) {
    return false;
  }
  return true;
}, {
  message: 'La fréquence de rééquilibrage est requise si le rééquilibrage automatique est activé'
});

/**
 * Validation pour les paires de trading
 */
export const tradingPairSchema = z.string()
  .regex(/^[A-Z]{3,10}\/[A-Z]{3,10}$/, 'Format de paire invalide (ex: BTC/USD)')
  .describe('Paire de trading au format ASSET/QUOTE');

/**
 * Validation pour les indicateurs techniques
 */
export const technicalIndicatorSchema = z.enum([
  'SMA', 'EMA', 'RSI', 'MACD', 'BB', 'STOCH', 'ADX', 'CCI', 'ATR', 'VOLUME'
]);

/**
 * Validation pour la configuration avancée
 */
export const advancedConfigSchema = z.object({
  aiOptimization: z.boolean()
    .describe('Activation de l\'optimisation par IA'),
    
  tradingFrequency: z.number()
    .int('La fréquence doit être un nombre entier')
    .min(1, 'La fréquence doit être >= 1 minute')
    .max(1440, 'La fréquence ne peut pas dépasser 1440 minutes (24h)')
    .describe('Fréquence de trading en minutes'),
    
  notifications: z.boolean()
    .describe('Activation des notifications')
});

/**
 * Schéma de validation principal pour BotCreationConfig
 */
export const botCreationConfigSchema = z.object({
  name: z.string()
    .trim()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Le nom ne peut contenir que des lettres, chiffres, espaces, tirets et underscores')
    .describe('Nom unique du bot'),
    
  description: z.string()
    .trim()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .describe('Description détaillée du bot'),
    
  initialAllocation: allocationConfigSchema
    .describe('Configuration d\'allocation de capital'),
    
  strategyHints: z.array(strategyTypeSchema)
    .min(1, 'Au moins une suggestion de stratégie est requise')
    .max(5, 'Maximum 5 suggestions de stratégie')
    .refine((hints) => {
      // Vérifier qu'il n'y a pas de doublons
      return new Set(hints).size === hints.length;
    }, {
      message: 'Les suggestions de stratégie ne peuvent pas contenir de doublons'
    })
    .describe('Suggestions de stratégies de trading'),
    
  riskLimits: riskLimitsSchema
    .describe('Contraintes de risque strictes'),
    
  riskLevel: riskLevelSchema
    .optional()
    .describe('Niveau de risque global (calculé automatiquement si absent)'),
    
  targetPairs: z.array(tradingPairSchema)
    .max(10, 'Maximum 10 paires de trading')
    .optional()
    .describe('Paires de trading ciblées'),
    
  preferredIndicators: z.array(technicalIndicatorSchema)
    .max(8, 'Maximum 8 indicateurs techniques')
    .optional()
    .describe('Indicateurs techniques préférés'),
    
  enableBacktest: z.boolean()
    .optional()
    .default(true)
    .describe('Activation du mode backtesting'),
    
  advancedConfig: advancedConfigSchema
    .optional()
    .describe('Configuration avancée optionnelle')
}).strict() // Rejeter les propriétés non définies
.refine((data) => {
  // Validation croisée: vérifier la cohérence globale
  const { riskLimits, strategyHints } = data;
  
  // Les stratégies à haute fréquence requièrent des limites plus strictes
  const highFreqStrategies = ['scalping', 'arbitrage', 'grid'];
  const hasHighFreqStrategy = strategyHints.some(s => highFreqStrategies.includes(s));
  
  if (hasHighFreqStrategy) {
    if (riskLimits.maxPositionSize > 0.1) {
      return false;
    }
    if (riskLimits.maxDailyLoss > 0.05) {
      return false;
    }
  }
  
  return true;
}, {
  message: 'Les stratégies haute fréquence (scalping, arbitrage, grid) requièrent des limites plus strictes (position <= 10%, perte quotidienne <= 5%)'
});

/**
 * Type inféré du schéma de validation
 */
export type ValidatedBotCreationConfig = z.infer<typeof botCreationConfigSchema>;

/**
 * Fonction utilitaire pour valider et transformer la configuration
 */
export function validateBotCreationConfig(data: unknown): ValidatedBotCreationConfig {
  try {
    return botCreationConfigSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      throw new Error(`Validation échouée: ${JSON.stringify(formattedErrors, null, 2)}`);
    }
    throw error;
  }
}

/**
 * Fonction pour calculer automatiquement le niveau de risque
 */
export function calculateRiskLevel(riskLimits: RiskLimits): RiskLevel {
  const { maxAllocation, maxDailyLoss, maxPositionSize, stopLoss, maxDrawdown } = riskLimits;
  
  // Score de risque basé sur les limites (0-1, plus élevé = plus risqué)
  let riskScore = 0;
  
  // Facteurs de risque pondérés
  riskScore += maxAllocation * 2;     // Allocation impact fort
  riskScore += maxDailyLoss * 3;      // Perte quotidienne impact très fort
  riskScore += maxPositionSize * 1.5; // Taille position impact modéré
  riskScore += stopLoss * 1;          // Stop loss impact faible (plus élevé = moins risqué)
  riskScore += maxDrawdown * 2;       // Drawdown impact fort
  
  // Normaliser le score sur 5 (somme des pondérations)
  riskScore = riskScore / 9.5;
  
  if (riskScore <= 0.3) return 'low';
  if (riskScore <= 0.6) return 'medium';
  return 'high';
}

/**
 * Schéma pour la mise à jour partielle d'un bot
 */
export const botUpdateConfigSchema = botCreationConfigSchema.partial().extend({
  id: z.string().uuid('ID du bot invalide')
});

export type ValidatedBotUpdateConfig = z.infer<typeof botUpdateConfigSchema>;
// src/lib/trading/agents/bot_creation/prompt_builder.ts

/**
 * Configuration utilisateur pour la création d'un bot.
 */
export interface BotCreationConfig {
  name: string;
  description?: string;
  initialAllocation?: number; // en unité monétaire
  strategyHints?: string[]; // suggestions de stratégies
  riskLimits: { max_position_size: number; max_daily_loss: number };
  otherConfig?: Record<string, any>;
}

/**
 * Construit un prompt sécurisé à envoyer à l'IA pour générer une spécification de bot.
 * Effectue une sanitation minimale des champs pour éviter injection.
 */
export function buildBotPrompt(config: BotCreationConfig): string {
  const sanitized: Record<string, any> = {
    name: String(config.name),
    description: config.description ? String(config.description) : undefined,
    initialAllocation:
      typeof config.initialAllocation === 'number'
        ? config.initialAllocation
        : undefined,
    strategyHints: Array.isArray(config.strategyHints)
      ? config.strategyHints.map(String)
      : undefined,
    riskLimits: {
      max_position_size: Number(config.riskLimits.max_position_size),
      max_daily_loss: Number(config.riskLimits.max_daily_loss),
    },
    otherConfig: config.otherConfig || {},
  };

  // Construire le prompt en texte clair en ignorant les undefined
  const parts: string[] = [];
  parts.push('Build a high-performance trading bot with the following configuration:');
  parts.push(`Name: ${sanitized.name}`);
  if (sanitized.description) {
    parts.push(`Description: ${sanitized.description}`);
  }
  if (sanitized.initialAllocation !== undefined) {
    parts.push(`Initial allocation: ${sanitized.initialAllocation}`);
  }
  if (sanitized.strategyHints) {
    parts.push(`Strategy hints: ${sanitized.strategyHints.join(', ')}`);
  }
  parts.push('Risk limits:');
  parts.push(`  - Max position size: ${sanitized.riskLimits.max_position_size}`);
  parts.push(`  - Max daily loss: ${sanitized.riskLimits.max_daily_loss}`);
  if (sanitized.otherConfig && Object.keys(sanitized.otherConfig).length > 0) {
    parts.push('Additional config:');
    parts.push(JSON.stringify(sanitized.otherConfig, null, 2));
  }

  parts.push('Provide strategy recommendations, risk controls, and execution plan optimized for low latency.');

  return parts.join('\n');
}
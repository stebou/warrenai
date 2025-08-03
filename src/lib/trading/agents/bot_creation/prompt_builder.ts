import type { BotCreationConfig } from './types';

/**
 * Construit le prompt textuel à envoyer au LLM pour générer une spécification de bot.
 * @param config La configuration initiale de l'utilisateur.
 * @returns Une chaîne de caractères formatée comme un prompt.
 */
export function buildBotSpecPrompt(config: BotCreationConfig): string {
  const parts: string[] = [
    'You are an expert in quantitative trading strategies. Your task is to generate a detailed trading bot specification in JSON format based on the following user requirements.',
    `The user wants a bot named "${config.name}".`,
  ];

  if (config.description) {
    parts.push(`User-provided description: "${config.description}"`);
  }

  if (config.strategyHints && config.strategyHints.length > 0) {
    parts.push(`The user suggests these strategies or keywords: ${config.strategyHints.join(', ')}.`);
  }

  parts.push('The bot must strictly adhere to the following risk limits:');
  parts.push(`- Maximum position size: ${config.riskLimits.max_position_size * 100}% of total capital per trade.`);
  parts.push(`- Maximum daily loss (stop-loss): ${config.riskLimits.max_daily_loss * 100}% of starting daily capital.`);
  
  parts.push('Based on all the above, provide a JSON object with three keys: "strategy" (a short, descriptive name for the chosen strategy, e.g., "MeanReversion_RSI"), "description" (a 1-2 sentence explanation of how the bot works), and "aiConfig" (a JSON object with specific parameters like entry/exit thresholds, indicators to use, etc.).');
  
  return parts.join('\n');
}
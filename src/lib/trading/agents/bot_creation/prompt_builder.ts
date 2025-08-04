import type { BotCreationConfig } from './types';

/**
 * Construit le prompt textuel enrichi à envoyer au LLM pour générer une spécification de bot.
 * Version étendue prenant en compte tous les nouveaux champs de configuration.
 * @param config La configuration validée de l'utilisateur.
 * @returns Une chaîne de caractères formatée comme un prompt détaillé.
 */
export function buildBotSpecPrompt(config: BotCreationConfig): string {
  const parts: string[] = [
    '# Expert Trading Bot Generator',
    '',
    'You are an expert quantitative trading strategist and bot architect. Generate a comprehensive trading bot specification in JSON format based on the detailed requirements below.',
    '',
    '## Bot Identity',
    `**Name**: "${config.name}"`,
    `**Description**: "${config.description}"`,
    `**Risk Level**: ${config.riskLevel || 'auto-calculated'}`,
    ''
  ];

  // Configuration d'allocation
  parts.push('## Capital Allocation');
  parts.push(`**Initial Capital**: ${config.initialAllocation.initialAmount} ${config.initialAllocation.baseCurrency}`);
  parts.push(`**Base Currency**: ${config.initialAllocation.baseCurrency}`);
  parts.push(`**Auto Rebalancing**: ${config.initialAllocation.autoRebalance ? 'Enabled' : 'Disabled'}`);
  if (config.initialAllocation.autoRebalance && config.initialAllocation.rebalanceFrequency) {
    parts.push(`**Rebalance Frequency**: Every ${config.initialAllocation.rebalanceFrequency} hours`);
  }
  parts.push('');

  // Stratégies suggérées
  parts.push('## Strategy Requirements');
  parts.push(`**Preferred Strategies**: ${config.strategyHints.join(', ')}`);
  parts.push(`**Primary Strategy**: Choose the most suitable from: ${config.strategyHints.join(', ')}`);
  
  if (config.targetPairs && config.targetPairs.length > 0) {
    parts.push(`**Target Trading Pairs**: ${config.targetPairs.join(', ')}`);
  }
  
  if (config.preferredIndicators && config.preferredIndicators.length > 0) {
    parts.push(`**Preferred Technical Indicators**: ${config.preferredIndicators.join(', ')}`);
  }
  parts.push('');

  // Limites de risque détaillées
  parts.push('## Risk Management (STRICT COMPLIANCE REQUIRED)');
  parts.push('The bot must implement these risk controls without exception:');
  parts.push(`- **Maximum Portfolio Allocation**: ${(config.riskLimits.maxAllocation * 100).toFixed(1)}%`);
  parts.push(`- **Maximum Daily Loss**: ${(config.riskLimits.maxDailyLoss * 100).toFixed(1)}%`);
  parts.push(`- **Maximum Position Size**: ${(config.riskLimits.maxPositionSize * 100).toFixed(1)}%`);
  parts.push(`- **Stop Loss**: ${(config.riskLimits.stopLoss * 100).toFixed(1)}%`);
  
  if (config.riskLimits.takeProfit) {
    parts.push(`- **Take Profit**: ${(config.riskLimits.takeProfit * 100).toFixed(1)}%`);
  }
  
  parts.push(`- **Maximum Drawdown**: ${(config.riskLimits.maxDrawdown * 100).toFixed(1)}%`);
  parts.push('');

  // Configuration avancée
  if (config.advancedConfig) {
    parts.push('## Advanced Configuration');
    parts.push(`**AI Optimization**: ${config.advancedConfig.aiOptimization ? 'Enabled' : 'Disabled'}`);
    parts.push(`**Trading Frequency**: Every ${config.advancedConfig.tradingFrequency} minutes`);
    parts.push(`**Notifications**: ${config.advancedConfig.notifications ? 'Enabled' : 'Disabled'}`);
    parts.push('');
  }

  // Backtesting
  if (config.enableBacktest !== false) {
    parts.push('## Testing Requirements');
    parts.push('**Backtesting**: Enable comprehensive backtesting with historical data');
    parts.push('');
  }

  // Instructions de génération JSON
  parts.push('## JSON Output Requirements');
  parts.push('Generate a JSON object with exactly these keys:');
  parts.push('```json');
  parts.push('{');
  parts.push('  "strategy": "string - Descriptive strategy name (e.g., \'BTC_Momentum_Scalping\')",');
  parts.push('  "description": "string - Detailed 2-3 sentence explanation of the bot\'s approach",');
  parts.push('  "aiConfig": {');
  parts.push('    "riskManagement": { /* Risk control parameters */ },');
  parts.push('    "entryConditions": { /* Entry signal logic */ },');
  parts.push('    "exitConditions": { /* Exit signal logic */ },');
  parts.push('    "indicators": [ /* Technical indicators to use */ ],');
  parts.push('    "parameters": { /* Strategy-specific parameters */ },');
  parts.push('    "backtesting": { /* Backtesting configuration */ }');
  parts.push('  }');
  parts.push('}');
  parts.push('```');
  parts.push('');

  // Contraintes de validation croisée
  const highFreqStrategies = ['scalping', 'arbitrage', 'grid'];
  const hasHighFreqStrategy = config.strategyHints.some(s => highFreqStrategies.includes(s));
  
  if (hasHighFreqStrategy) {
    parts.push('## High-Frequency Strategy Constraints');
    parts.push('⚠️ HIGH-FREQUENCY STRATEGY DETECTED: Apply extra-conservative risk limits');
    parts.push('- Use smaller position sizes for rapid trades');
    parts.push('- Implement tighter stop-losses');
    parts.push('- Focus on high-liquidity pairs only');
    parts.push('');
  }

  parts.push('## Final Instructions');
  parts.push('1. Ensure ALL risk limits are implemented in the aiConfig');
  parts.push('2. Choose indicators that align with the preferred strategies');
  parts.push('3. Design entry/exit logic optimized for the specified trading frequency');
  parts.push('4. Include comprehensive error handling and failsafes');
  parts.push('5. Return ONLY the JSON object, no additional text');

  return parts.join('\n');
}
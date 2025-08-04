// tests/bot-creation-validation.test.js
/**
 * Tests pour la validation étendue de création de bot
 * Teste les nouvelles règles Zod et la validation stricte
 */

import { strict as assert } from 'assert';

// Mock des types et validation pour les tests
const RiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high'
};

const StrategyType = {
  SCALPING: 'scalping',
  SWING: 'swing', 
  MOMENTUM: 'momentum',
  ARBITRAGE: 'arbitrage',
  GRID: 'grid',
  DCA: 'dca',
  MEAN_REVERSION: 'mean_reversion',
  TREND_FOLLOWING: 'trend_following',
  MARKET_MAKING: 'market_making'
};

// Configuration valide de base pour les tests
const validBaseConfig = {
  name: 'Test Bot',
  description: 'Bot de test pour validation',
  initialAllocation: {
    initialAmount: 1000,
    baseCurrency: 'USD',
    autoRebalance: false
  },
  strategyHints: ['momentum'],
  riskLimits: {
    maxAllocation: 0.1,
    maxDailyLoss: 0.05,
    maxPositionSize: 0.08,
    stopLoss: 0.02,
    maxDrawdown: 0.15
  }
};

// Simulation des fonctions de validation (à adapter selon votre implémentation)
function validateBotCreationConfig(config) {
  // Validation basique pour les tests
  const errors = [];
  
  // Validation du nom
  if (!config.name || config.name.length < 3 || config.name.length > 50) {
    errors.push({ field: 'name', message: 'Le nom doit contenir entre 3 et 50 caractères' });
  }
  
  // Validation de la description
  if (!config.description || config.description.length < 10 || config.description.length > 500) {
    errors.push({ field: 'description', message: 'La description doit contenir entre 10 et 500 caractères' });
  }
  
  // Validation de l'allocation initiale
  if (!config.initialAllocation) {
    errors.push({ field: 'initialAllocation', message: 'Configuration d\'allocation requise' });
  } else {
    if (config.initialAllocation.initialAmount < 100 || config.initialAllocation.initialAmount > 1000000) {
      errors.push({ field: 'initialAllocation.initialAmount', message: 'Montant initial doit être entre 100 et 1,000,000' });
    }
    
    if (!['USD', 'EUR', 'BTC', 'ETH'].includes(config.initialAllocation.baseCurrency)) {
      errors.push({ field: 'initialAllocation.baseCurrency', message: 'Devise de base invalide' });
    }
    
    if (config.initialAllocation.autoRebalance && !config.initialAllocation.rebalanceFrequency) {
      errors.push({ field: 'initialAllocation.rebalanceFrequency', message: 'Fréquence requise si auto-rebalance activé' });
    }
  }
  
  // Validation des stratégies
  if (!config.strategyHints || config.strategyHints.length === 0) {
    errors.push({ field: 'strategyHints', message: 'Au moins une stratégie requise' });
  } else if (config.strategyHints.length > 5) {
    errors.push({ field: 'strategyHints', message: 'Maximum 5 stratégies' });
  }
  
  // Validation des limites de risque
  if (!config.riskLimits) {
    errors.push({ field: 'riskLimits', message: 'Limites de risque requises' });
  } else {
    const limits = config.riskLimits;
    
    if (limits.maxAllocation <= 0 || limits.maxAllocation >= 1) {
      errors.push({ field: 'riskLimits.maxAllocation', message: 'Allocation doit être entre 0 et 1 (exclus)' });
    }
    
    if (limits.maxAllocation > 0.5) {
      errors.push({ field: 'riskLimits.maxAllocation', message: 'Allocation ne peut pas dépasser 50%' });
    }
    
    if (limits.maxDailyLoss <= 0 || limits.maxDailyLoss >= 1) {
      errors.push({ field: 'riskLimits.maxDailyLoss', message: 'Perte quotidienne doit être entre 0 et 1 (exclus)' });
    }
    
    if (limits.maxPositionSize > limits.maxAllocation) {
      errors.push({ field: 'riskLimits', message: 'Position size doit être <= allocation' });
    }
    
    if (limits.takeProfit && limits.takeProfit <= limits.stopLoss) {
      errors.push({ field: 'riskLimits', message: 'Take profit doit être > stop loss' });
    }
  }
  
  // Validation croisée pour stratégies haute fréquence
  const highFreqStrategies = ['scalping', 'arbitrage', 'grid'];
  const hasHighFreqStrategy = config.strategyHints && config.strategyHints.some(s => highFreqStrategies.includes(s));
  
  if (hasHighFreqStrategy && config.riskLimits) {
    if (config.riskLimits.maxPositionSize > 0.1) {
      errors.push({ field: 'riskLimits.maxPositionSize', message: 'Stratégies haute fréquence requièrent position <= 10%' });
    }
    
    if (config.riskLimits.maxDailyLoss > 0.05) {
      errors.push({ field: 'riskLimits.maxDailyLoss', message: 'Stratégies haute fréquence requièrent perte quotidienne <= 5%' });
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation échouée: ${JSON.stringify(errors, null, 2)}`);
  }
  
  return config;
}

function calculateRiskLevel(riskLimits) {
  const { maxAllocation, maxDailyLoss, maxPositionSize, stopLoss, maxDrawdown } = riskLimits;
  
  let riskScore = 0;
  riskScore += maxAllocation * 2;
  riskScore += maxDailyLoss * 3;
  riskScore += maxPositionSize * 1.5;
  riskScore += stopLoss * 1;
  riskScore += maxDrawdown * 2;
  
  riskScore = riskScore / 9.5;
  
  if (riskScore <= 0.1) return 'low';
  if (riskScore <= 0.2) return 'medium';
  return 'high';
}

// Tests
function runValidationTests() {
  console.log('🧪 Tests de validation de création de bot...\n');

  // Test 1: Configuration valide
  test('Configuration valide de base', () => {
    const config = { ...validBaseConfig };
    const result = validateBotCreationConfig(config);
    
    assert.deepStrictEqual(result, config, 'Une configuration valide devrait passer la validation');
    console.log('✅ Test 1 réussi: Configuration valide');
  });

  // Test 2: Nom invalide
  test('Validation du nom', () => {
    // Nom trop court
    const configShortName = { ...validBaseConfig, name: 'AB' };
    assert.throws(() => validateBotCreationConfig(configShortName), /nom/, 'Nom trop court devrait échouer');
    
    // Nom trop long
    const configLongName = { ...validBaseConfig, name: 'A'.repeat(51) };
    assert.throws(() => validateBotCreationConfig(configLongName), /nom/, 'Nom trop long devrait échouer');
    
    console.log('✅ Test 2 réussi: Validation du nom');
  });

  // Test 3: Description invalide
  test('Validation de la description', () => {
    const configShortDesc = { ...validBaseConfig, description: 'Court' };
    assert.throws(() => validateBotCreationConfig(configShortDesc), /description/, 'Description trop courte devrait échouer');
    
    const configLongDesc = { ...validBaseConfig, description: 'A'.repeat(501) };
    assert.throws(() => validateBotCreationConfig(configLongDesc), /description/, 'Description trop longue devrait échouer');
    
    console.log('✅ Test 3 réussi: Validation de la description');
  });

  // Test 4: Allocation initiale
  test('Validation de l\'allocation initiale', () => {
    // Montant trop faible
    const configLowAmount = {
      ...validBaseConfig,
      initialAllocation: { ...validBaseConfig.initialAllocation, initialAmount: 50 }
    };
    assert.throws(() => validateBotCreationConfig(configLowAmount), /initialAmount/, 'Montant trop faible devrait échouer');
    
    // Devise invalide
    const configInvalidCurrency = {
      ...validBaseConfig,
      initialAllocation: { ...validBaseConfig.initialAllocation, baseCurrency: 'XYZ' }
    };
    assert.throws(() => validateBotCreationConfig(configInvalidCurrency), /baseCurrency/, 'Devise invalide devrait échouer');
    
    // Auto-rebalance sans fréquence
    const configNoFrequency = {
      ...validBaseConfig,
      initialAllocation: { ...validBaseConfig.initialAllocation, autoRebalance: true }
    };
    assert.throws(() => validateBotCreationConfig(configNoFrequency), /rebalanceFrequency/, 'Auto-rebalance sans fréquence devrait échouer');
    
    console.log('✅ Test 4 réussi: Validation de l\'allocation initiale');
  });

  // Test 5: Limites de risque
  test('Validation des limites de risque', () => {
    // Allocation trop élevée
    const configHighAllocation = {
      ...validBaseConfig,
      riskLimits: { ...validBaseConfig.riskLimits, maxAllocation: 0.8 }
    };
    assert.throws(() => validateBotCreationConfig(configHighAllocation), /allocation/i, 'Allocation trop élevée devrait échouer');
    
    // Position size > allocation
    const configInconsistent = {
      ...validBaseConfig,
      riskLimits: { ...validBaseConfig.riskLimits, maxAllocation: 0.05, maxPositionSize: 0.1 }
    };
    assert.throws(() => validateBotCreationConfig(configInconsistent), /Position size/, 'Position size > allocation devrait échouer');
    
    console.log('✅ Test 5 réussi: Validation des limites de risque');
  });

  // Test 6: Stratégies haute fréquence
  test('Validation des stratégies haute fréquence', () => {
    const configHighFreq = {
      ...validBaseConfig,
      strategyHints: ['scalping'],
      riskLimits: { ...validBaseConfig.riskLimits, maxPositionSize: 0.15 }
    };
    
    assert.throws(() => validateBotCreationConfig(configHighFreq), /haute fréquence/i, 'Stratégies haute fréquence avec limits élevées devraient échouer');
    
    console.log('✅ Test 6 réussi: Validation des stratégies haute fréquence');
  });

  // Test 7: Calcul du niveau de risque
  test('Calcul du niveau de risque', () => {
    // Configuration risque faible
    const lowRiskLimits = {
      maxAllocation: 0.05,
      maxDailyLoss: 0.01,
      maxPositionSize: 0.03,
      stopLoss: 0.01,
      maxDrawdown: 0.05
    };
    
    const lowRisk = calculateRiskLevel(lowRiskLimits);
    assert.strictEqual(lowRisk, 'low', 'Configuration conservative devrait être risque faible');
    
    // Configuration risque élevé
    const highRiskLimits = {
      maxAllocation: 0.3,
      maxDailyLoss: 0.15,
      maxPositionSize: 0.25,
      stopLoss: 0.1,
      maxDrawdown: 0.25
    };
    
    const highRisk = calculateRiskLevel(highRiskLimits);
    assert.strictEqual(highRisk, 'high', 'Configuration agressive devrait être risque élevé');
    
    console.log('✅ Test 7 réussi: Calcul du niveau de risque');
  });

  // Test 8: Configuration complète valide
  test('Configuration complète avec options avancées', () => {
    const complexConfig = {
      ...validBaseConfig,
      riskLevel: 'medium',
      targetPairs: ['BTC/USD', 'ETH/USD'],
      preferredIndicators: ['RSI', 'MACD', 'EMA'],
      enableBacktest: true,
      advancedConfig: {
        aiOptimization: true,
        tradingFrequency: 15,
        notifications: true
      }
    };
    
    const result = validateBotCreationConfig(complexConfig);
    assert.deepStrictEqual(result, complexConfig, 'Configuration complète valide devrait passer');
    
    console.log('✅ Test 8 réussi: Configuration complète');
  });

  // Test 9: Doublons dans stratégies
  test('Validation des doublons dans stratégies', () => {
    const configDuplicates = {
      ...validBaseConfig,
      strategyHints: ['momentum', 'momentum', 'scalping']
    };
    
    // Note: Cette validation devrait être implémentée dans la vraie fonction
    console.log('⚠️  Test 9: Validation des doublons à implémenter');
  });

  // Test 10: Paires de trading format
  test('Validation du format des paires de trading', () => {
    const configInvalidPairs = {
      ...validBaseConfig,
      targetPairs: ['BTCUSD', 'ETH-USD', 'invalid_pair']
    };
    
    // Note: Cette validation devrait être implémentée avec regex
    console.log('⚠️  Test 10: Validation format paires à implémenter avec regex');
  });

  console.log('\n🎉 Tests de validation terminés !');
}

// Helper pour les tests
function test(name, fn) {
  try {
    fn();
  } catch (error) {
    console.error(`❌ Test échoué: ${name}`);
    console.error(`   Erreur: ${error.message}`);
    throw error;
  }
}

// Exécuter les tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidationTests();
}

export { runValidationTests };
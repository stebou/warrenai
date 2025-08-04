'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bot, 
  Zap, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Settings, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Activity,
  Building2,
  Globe
} from 'lucide-react';
import ExchangeSelector, { type ExchangeOption } from '@/components/bot/ExchangeSelector';
import BinanceConnectionModal from '@/components/bot/BinanceConnectionModal';
import CryptoPairPicker, { type CryptoPair } from '@/components/bot/CryptoPairPicker';
import BinanceLogo from '@/components/icons/BinanceLogo';

interface EnhancedCreateBotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBotCreated?: () => void;
}

export default function EnhancedCreateBotModal({ open, onOpenChange, onBotCreated }: EnhancedCreateBotModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedExchange, setSelectedExchange] = useState<ExchangeOption | null>(null);
  const [selectedPair, setSelectedPair] = useState<CryptoPair | null>(null);
  const [showBinanceModal, setShowBinanceModal] = useState(false);
  const [binanceCredentials, setBinanceCredentials] = useState<{ apiKey: string; apiSecret: string; isTestnet: boolean } | null>(null);
  const [existingCredentials, setExistingCredentials] = useState<any>(null);
  const [isCheckingCredentials, setIsCheckingCredentials] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Vérifier les credentials existants
  const checkExistingCredentials = async () => {
    setIsCheckingCredentials(true);
    try {
      const response = await fetch('/api/exchange/credentials');
      if (response.ok) {
        const data = await response.json();
        const binanceTestnetCreds = data.credentials?.find(
          (cred: any) => cred.exchange === 'BINANCE' && cred.isTestnet === true
        );
        if (binanceTestnetCreds) {
          setExistingCredentials(binanceTestnetCreds);
          setBinanceCredentials({
            apiKey: 'existing',
            apiSecret: 'existing', 
            isTestnet: true
          });
          console.log('✅ Credentials Binance testnet déjà disponibles');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des credentials:', error);
    } finally {
      setIsCheckingCredentials(false);
    }
  };

  // Effect pour vérifier les credentials au chargement
  useEffect(() => {
    if (open) {
      checkExistingCredentials();
    }
  }, [open]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    strategy: '',
    initialAmount: 1000,
    riskLevel: 'medium',
    tradingFrequency: 1,
    targetPairs: ['BTC/USDT'],
    maxAllocation: 10,
    stopLoss: 2,
    takeProfit: 6,
    exchangeType: 'binance',
    cryptoPair: ''
  });

  const steps = [
    { id: 0, title: 'Template', icon: Sparkles },
    { id: 1, title: 'Exchange', icon: Building2 },
    { id: 2, title: 'Cryptomonnaie', icon: Globe },
    { id: 3, title: 'Configuration', icon: Settings },
    { id: 4, title: 'Risques', icon: Shield },
    { id: 5, title: 'Validation', icon: Check }
  ];

  const templates = [
    {
      id: 'scalping',
      name: 'Scalping Pro',
      description: 'Stratégie haute fréquence pour petits profits rapides',
      icon: '⚡',
      color: 'from-yellow-400 to-orange-500',
      stats: { winRate: '92%', avgTrades: '150/jour', risk: 'Moyen' },
      config: {
        strategy: 'scalping',
        tradingFrequency: 1,
        maxAllocation: 5,
        stopLoss: 1,
        takeProfit: 2
      }
    },
    {
      id: 'momentum',
      name: 'Momentum Master',
      description: 'Suit les tendances fortes du marché',
      icon: '🚀',
      color: 'from-green-400 to-blue-500',
      stats: { winRate: '85%', avgTrades: '25/jour', risk: 'Élevé' },
      config: {
        strategy: 'momentum',
        tradingFrequency: 5,
        maxAllocation: 15,
        stopLoss: 3,
        takeProfit: 8
      }
    },
    {
      id: 'dca',
      name: 'DCA Stable',
      description: 'Achat régulier pour lisser les prix',
      icon: '💎',
      color: 'from-blue-400 to-purple-500',
      stats: { winRate: '78%', avgTrades: '8/jour', risk: 'Faible' },
      config: {
        strategy: 'dca',
        tradingFrequency: 30,
        maxAllocation: 20,
        stopLoss: 5,
        takeProfit: 10
      }
    },
    {
      id: 'custom',
      name: 'Personnalisé',
      description: 'Créer votre propre stratégie',
      icon: '🛠️',
      color: 'from-purple-400 to-pink-500',
      stats: { winRate: '?', avgTrades: 'Variable', risk: 'Variable' },
      config: {
        strategy: 'custom',
        tradingFrequency: 10,
        maxAllocation: 10,
        stopLoss: 2,
        takeProfit: 5
      }
    }
  ];

  const riskLevels = [
    { 
      id: 'low', 
      name: 'Conservateur', 
      description: 'Risque faible, rendement stable',
      color: 'text-green-400 border-green-400/30 bg-green-400/10',
      maxAllocation: 5,
      stopLoss: 1,
      takeProfit: 3
    },
    { 
      id: 'medium', 
      name: 'Équilibré', 
      description: 'Bon compromis risque/rendement',
      color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
      maxAllocation: 10,
      stopLoss: 2,
      takeProfit: 6
    },
    { 
      id: 'high', 
      name: 'Agressif', 
      description: 'Risque élevé, potentiel maximum',
      color: 'text-red-400 border-red-400/30 bg-red-400/10',
      maxAllocation: 20,
      stopLoss: 5,
      takeProfit: 12
    }
  ];

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template.id);
    setFormData({
      ...formData,
      ...template.config,
      name: template.name
    });
  };

  const handleRiskLevelSelect = (riskLevel: any) => {
    setFormData({
      ...formData,
      riskLevel: riskLevel.id,
      maxAllocation: riskLevel.maxAllocation,
      stopLoss: riskLevel.stopLoss,
      takeProfit: riskLevel.takeProfit
    });
  };

  const handleExchangeSelect = (exchange: ExchangeOption) => {
    console.log('Exchange selected:', exchange.name, 'requiresAuth:', exchange.requiresAuth);
    setSelectedExchange(exchange);
    setFormData({
      ...formData,
      exchangeType: exchange.type
    });

    // Si Binance est sélectionné et nécessite une authentification
    if (exchange.requiresAuth && (exchange.type === 'binance' || exchange.type === 'binance_futures')) {
      // Vérifier si on a déjà des credentials
      if (!existingCredentials && !binanceCredentials) {
        console.log('No existing credentials, opening Binance modal for', exchange.name);
        setShowBinanceModal(true);
      } else {
        console.log('✅ Using existing Binance credentials');
      }
    }
    // Ne pas appeler nextStep() automatiquement - laisser l'utilisateur cliquer sur "Continuer"
  };

  const handleBinanceConnection = (credentials: { apiKey: string; apiSecret: string; isTestnet: boolean }) => {
    setBinanceCredentials(credentials);
    setShowBinanceModal(false);
    nextStep();
  };

  const handleExchangeContinue = () => {
    console.log('Exchange continue clicked. Selected exchange:', selectedExchange?.name, 'has credentials:', !!binanceCredentials, 'existing:', !!existingCredentials);
    if (selectedExchange?.requiresAuth && (selectedExchange.type === 'binance' || selectedExchange.type === 'binance_futures')) {
      if (!binanceCredentials && !existingCredentials) {
        console.log('No Binance credentials found, opening modal');
        setShowBinanceModal(true);
        return;
      }
    }
    console.log('Proceeding to next step');
    nextStep();
  };

  const handlePairSelect = (pair: CryptoPair) => {
    setSelectedPair(pair);
    setFormData({
      ...formData,
      cryptoPair: pair.symbol,
      targetPairs: [pair.symbol]
    });
  };

  // Validation côté client
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validation nom
    if (!formData.name || formData.name.length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Le nom ne peut pas dépasser 50 caractères';
    }

    // Validation description
    const description = formData.description || `Bot ${formData.strategy} avec gestion des risques ${formData.riskLevel}`;
    if (description.length < 10) {
      newErrors.description = 'La description doit contenir au moins 10 caractères';
    } else if (description.length > 500) {
      newErrors.description = 'La description ne peut pas dépasser 500 caractères';
    }

    // Validation stratégie
    if (!formData.strategy) {
      newErrors.strategy = 'Sélectionnez une stratégie';
    }

    // Validation allocation initiale
    if (formData.initialAmount < 100) {
      newErrors.initialAmount = 'Le montant minimum est de 100';
    } else if (formData.initialAmount > 1000000) {
      newErrors.initialAmount = 'Le montant maximum est de 1,000,000';
    }

    // Validation limites de risque
    if (formData.maxAllocation > 50) {
      newErrors.maxAllocation = 'L\'allocation ne peut pas dépasser 50%';
    }
    
    if (formData.takeProfit && formData.takeProfit <= formData.stopLoss) {
      newErrors.takeProfit = 'Le take profit doit être supérieur au stop loss';
    }

    // Validation paires de trading
    if (formData.targetPairs.length === 0) {
      newErrors.targetPairs = 'Sélectionnez au moins une paire de trading';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Validation côté client
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      console.log('Sending bot creation request:', formData);
      
      // Format des données selon le schéma Prisma validé
      const botData = {
        name: formData.name,
        description: formData.description || `Bot ${formData.strategy} avec gestion des risques ${formData.riskLevel}`,
        initialAllocation: {
          initialAmount: formData.initialAmount,
          baseCurrency: 'USDT',
          autoRebalance: false,
          rebalanceFrequency: 24
        },
        strategyHints: [formData.strategy],
        riskLimits: {
          maxAllocation: formData.maxAllocation / 100,
          maxDailyLoss: 0.05,
          maxPositionSize: formData.maxAllocation / 100,
          stopLoss: formData.stopLoss / 100,
          takeProfit: formData.takeProfit / 100,
          maxDrawdown: 0.15
        },
        targetPairs: formData.targetPairs,
        preferredIndicators: ['RSI', 'MACD', 'EMA'],
        enableBacktest: true,
        advancedConfig: {
          aiOptimization: true,
          tradingFrequency: formData.tradingFrequency,
          notifications: true
        }
      };
      
      const response = await fetch('/api/bots/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: inclure les cookies d'auth
        body: JSON.stringify(botData),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const error = await response.json();
        
        // Gestion des erreurs de validation du serveur
        if (error.details && Array.isArray(error.details)) {
          const serverErrors: Record<string, string> = {};
          error.details.forEach((detail: any) => {
            if (detail.field) {
              serverErrors[detail.field] = detail.message;
            }
          });
          setErrors(serverErrors);
        } else {
          setErrors({ general: error.details || error.error || 'Erreur lors de la création du bot' });
        }
        return;
      }

      const result = await response.json();
      console.log('Bot créé avec succès:', result);
      
      // Déclencher le refresh de la liste des bots AVANT de fermer la modal
      if (onBotCreated) {
        console.log('Rafraîchissement de la liste des bots...');
        onBotCreated();
      }
      
      // Petit délai pour s'assurer que le rafraîchissement se termine
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Reset form and close modal
      setCurrentStep(0);
      setSelectedTemplate(null);
      setSelectedExchange(null);
      setSelectedPair(null);
      setBinanceCredentials(null);
      setFormData({
        name: '',
        description: '',
        strategy: '',
        initialAmount: 1000,
        riskLevel: 'medium',
        tradingFrequency: 1,
        targetPairs: ['BTC/USDT'],
        maxAllocation: 10,
        stopLoss: 2,
        takeProfit: 6,
        exchangeType: 'binance',
        cryptoPair: ''
      });
      
      onOpenChange(false);
      
    } catch (error) {
      console.error('Erreur lors de la création du bot:', error);
      setErrors({ general: 'Erreur de connexion. Veuillez réessayer.' });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedTemplate !== null;
      case 1: 
        // Pour l'étape Exchange, vérifier aussi que les credentials Binance sont présents si nécessaire
        if (!selectedExchange) return false;
        if (selectedExchange.requiresAuth && (selectedExchange.type === 'binance' || selectedExchange.type === 'binance_futures')) {
          return binanceCredentials !== null || existingCredentials !== null; // Credentials nouveaux OU existants
        }
        return true;
      case 2: return selectedPair !== null;
      case 3: return formData.name.trim().length >= 3;
      case 4: return formData.riskLevel !== '';
      case 5: return formData.name.trim().length >= 3 && formData.strategy && formData.targetPairs.length > 0;
      default: return true;
    }
  };

  if (!open) return null;

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900/95 border border-gray-700/50 rounded-2xl w-full max-w-4xl max-h-[90vh] backdrop-blur-xl relative z-[10000] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-[#14b8a6] to-[#10b981] rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Créer un Nouveau Bot</h2>
                <p className="text-gray-400">Assistant de création guidée</p>
              </div>
            </div>
            
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isActive = currentStep === index;
              const isCompleted = currentStep > index;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#14b8a6]/20 text-[#14b8a6] border border-[#14b8a6]/30' 
                      : isCompleted
                        ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                        : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                    <span className="font-semibold">{step.title}</span>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-600 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0">
          {/* Erreur générale */}
          {errors.general && (
            <div className="mb-6 p-3 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl">
              <p className="text-red-300 text-sm font-medium">{errors.general}</p>
            </div>
          )}
          
          <AnimatePresence mode="wait">
            {/* Step 0: Template Selection */}
            {currentStep === 0 && (
              <motion.div
                key="template"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">Choisissez un Template</h3>
                  <p className="text-gray-400">Sélectionnez une stratégie prédéfinie ou créez la vôtre</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <motion.div
                      key={template.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTemplateSelect(template)}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedTemplate === template.id
                          ? 'border-[#14b8a6]/50 bg-[#14b8a6]/10'
                          : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${template.color} flex items-center justify-center text-2xl`}>
                          {template.icon}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">{template.name}</h4>
                          <p className="text-sm text-gray-400">{template.description}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-xs text-gray-500">Taux de réussite</p>
                          <p className="font-bold text-[#10b981]">{template.stats.winRate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Trades</p>
                          <p className="font-bold text-white">{template.stats.avgTrades}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Risque</p>
                          <p className={`font-bold ${
                            template.stats.risk === 'Faible' ? 'text-green-400' :
                            template.stats.risk === 'Moyen' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {template.stats.risk}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Exchange Selection */}
            {currentStep === 1 && (
              <motion.div
                key="exchange"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <ExchangeSelector
                  selectedExchange={selectedExchange?.id || null}
                  onExchangeSelect={handleExchangeSelect}
                  onContinue={handleExchangeContinue}
                  disabled={isLoading}
                />
              </motion.div>
            )}

            {/* Step 2: Cryptocurrency Selection */}
            {currentStep === 2 && (
              <motion.div
                key="crypto"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <CryptoPairPicker
                  selectedPair={selectedPair?.symbol || null}
                  onPairSelect={handlePairSelect}
                  onContinue={() => nextStep()}
                  exchangeType={selectedExchange?.type}
                  disabled={isLoading}
                />
              </motion.div>
            )}

            {/* Step 3: Configuration */}
            {currentStep === 3 && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">Configuration du Bot</h3>
                  <p className="text-gray-400">Personnalisez les paramètres de votre bot</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Nom du bot</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-3 py-2 bg-gray-800/50 border rounded-lg text-white focus:border-[#14b8a6]/50 focus:outline-none ${
                          errors.name ? 'border-red-500' : 'border-gray-700/50'
                        }`}
                        placeholder="Mon Bot Trading"
                        required
                        minLength={3}
                        maxLength={50}
                      />
                      {errors.name && <p className="text-red-300 text-xs font-medium mt-1">{errors.name}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Budget initial (€)</label>
                      <input
                        type="number"
                        value={formData.initialAmount}
                        onChange={(e) => setFormData({ ...formData, initialAmount: Number(e.target.value) })}
                        className={`w-full px-3 py-2 bg-gray-800/50 border rounded-lg text-white focus:border-[#14b8a6]/50 focus:outline-none ${
                          errors.initialAmount ? 'border-red-500' : 'border-gray-700/50'
                        }`}
                        min="100"
                        max="1000000"
                        step="100"
                      />
                      {errors.initialAmount && <p className="text-red-300 text-xs font-medium mt-1">{errors.initialAmount}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Fréquence de trading (minutes)</label>
                      <select
                        value={formData.tradingFrequency}
                        onChange={(e) => setFormData({ ...formData, tradingFrequency: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:border-[#14b8a6]/50 focus:outline-none"
                      >
                        <option value={1}>1 minute (très actif)</option>
                        <option value={5}>5 minutes (actif)</option>
                        <option value={15}>15 minutes (modéré)</option>
                        <option value={30}>30 minutes (patient)</option>
                        <option value={60}>1 heure (très patient)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Paires de trading</label>
                      <div className="space-y-2">
                        {['BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'SOL/USDT'].map((pair) => (
                          <label key={pair} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.targetPairs.includes(pair)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, targetPairs: [...formData.targetPairs, pair] });
                                } else {
                                  setFormData({ ...formData, targetPairs: formData.targetPairs.filter(p => p !== pair) });
                                }
                              }}
                              className="rounded border-gray-600 bg-gray-800 text-[#14b8a6]"
                            />
                            <span className="text-white">{pair}</span>
                          </label>
                        ))}
                      </div>
                      {errors.targetPairs && <p className="text-red-300 text-xs font-medium mt-1">{errors.targetPairs}</p>}
                    </div>

                    <div className="bg-gray-800/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Aperçu de la Configuration</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Stratégie:</span>
                          <span className="text-white">{formData.strategy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Budget:</span>
                          <span className="text-white">€{formData.initialAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Fréquence:</span>
                          <span className="text-white">{formData.tradingFrequency}min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Risk Management */}
            {currentStep === 4 && (
              <motion.div
                key="risk"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">Gestion des Risques</h3>
                  <p className="text-gray-400">Définissez votre profil de risque</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {riskLevels.map((risk) => (
                    <motion.div
                      key={risk.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRiskLevelSelect(risk)}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        formData.riskLevel === risk.id
                          ? `${risk.color}`
                          : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50'
                      }`}
                    >
                      <div className="text-center">
                        <h4 className="text-lg font-bold text-white mb-2">{risk.name}</h4>
                        <p className="text-sm text-gray-400 mb-4">{risk.description}</p>
                        
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span>Max allocation:</span>
                            <span className="font-bold">{risk.maxAllocation}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Stop loss:</span>
                            <span className="font-bold">{risk.stopLoss}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Take profit:</span>
                            <span className="font-bold">{risk.takeProfit}%</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-gray-800/30 rounded-lg p-6">
                  <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Paramètres de Sécurité
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Allocation maximale par trade (%)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={formData.maxAllocation}
                        onChange={(e) => setFormData({ ...formData, maxAllocation: Number(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>1%</span>
                        <span className="font-bold text-white">{formData.maxAllocation}%</span>
                        <span>50%</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Stop Loss automatique (%)
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={formData.stopLoss}
                        onChange={(e) => setFormData({ ...formData, stopLoss: Number(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0.5%</span>
                        <span className="font-bold text-red-400">{formData.stopLoss}%</span>
                        <span>10%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Validation */}
            {currentStep === 5 && (
              <motion.div
                key="validation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">Récapitulatif</h3>
                  <p className="text-gray-400">Vérifiez les paramètres avant création</p>
                </div>

                <div className="bg-gray-800/30 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#14b8a6] to-[#10b981] rounded-xl flex items-center justify-center">
                      <Bot className="w-8 h-8 text-black" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">{formData.name || 'Nom non défini'}</h4>
                      <p className="text-gray-400">Stratégie {formData.strategy || 'Non sélectionnée'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700/50">
                    <div className="text-center">
                      <DollarSign className="w-8 h-8 text-[#14b8a6] mx-auto mb-2" />
                      <p className="text-lg font-bold text-white">€{formData.initialAmount}</p>
                      <p className="text-xs text-gray-400">Budget initial</p>
                    </div>
                    
                    <div className="text-center">
                      <Activity className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-lg font-bold text-white">{formData.tradingFrequency}min</p>
                      <p className="text-xs text-gray-400">Fréquence</p>
                    </div>
                    
                    <div className="text-center">
                      <Target className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                      <p className="text-lg font-bold text-white">{formData.maxAllocation}%</p>
                      <p className="text-xs text-gray-400">Max allocation</p>
                    </div>
                    
                    <div className="text-center">
                      <Shield className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <p className="text-lg font-bold text-white">{formData.stopLoss}%</p>
                      <p className="text-xs text-gray-400">Stop Loss</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700/50 space-y-4">
                    <div>
                      <h5 className="font-semibold text-white mb-2">Exchange sélectionné:</h5>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          {selectedExchange?.icon || <Building2 className="w-4 h-4 text-white" />}
                        </div>
                        <div>
                          <p className="text-white font-medium">{selectedExchange?.name || 'Non sélectionné'}</p>
                          <p className="text-xs text-gray-400">{selectedExchange?.environment}</p>
                        </div>
                        {selectedExchange?.requiresAuth && binanceCredentials && (
                          <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                            ✓ Connecté
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-white mb-2">Cryptomonnaie sélectionnée:</h5>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {selectedPair?.baseAsset?.charAt(0) || 'N'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{selectedPair?.symbol || 'Non sélectionnée'}</p>
                          <p className="text-xs text-gray-400">
                            {selectedPair ? `Prix: $${selectedPair.price.toLocaleString()}` : 'Aucune paire sélectionnée'}
                          </p>
                        </div>
                        {selectedPair && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            selectedPair.change24h >= 0 
                              ? 'text-green-400 bg-green-400/10' 
                              : 'text-red-400 bg-red-400/10'
                          }`}>
                            {selectedPair.change24h >= 0 ? '+' : ''}{selectedPair.change24h.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700/50">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-semibold">Avertissement</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      Le trading automatique comporte des risques. Ne tradez que des montants que vous pouvez vous permettre de perdre.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t border-gray-700/50 flex items-center justify-between bg-gray-900/95">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-gray-800/50 text-gray-400 border border-gray-700/50 rounded-lg hover:bg-gray-700/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </motion.button>

          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  currentStep >= index ? 'bg-[#14b8a6]' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <div className="flex flex-col items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-6 py-2 bg-gradient-to-r from-[#14b8a6] to-[#10b981] text-white font-semibold rounded-lg hover:from-[#0f9e90] hover:to-[#0d9f73] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </motion.button>
              
              {/* Message d'aide pour l'étape Exchange */}
              {currentStep === 1 && selectedExchange?.requiresAuth && !binanceCredentials && !existingCredentials && (
                <div className="text-xs text-yellow-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Connectez votre compte Binance pour continuer</span>
                </div>
              )}
              
              {/* Message de confirmation des credentials existants */}
              {currentStep === 1 && selectedExchange?.requiresAuth && (binanceCredentials || existingCredentials) && (
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Credentials Binance configurés ✓</span>
                </div>
              )}
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={isLoading || !canProceed()}
              className="px-6 py-2 bg-gradient-to-r from-[#14b8a6] to-[#10b981] text-white font-semibold rounded-lg hover:from-[#0f9e90] hover:to-[#0d9f73] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Créer le Bot
                </>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  // Utiliser createPortal pour rendre la modal au niveau du body pour éviter les problèmes de z-index
  return typeof window !== 'undefined' 
    ? createPortal(
        <>
          {modalContent}
          <BinanceConnectionModal
            isOpen={showBinanceModal}
            onClose={() => {
              console.log('Binance modal closed');
              setShowBinanceModal(false);
            }}
            onSuccess={handleBinanceConnection}
            isTestnet={selectedExchange?.environment === 'testnet'}
          />
        </>,
        document.body
      ) 
    : null;
}
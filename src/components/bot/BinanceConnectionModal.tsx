'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ExternalLink, 
  Key, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Building2
} from 'lucide-react';

interface BinanceConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (credentials: { apiKey: string; apiSecret: string; isTestnet: boolean }) => void;
  isTestnet?: boolean;
}

type Step = 'intro' | 'guide' | 'form' | 'testing' | 'success';

export default function BinanceConnectionModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  isTestnet = true 
}: BinanceConnectionModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log('BinanceConnectionModal opened, isTestnet:', isTestnet);
      setCurrentStep('intro');
      setApiKey('');
      setApiSecret('');
      setShowSecret(false);
      setError(null);
    } else {
      console.log('BinanceConnectionModal closed');
    }
  }, [isOpen]);

  const binanceUrl = isTestnet 
    ? 'https://testnet.binance.vision'
    : 'https://www.binance.com/en/my/settings/api-management';

  const handleOpenBinance = () => {
    window.open(binanceUrl, '_blank');
    setCurrentStep('form');
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Sauvegarder les credentials via notre API
      const response = await fetch('/api/exchange/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exchange: 'BINANCE',
          apiKey: apiKey.trim(),
          apiSecret: apiSecret.trim(),
          isTestnet,
          label: `Binance ${isTestnet ? 'Testnet' : 'Live'}`
        })
      });

      const result = await response.json();

      if (response.ok) {
        setCurrentStep('success');
        setTimeout(() => {
          onSuccess({
            apiKey: apiKey.trim(),
            apiSecret: apiSecret.trim(),
            isTestnet
          });
        }, 1500);
      } else if (response.status === 409) {
        // Credentials existent déjà - on peut continuer normalement
        console.log('Credentials already exist, proceeding...');
        setCurrentStep('success');
        setTimeout(() => {
          onSuccess({
            apiKey: apiKey.trim(),
            apiSecret: apiSecret.trim(),
            isTestnet
          });
        }, 1500);
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde des clés API.');
      }
    } catch (err) {
      setError('Erreur de connexion. Réessayez dans quelques instants.');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = {
    intro: (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
          <Building2 className="w-8 h-8 text-yellow-500" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-100">
            Connecter votre compte Binance
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {isTestnet 
              ? 'Connectez-vous au testnet Binance pour tester votre bot sans risque avec des fonds virtuels.'
              : 'Connectez votre compte Binance pour permettre à votre bot de trader en votre nom.'
            }
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2 text-blue-400">
            <Shield className="w-5 h-5" />
            <span className="font-medium">Sécurité garantie</span>
          </div>
          <ul className="text-sm text-gray-300 space-y-1 text-left">
            <li>• Vos clés API sont chiffrées et stockées de manière sécurisée</li>
            <li>• Nous recommandons les permissions lecture + trading uniquement</li>
            <li>• Vous pouvez révoquer l'accès à tout moment sur Binance</li>
            <li>• {isTestnet ? 'Testnet = Aucun risque financier' : 'Mode live = Fonds réels'}</li>
          </ul>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={() => setCurrentStep('guide')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>Continuer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 text-sm transition-colors duration-200"
          >
            Annuler
          </button>
        </div>
      </div>
    ),

    guide: (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-gray-100">
            Créer vos clés API Binance
          </h3>
          <p className="text-gray-400">
            Suivez ces étapes simples pour créer vos clés API
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              step: 1,
              title: `Ouvrir Binance ${isTestnet ? 'Testnet' : ''}`,
              description: isTestnet 
                ? 'Connectez-vous avec votre compte GitHub sur testnet.binance.vision'
                : 'Connectez-vous à votre compte Binance'
            },
            {
              step: 2,
              title: 'Aller dans API Management',
              description: 'Profil → Sécurité → Gestion API'
            },
            {
              step: 3,
              title: 'Créer une nouvelle API Key',
              description: 'Donnez un nom à votre API (ex: "TradingBot")'
            },
            {
              step: 4,
              title: 'Configurer les permissions',
              description: 'Activez "Lecture" et "Trading Spot" uniquement'
            },
            {
              step: 5,
              title: 'Copier les clés',
              description: 'Copiez votre API Key et Secret Key'
            }
          ].map((item) => (
            <div key={item.step} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {item.step}
              </div>
              <div>
                <h4 className="font-medium text-gray-100">{item.title}</h4>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-2 text-yellow-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong>Important :</strong> Ne partagez jamais vos clés API. 
              Notre application les stocke de manière chiffrée et sécurisée.
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleOpenBinance}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Ouvrir Binance {isTestnet ? 'Testnet' : ''}</span>
          </button>
          
          <button
            onClick={() => setCurrentStep('form')}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
          >
            J'ai déjà mes clés API
          </button>
        </div>
      </div>
    ),

    form: (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-gray-100">
            Entrer vos clés API
          </h3>
          <p className="text-gray-400">
            Collez vos clés API Binance pour connecter votre compte
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Collez votre API Key ici..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10"
              />
              <Key className="absolute right-3 top-3.5 w-4 h-4 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Secret Key
            </label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Collez votre Secret Key ici..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-400"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center space-x-2 text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleTestConnection}
            disabled={isLoading || !apiKey.trim() || !apiSecret.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Test de connexion...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Tester et connecter</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => setCurrentStep('guide')}
            className="text-gray-400 hover:text-gray-300 text-sm transition-colors duration-200"
          >
            Retour au guide
          </button>
        </div>
      </div>
    ),

    testing: (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-100">
            Test de connexion...
          </h3>
          <p className="text-gray-400">
            Vérification de vos clés API Binance
          </p>
        </div>
      </div>
    ),

    success: (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-100">
            Connexion réussie !
          </h3>
          <p className="text-gray-400">
            Votre compte Binance {isTestnet ? 'Testnet' : ''} est maintenant connecté
          </p>
        </div>
      </div>
    )
  };

  console.log('BinanceConnectionModal render - isOpen:', isOpen, 'currentStep:', currentStep);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-yellow-500" />
                </div>
                <span className="font-medium text-gray-100">
                  Binance {isTestnet ? 'Testnet' : ''}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {steps[currentStep]}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
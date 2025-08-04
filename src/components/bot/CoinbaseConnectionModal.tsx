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
  Eye,
  EyeOff,
  Loader2,
  Building2
} from 'lucide-react';
import { SiCoinbase } from 'react-icons/si';

interface CoinbaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (credentials: { apiKeyName: string; privateKey: string }) => void;
}

type Step = 'intro' | 'guide' | 'form' | 'testing' | 'success';

export default function CoinbaseConnectionModal({ 
  isOpen, 
  onClose, 
  onSuccess
}: CoinbaseConnectionModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [apiKeyName, setApiKeyName] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log('CoinbaseConnectionModal opened');
      setCurrentStep('intro');
      setApiKeyName('');
      setPrivateKey('');
      setShowPrivateKey(false);
      setError(null);
    } else {
      console.log('CoinbaseConnectionModal closed');
    }
  }, [isOpen]);

  const coinbaseUrl = 'https://www.coinbase.com/developer-platform';

  const handleOpenCoinbase = () => {
    window.open(coinbaseUrl, '_blank');
    setCurrentStep('form');
  };

  const handleTestConnection = async () => {
    if (!apiKeyName.trim() || !privateKey.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    // Vérifier le format de l'API Key Name
    if (!apiKeyName.includes('organizations/') || !apiKeyName.includes('/apiKeys/')) {
      setError('Format d\'API Key Name invalide. Doit être: organizations/{org_id}/apiKeys/{key_id}');
      return;
    }

    // Vérifier le format de la clé privée
    if (!privateKey.includes('-----BEGIN EC PRIVATE KEY-----') || !privateKey.includes('-----END EC PRIVATE KEY-----')) {
      setError('Format de clé privée invalide. Doit être une clé ECDSA au format PEM.');
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
          exchange: 'COINBASE',
          apiKey: apiKeyName.trim(),
          apiSecret: privateKey.trim(),
          isTestnet: false,
          label: 'Coinbase Advanced Trade'
        })
      });

      const result = await response.json();

      if (response.ok) {
        setCurrentStep('success');
        setTimeout(() => {
          onSuccess({
            apiKeyName: apiKeyName.trim(),
            privateKey: privateKey.trim()
          });
        }, 1500);
      } else if (response.status === 409) {
        // Credentials existent déjà - on peut continuer normalement
        console.log('Credentials already exist, proceeding...');
        setCurrentStep('success');
        setTimeout(() => {
          onSuccess({
            apiKeyName: apiKeyName.trim(),
            privateKey: privateKey.trim()
          });
        }, 1500);
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde des clés CDP.');
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
        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
          <SiCoinbase className="w-8 h-8 text-blue-500" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-100">
            Connecter votre compte Coinbase
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Connectez votre compte Coinbase via l'Advanced Trade API pour permettre à votre bot de trader en votre nom.
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2 text-blue-400">
            <Shield className="w-5 h-5" />
            <span className="font-medium">Sécurité garantie</span>
          </div>
          <ul className="text-sm text-gray-300 space-y-1 text-left">
            <li>• Vos clés CDP sont chiffrées et stockées de manière sécurisée</li>
            <li>• Utilise l'authentification JWT ES256 la plus sécurisée</li>
            <li>• Vous pouvez révoquer l'accès à tout moment sur Coinbase</li>
            <li>• Accès complet à l'Advanced Trade API</li>
          </ul>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={() => setCurrentStep('guide')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
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
            Créer vos clés CDP Coinbase
          </h3>
          <p className="text-gray-400">
            Suivez ces étapes pour créer vos clés Cloud Developer Platform
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              step: 1,
              title: 'Ouvrir Coinbase Developer Platform',
              description: 'Connectez-vous sur coinbase.com/developer-platform'
            },
            {
              step: 2,
              title: 'Créer un nouveau projet',
              description: 'Si ce n\'est pas fait, créez un projet pour votre bot'
            },
            {
              step: 3,
              title: 'Générer des clés CDP',
              description: 'Dans votre projet, allez dans API Keys → Create Key'
            },
            {
              step: 4,
              title: 'Configurer les permissions',
              description: 'Sélectionnez "Advanced Trade" et toutes les permissions nécessaires'
            },
            {
              step: 5,
              title: 'Télécharger les clés',
              description: 'Téléchargez le fichier JSON avec vos clés CDP'
            },
            {
              step: 6,
              title: 'Copier les informations',
              description: 'Copiez l\'API Key Name et la Private Key du fichier JSON'
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
              <strong>Important :</strong> Les clés CDP sont différentes des clés API classiques. 
              Elles utilisent l'authentification JWT ES256 pour une sécurité maximale.
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleOpenCoinbase}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Ouvrir Coinbase Developer Platform</span>
          </button>
          
          <button
            onClick={() => setCurrentStep('form')}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
          >
            J'ai déjà mes clés CDP
          </button>
        </div>
      </div>
    ),

    form: (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-gray-100">
            Entrer vos clés CDP
          </h3>
          <p className="text-gray-400">
            Collez les informations de votre fichier de clés CDP
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={apiKeyName}
                onChange={(e) => setApiKeyName(e.target.value)}
                placeholder="organizations/{org_id}/apiKeys/{key_id}"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10 text-xs"
              />
              <Key className="absolute right-3 top-3.5 w-4 h-4 text-gray-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Format: organizations/votre-org-id/apiKeys/votre-key-id
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Private Key (ECDSA PEM)
            </label>
            <div className="relative">
              <textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="-----BEGIN EC PRIVATE KEY-----&#10;Votre clé privée ECDSA...&#10;-----END EC PRIVATE KEY-----"
                rows={4}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-mono resize-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Clé privée ECDSA complète au format PEM
            </p>
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
            disabled={isLoading || !apiKeyName.trim() || !privateKey.trim()}
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
            Vérification de vos clés CDP Coinbase
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
            Votre compte Coinbase Advanced Trade est maintenant connecté
          </p>
        </div>
      </div>
    )
  };

  console.log('CoinbaseConnectionModal render - isOpen:', isOpen, 'currentStep:', currentStep);
  
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
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <SiCoinbase className="w-4 h-4 text-blue-500" />
                </div>
                <span className="font-medium text-gray-100">
                  Coinbase Advanced Trade
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
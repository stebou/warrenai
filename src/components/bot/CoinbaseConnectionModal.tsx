'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExternalLink, 
  Shield, 
  CheckCircle2, 
  X,
  Lock,
  Globe,
  Zap
} from 'lucide-react';
import { SiCoinbase } from 'react-icons/si';

interface CoinbaseConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CoinbaseConnectionModal({
  open,
  onOpenChange,
  onSuccess
}: CoinbaseConnectionModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Rediriger vers l'OAuth Coinbase
      window.location.href = '/api/auth/coinbase';
    } catch (error) {
      console.error('Error initiating Coinbase OAuth:', error);
      setIsConnecting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full shadow-2xl"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-gray-700">
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <SiCoinbase className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Connexion Coinbase
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Authentification OAuth2 sécurisée
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div className="text-center space-y-2">
                <p className="text-gray-300 text-sm leading-relaxed">
                  Connectez votre compte Coinbase de manière sécurisée pour accéder au trading automatisé dans l'environnement sandbox.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">Authentification sécurisée</p>
                    <p className="text-xs text-gray-400">OAuth2 avec chiffrement de bout en bout</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">Environnement sandbox</p>
                    <p className="text-xs text-gray-400">Tests sécurisés sans risque financier</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Lock className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">Révocation possible</p>
                    <p className="text-xs text-gray-400">Contrôle total depuis votre compte Coinbase</p>
                  </div>
                </div>
              </div>

              {/* Process Steps */}
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                <h4 className="text-sm font-medium text-gray-200 mb-3">Processus de connexion :</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <div className="w-4 h-4 rounded-full bg-blue-500/30 flex items-center justify-center">
                      <span className="text-blue-400 font-bold text-xs">1</span>
                    </div>
                    <span>Redirection vers Coinbase</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <div className="w-4 h-4 rounded-full bg-blue-500/30 flex items-center justify-center">
                      <span className="text-blue-400 font-bold text-xs">2</span>
                    </div>
                    <span>Autorisation des permissions</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <div className="w-4 h-4 rounded-full bg-blue-500/30 flex items-center justify-center">
                      <span className="text-blue-400 font-bold text-xs">3</span>
                    </div>
                    <span>Retour automatique dans l'application</span>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm font-medium text-yellow-400 mb-1">Permissions demandées :</h5>
                    <ul className="text-xs text-yellow-200/80 space-y-1">
                      <li>• Lecture des informations de compte</li>
                      <li>• Consultation des soldes</li>
                      <li>• Historique des transactions</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => onOpenChange(false)}
                  disabled={isConnecting}
                  className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Connexion...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>Se connecter</span>
                    </>
                  )}
                </button>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-2">
                <p className="text-xs text-gray-500">
                  En vous connectant, vous acceptez que WarrenAI accède à vos données Coinbase selon les permissions accordées.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
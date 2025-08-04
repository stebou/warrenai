'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Zap, 
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import BinanceLogo from '@/components/icons/BinanceLogo';

export interface ExchangeOption {
  id: string;
  name: string;
  type: 'binance' | 'binance_futures';
  environment: 'testnet' | 'mainnet';
  description: string;
  features: string[];
  requiresAuth: boolean;
  icon: React.ReactNode;
  badge?: {
    text: string;
    color: string;
  };
  pros: string[];
  cons: string[];
}

const exchangeOptions: ExchangeOption[] = [
  {
    id: 'binance_testnet',
    name: 'Binance Testnet',
    type: 'binance',
    environment: 'testnet',
    description: 'Environnement de test officiel Binance avec faux fonds',
    features: ['API Binance réelle', 'Fonds de test gratuits', 'Comportement identique au mainnet', 'Sécurisé'],
    requiresAuth: true,
    icon: <BinanceLogo className="w-6 h-6 text-yellow-500" variant="testnet" />,
    badge: {
      text: 'Test réel',
      color: 'bg-yellow-500'
    },
    pros: ['API réelle', 'Comportement authentique', 'Tests avancés'],
    cons: ['Configuration requise', 'Limite de fonds de test']
  },
  {
    id: 'binance_mainnet',
    name: 'Binance Live',
    type: 'binance',
    environment: 'mainnet',
    description: 'Trading en direct avec de vrais fonds sur Binance',
    features: ['Vrais profits/pertes', 'Liquidité maximale', 'Toutes les cryptomonnaies', 'Trading professionnel'],
    requiresAuth: true,
    icon: <BinanceLogo className="w-6 h-6 text-[#F0B90B]" variant="mainnet" />,
    badge: {
      text: 'Production',
      color: 'bg-red-500'
    },
    pros: ['Vrais profits', 'Liquidité maximale', 'Accès complet'],
    cons: ['Risque financier', 'Configuration avancée requise']
  }
];

interface ExchangeSelectorProps {
  selectedExchange: string | null;
  onExchangeSelect: (exchange: ExchangeOption) => void;
  onContinue: () => void;
  disabled?: boolean;
}

export default function ExchangeSelector({ 
  selectedExchange, 
  onExchangeSelect, 
  onContinue, 
  disabled = false 
}: ExchangeSelectorProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const selectedOption = exchangeOptions.find(opt => opt.id === selectedExchange);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-100">
          Sélectionner votre Exchange
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Choisissez l'environnement de trading pour votre bot. Commencez par la simulation si vous débutez.
        </p>
      </div>

      {/* Exchange Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {exchangeOptions.map((exchange, index) => {
          const isSelected = selectedExchange === exchange.id;
          const isHovered = hoveredCard === exchange.id;

          return (
            <motion.div
              key={exchange.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onHoverStart={() => setHoveredCard(exchange.id)}
              onHoverEnd={() => setHoveredCard(null)}
              onClick={() => onExchangeSelect(exchange)}
              className={`
                relative cursor-pointer rounded-xl border-2 transition-all duration-300
                ${isSelected 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {/* Badge */}
              {exchange.badge && (
                <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-medium text-white ${exchange.badge.color}`}>
                  {exchange.badge.text}
                </div>
              )}

              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center space-x-3">
                  <div className={`
                    p-3 rounded-lg transition-colors duration-200
                    ${isSelected ? 'bg-blue-500/20' : 'bg-gray-700/50'}
                  `}>
                    {exchange.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100">
                      {exchange.name}
                    </h3>
                    <p className="text-sm text-gray-400 capitalize">
                      {exchange.environment}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500 ml-auto" />
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-300 leading-relaxed">
                  {exchange.description}
                </p>

                {/* Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-200">Fonctionnalités :</h4>
                  <ul className="space-y-1">
                    {exchange.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-blue-400 rounded-full" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Auth requirement */}
                <div className="flex items-center space-x-2 pt-2 border-t border-gray-700">
                  {exchange.requiresAuth ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs text-yellow-400">Connexion API requise</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-400">Configuration instantanée</span>
                    </>
                  )}
                </div>

                {/* Hover Details */}
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ 
                    opacity: isHovered || isSelected ? 1 : 0, 
                    height: isHovered || isSelected ? 'auto' : 0 
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-gray-700 space-y-3">
                    <div>
                      <h5 className="text-xs font-medium text-green-400 mb-1">Avantages :</h5>
                      {exchange.pros.map((pro, idx) => (
                        <div key={idx} className="flex items-center space-x-1 text-xs text-gray-400">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span>{pro}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h5 className="text-xs font-medium text-yellow-400 mb-1">Considérations :</h5>
                      {exchange.cons.map((con, idx) => (
                        <div key={idx} className="flex items-center space-x-1 text-xs text-gray-400">
                          <AlertTriangle className="w-3 h-3 text-yellow-500" />
                          <span>{con}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Exchange Summary */}
      {selectedOption && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/80 border border-gray-700 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                {selectedOption.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-100">
                  Exchange sélectionné : {selectedOption.name}
                </h4>
                <p className="text-sm text-gray-400">
                  {selectedOption.requiresAuth 
                    ? 'Une connexion API sera requise à l\'étape suivante'
                    : 'Prêt à configurer immédiatement'
                  }
                </p>
              </div>
            </div>
            {selectedOption.requiresAuth && (
              <div className="flex items-center space-x-1 text-xs text-yellow-400">
                <ExternalLink className="w-4 h-4" />
                <span>API requise</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Continue Button */}
      <div className="flex justify-center pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          disabled={!selectedExchange || disabled}
          className={`
            px-8 py-3 rounded-lg font-medium transition-all duration-200
            ${selectedExchange && !disabled
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {selectedOption?.requiresAuth ? 'Continuer vers la connexion' : 'Continuer'}
        </motion.button>
      </div>
    </div>
  );
}
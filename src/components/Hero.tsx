'use client';

import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Zap, Shield, Target, Bot } from 'lucide-react';
import { useState, useEffect } from 'react';

// Positions fixes pour les étoiles (évite le problème d'hydratation)
const starPositions = [
  { left: "5.49%", top: "17.99%", duration: 3, delay: 0 },
  { left: "35.50%", top: "39.09%", duration: 4, delay: 0.5 },
  { left: "11.92%", top: "59.52%", duration: 2.5, delay: 1 },
  { left: "80.69%", top: "5.37%", duration: 3.5, delay: 1.5 },
  { left: "81.91%", top: "96.10%", duration: 4.5, delay: 2 },
  { left: "94.40%", top: "73.48%", duration: 3, delay: 2.5 }
];

export default function Hero() {
  const { user } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Animated background stars */}
      {isClient && (
        <div className="absolute inset-0">
          {starPositions.map((star, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-20"
              style={{
                left: star.left,
                top: star.top,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1]
              }}
              transition={{
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay
              }}
            />
          ))}
        </div>
      )}

      {/* Gradient glow effects */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{ backgroundColor: '#14b8a6' }}
      />

      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full blur-3xl"
        style={{ backgroundColor: '#10b981' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
          {/* Left side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black mb-6"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              <span style={{ color: '#ffffff' }}>Maximisez vos </span>
              <span 
                className="bg-gradient-to-r bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: `linear-gradient(to right, #14b8a6, #10b981)`
                }}
              >
                Profits
              </span>
              <br />
              <span style={{ color: '#ffffff' }}>avec l'IA</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed"
            >
              Plateforme de trading crypto alimentée par l'IA. Automatisation intelligente, 
              stratégies avancées et gestion des risques de niveau bancaire.
            </motion.p>

            {/* Key features */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" style={{ color: '#14b8a6' }} />
                <span className="text-gray-300 font-medium">+247% ROI moyen</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" style={{ color: '#10b981' }} />
                <span className="text-gray-300 font-medium">Exécution &lt; 50ms</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" style={{ color: '#14b8a6' }} />
                <span className="text-gray-300 font-medium">Sécurité bancaire</span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {user ? (
                <Link 
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: '#14b8a6',
                    color: '#0a0a0a'
                  }}
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Access Dashboard
                </Link>
              ) : (
                <>
                  <SignUpButton mode="modal">
                    <button 
                      className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: '#14b8a6',
                        color: '#0a0a0a'
                      }}
                    >
                      <Bot className="w-5 h-5 mr-2" />
                      Start Trading Now
                    </button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <button 
                      className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg border-2 transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        borderColor: '#262626'
                      }}
                    >
                      Log in
                    </button>
                  </SignInButton>
                </>
              )}
            </motion.div>
          </motion.div>

          {/* Right side - Trading Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div 
              className="rounded-xl overflow-hidden shadow-2xl border group perspective-1000 cursor-pointer h-[500px]"
              style={{ 
                borderColor: '#14b8a6'
              }}
            >
              {/* Conteneur flip pour tout le module */}
              <div className="relative transition-transform duration-700 transform-style-preserve-3d group-hover:rotate-y-180 h-full w-full">
                {/* Face avant - Dashboard complet */}
                <div 
                  className="absolute inset-0 backface-hidden rounded-xl"
                  style={{ 
                    backgroundColor: '#1a1a1a'
                  }}
                >
                  {/* Dashboard header */}
                  <div 
                    className="px-6 py-4 flex items-center justify-between border-b"
                    style={{ 
                      backgroundColor: '#262626',
                      borderColor: '#333333'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Bot className="w-6 h-6" style={{ color: '#14b8a6' }} />
                      <span className="font-bold text-white">Warren AI Trading</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-green-400">Active</span>
                    </div>
                  </div>
              
                  {/* Dashboard content */}
                  <div className="p-6 space-y-4">
                    {/* Portfolio Overview */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} />
                          <span className="text-sm text-gray-400">Total Profit</span>
                        </div>
                        <div className="text-2xl font-bold" style={{ color: '#10b981' }}>
                          +$12,347.80
                        </div>
                        <div className="text-sm text-gray-400">+24.6% this month</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4" style={{ color: '#14b8a6' }} />
                          <span className="text-sm text-gray-400">Win Rate</span>
                        </div>
                        <div className="text-2xl font-bold text-white">94.2%</div>
                        <div className="text-sm text-gray-400">156 of 166 trades</div>
                      </div>
                    </div>

                    {/* Recent Trades */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-white">Recent Trades</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">BTC</span>
                            </div>
                            <div>
                              <div className="text-white font-medium">BTC/USDT</div>
                              <div className="text-xs text-gray-400">Buy @ $67,432</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium" style={{ color: '#10b981' }}>+$2,847.50</div>
                            <div className="text-xs text-gray-400">+4.2%</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">ETH</span>
                            </div>
                            <div>
                              <div className="text-white font-medium">ETH/USDT</div>
                              <div className="text-xs text-gray-400">Sell @ $3,642</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium" style={{ color: '#10b981' }}>+$1,234.80</div>
                            <div className="text-xs text-gray-400">+3.1%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Face arrière - Créations Agentiques */}
                <div 
                  className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl overflow-hidden"
                  style={{ 
                    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 30%, #ffffff 50%, #1a1a1a 70%, #000000 100%)'
                  }}
                >
                  {/* Motif de lignes noir et blanc */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `
                        linear-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 0, 0, 0.8) 1px, transparent 1px)
                      `,
                      backgroundSize: '25px 25px'
                    }}></div>
                  </div>
                  
                  {/* Particules noir et blanc */}
                  <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute top-20 right-16 w-1 h-1 bg-black rounded-full opacity-90 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute bottom-16 left-20 w-1.5 h-1.5 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute bottom-32 right-12 w-1 h-1 bg-black rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                  
                  {/* Overlay avec contraste noir/blanc */}
                  <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-white/10 to-black/30 rounded-xl"></div>
                  
                  <div className="relative h-full flex flex-col justify-between p-8">
                    {/* Header avec logo */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black border border-white rounded-lg flex items-center justify-center shadow-lg">
                          <span className="text-white font-black text-sm">W</span>
                        </div>
                        <span className="text-white font-bold text-sm drop-shadow-lg">WARREN AI</span>
                      </div>
                      <div className="px-3 py-1 bg-white/90 border border-black/20 rounded-full shadow-lg">
                        <span className="text-black text-xs font-black">FINTECH</span>
                      </div>
                    </div>

                    {/* Contenu central */}
                    <div className="text-center">
                      {/* Icône avec design noir et blanc */}
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white border-2 border-black flex items-center justify-center shadow-2xl">
                        <Bot className="w-10 h-10 text-black" />
                      </div>
                      
                      {/* Titre premium */}
                      <h3 className="text-3xl font-black mb-2 tracking-tight">
                        <span className="text-white drop-shadow-lg">
                          Créations Agentiques
                        </span>
                      </h3>
                      
                      <p className="text-lg font-bold text-black bg-white/90 px-4 py-1 rounded-full inline-block mb-6 shadow-lg">
                        de Bot Trading
                      </p>
                      
                      {/* Métriques fintech noir et blanc */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-black/80 border border-white rounded-xl p-3 shadow-lg">
                          <div className="text-white text-lg font-black">AI-Powered</div>
                          <div className="text-white/80 text-xs">Neural Networks</div>
                        </div>
                        <div className="bg-white/90 border border-black rounded-xl p-3 shadow-lg">
                          <div className="text-black text-lg font-black">Real-Time</div>
                          <div className="text-black/80 text-xs">Market Analysis</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer avec indicateurs tech */}
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg"></div>
                        <div className="w-2 h-2 bg-black rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0.3s' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0.6s' }}></div>
                      </div>
                      
                      <div className="bg-black/80 px-3 py-1 rounded-full border border-white shadow-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          <span className="text-white text-xs font-mono font-bold">ALGO_TRADING_V2.0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Effet de scan futuriste */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-80 animate-pulse shadow-lg"></div>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-black to-transparent opacity-80 animate-pulse shadow-lg" style={{ animationDelay: '1s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
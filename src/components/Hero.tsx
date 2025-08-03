'use client';

import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Hero() {
  const { user } = useUser();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background/90 to-accent/20">
      {/* Fond animé glassmorphique */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 0.8, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full blur-3xl"
        />
      </div>

      {/* Éléments décoratifs flottants */}
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-20 right-20 w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hidden lg:block"
      />
      <motion.div
        animate={{ 
          y: [0, 15, 0],
          rotate: [0, -3, 0]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute bottom-32 left-16 w-12 h-12 bg-white/15 backdrop-blur-xl rounded-full border border-white/30 hidden lg:block"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl"
        >
          <motion.h1 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-8"
          >
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              TradingAI
            </span>
            <br />
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-foreground"
            >
              Révolutionnez Votre Trading
            </motion.span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10"
          >
            Plateforme de trading automatisé alimentée par l&apos;IA pour maximiser 
            vos profits avec des stratégies intelligentes et sécurisées.
          </motion.p>
          
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {user ? (
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link 
                  href="/dashboard"
                  className="inline-block px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-all duration-300 shadow-xl hover:shadow-2xl backdrop-blur-sm border border-white/30"
                >
                  Accéder au Dashboard
                </Link>
              </motion.div>
            ) : (
              <>
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <SignUpButton mode="modal">
                    <button className="px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-all duration-300 shadow-xl hover:shadow-2xl backdrop-blur-sm border border-white/30">
                      Commencer Gratuitement
                    </button>
                  </SignUpButton>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <SignInButton mode="modal">
                    <button className="px-8 py-4 text-lg font-semibold rounded-xl bg-white/10 backdrop-blur-xl text-foreground hover:bg-white/20 transition-all duration-300 border-2 border-white/30">
                      Découvrir la Démo
                    </button>
                  </SignInButton>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Stats glassmorphiques */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {[
              { number: "10K+", label: "Traders Actifs" },
              { number: "€2.5M+", label: "Volume Tradé" },
              { number: "94%", label: "Taux de Réussite" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="text-2xl font-bold text-primary">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CTA() {
  const { user } = useUser();

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
      className="relative py-16 md:py-24 bg-gradient-to-r from-accent via-secondary to-primary overflow-hidden"
    >
      {/* Fond glassmorphique dynamique */}
      <div className="absolute inset-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-black/10 via-transparent to-black/10 backdrop-blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20"></div>
      </div>

      {/* Éléments décoratifs flottants */}
      <motion.div
        animate={{ 
          y: [0, -30, 0],
          x: [0, 20, 0]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-16 left-16 w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 hidden lg:block"
      />
      <motion.div
        animate={{ 
          y: [0, 25, 0],
          x: [0, -15, 0]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute bottom-16 right-16 w-20 h-20 bg-white/15 backdrop-blur-xl rounded-full border border-white/20 hidden lg:block"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="backdrop-blur-xl bg-white/10 rounded-3xl p-12 border border-white/20 shadow-2xl"
        >
          <motion.h2 
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6"
          >
            Prêt à Révolutionner Votre Trading?
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-white/80 mb-8 max-w-2xl mx-auto backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/20"
          >
            Rejoignez plus de 10,000 traders qui font confiance à TradingAI.
          </motion.p>
          
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {user ? (
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link 
                  href="/dashboard"
                  className="inline-block px-8 py-4 text-lg font-semibold rounded-xl bg-white/90 backdrop-blur-sm text-accent hover:bg-white transition-all duration-300 shadow-xl hover:shadow-2xl border border-white/50"
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
                    <button className="px-8 py-4 text-lg font-semibold rounded-xl bg-white/90 backdrop-blur-sm text-accent hover:bg-white transition-all duration-300 shadow-xl hover:shadow-2xl border border-white/50">
                      Commencer Maintenant
                    </button>
                  </SignUpButton>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <SignInButton mode="modal">
                    <button className="px-8 py-4 text-lg font-semibold rounded-xl bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 transition-all duration-300 border-2 border-white/50">
                      Se Connecter
                    </button>
                  </SignInButton>
                </motion.div>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
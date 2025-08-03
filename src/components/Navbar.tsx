'use client';

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user } = useUser();

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed top-0 w-full z-50 bg-background/20 backdrop-blur-xl border-b border-white/10 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3"
          >
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/20"
            >
              <span className="text-primary-foreground font-bold text-lg">T</span>
            </motion.div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              TradingAI
            </span>
          </motion.div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {user ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="backdrop-blur-sm bg-white/10 rounded-full p-1 border border-white/20"
              >
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center space-x-3"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 text-foreground hover:text-primary transition-colors backdrop-blur-sm hover:bg-white/10 rounded-lg border border-white/20">
                      Se connecter
                    </button>
                  </SignInButton>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <SignUpButton mode="modal">
                    <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg backdrop-blur-sm border border-white/30">
                      Commencer
                    </button>
                  </SignUpButton>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Ligne décorative glassmorphique */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />
    </motion.nav>
  );
}
'use client';

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Navbar() {
  const { user } = useUser();

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-3"
          >
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-[#14b8a6] to-[#10b981] rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">W</span>
              </div>
              <span className="font-bold text-xl text-white">
                Warren AI
              </span>
            </Link>
          </motion.div>

          {/* Navigation links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Pricing
            </Link>
            <Link href="/docs" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Docs
            </Link>
            <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              About
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dashboard"
                  className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                >
                  Dashboard
                </Link>
                <div className="relative z-50">
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8",
                        userButtonBox: "rounded-full",
                        userButtonPopoverCard: "bg-gray-900 border-gray-700",
                        userButtonPopoverActionButton: "text-gray-300 hover:text-white hover:bg-gray-800"
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <SignInButton mode="modal">
                  <motion.button 
                    whileHover={{ 
                      scale: 1.05,
                      y: -1,
                      boxShadow: "0 4px 12px rgba(20, 184, 166, 0.2)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="px-5 py-2.5 text-sm font-semibold border border-[#14b8a6]/50 text-white hover:text-[#14b8a6] hover:border-[#14b8a6] transition-all duration-200"
                    style={{ borderRadius: '8px' }}
                  >
                    Se connecter
                  </motion.button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <motion.button 
                    whileHover={{ 
                      scale: 1.05,
                      y: -1,
                      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="px-5 py-2.5 text-sm font-semibold bg-[#10b981] text-black hover:bg-[#10b981]/90 transition-all duration-200"
                    style={{ borderRadius: '8px' }}
                  >
                    S'inscrire
                  </motion.button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
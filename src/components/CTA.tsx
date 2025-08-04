'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  Zap, 
  Users, 
  Star,
  BarChart3,
  Bot
} from 'lucide-react';

export default function CTA() {
  const { user } = useUser();

  const trustFeatures = [
    {
      icon: Shield,
      title: "Sécurisé & Régulé",
      description: "Sécurité de niveau bancaire",
      color: "#14b8a6"
    },
    {
      icon: Zap,
      title: "Ultra-Rapide",
      description: "Exécution en millisecondes",
      color: "#10b981"
    },
    {
      icon: TrendingUp,
      title: "94.2% de Réussite",
      description: "Stratégies IA prouvées",
      color: "#14b8a6"
    }
  ];

  const testimonials = [
    {
      name: "Marie Dubois",
      role: "Trader Indépendante",
      text: "Warren AI a transformé ma façon de trader. +340% de profits en 6 mois!",
      profit: "+€15,680",
      stars: 5
    },
    {
      name: "Jean-Luc Martin",
      role: "Investisseur",
      text: "L'automatisation parfaite. Je peux enfin trader sans stress 24/7.",
      profit: "+€28,450",
      stars: 5
    },
    {
      name: "Sophie Leroux",
      role: "Day Trader",
      text: "Les algorithmes IA sont impressionnants. Jamais vu ça ailleurs.",
      profit: "+€42,100",
      stars: 5
    }
  ];

  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/50 to-black" />
      
      {/* Multiple glow effects */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl"
        style={{ backgroundColor: '#14b8a6' }}
      />
      <motion.div 
        animate={{ 
          scale: [1, 0.8, 1],
          opacity: [0.15, 0.3, 0.15]
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{ backgroundColor: '#10b981' }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#14b8a6]/20 to-[#10b981]/20 border border-[#14b8a6]/30 rounded-full px-6 py-3 mb-8"
          >
            <Bot className="w-5 h-5" style={{ color: '#14b8a6' }} />
            <span className="text-white font-medium">Plus de 45,000 traders actifs</span>
            <Users className="w-5 h-5" style={{ color: '#10b981' }} />
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            Prêt à{' '}
            <span className="bg-gradient-to-r from-[#14b8a6] to-[#10b981] bg-clip-text text-transparent">
              maximiser vos profits
            </span>
            ?
          </h2>
          
          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            Rejoignez la révolution du trading crypto avec Warren AI. 
            Commencez à générer des profits automatiquement dès aujourd'hui.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {user ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl"
                  style={{
                    backgroundColor: '#14b8a6',
                    color: '#000000'
                  }}
                >
                  <BarChart3 className="w-6 h-6 mr-3" />
                  Accéder au Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </motion.div>
            ) : (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <SignUpButton mode="modal">
                    <button className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl group"
                      style={{
                        backgroundColor: '#14b8a6',
                        color: '#000000'
                      }}
                    >
                      <Bot className="w-6 h-6 mr-3" />
                      Commencer Maintenant
                      <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                    </button>
                  </SignUpButton>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <SignInButton mode="modal">
                    <button className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold rounded-xl border-2 transition-all duration-300 hover:bg-white/5"
                      style={{
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        borderColor: '#262626'
                      }}
                    >
                      Se connecter
                    </button>
                  </SignInButton>
                </motion.div>
              </>
            )}
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {trustFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 backdrop-blur-sm hover:border-gray-700 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${feature.color}20` }}
                    >
                      <IconComponent 
                        className="w-6 h-6" 
                        style={{ color: feature.color }} 
                      />
                    </div>
                    <div>
                      <div className="text-white font-bold mb-1">{feature.title}</div>
                      <div className="text-gray-400 text-sm">{feature.description}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ce que disent nos traders
            </h3>
            <p className="text-gray-400 text-lg">
              Découvrez pourquoi ils nous font confiance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -5 }}
                className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 backdrop-blur-sm hover:border-gray-700 transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="font-bold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                  <div 
                    className="font-bold text-right"
                    style={{ color: '#10b981' }}
                  >
                    {testimonial.profit}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700 rounded-2xl p-8 backdrop-blur-sm"
        >
          <Shield className="w-16 h-16 mx-auto mb-6" style={{ color: '#14b8a6' }} />
          <h4 className="text-2xl font-bold text-white mb-4">
            Garantie Satisfait ou Remboursé 30 jours
          </h4>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Testez Warren AI sans risque. Si vous n'êtes pas entièrement satisfait des résultats, 
            nous vous remboursons intégralement sous 30 jours.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
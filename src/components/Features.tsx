'use client';

import { motion } from 'framer-motion';
import { 
  Bot, 
  Zap, 
  Shield, 
  BarChart3, 
  Target, 
  Rocket,
  TrendingUp,
  DollarSign,
  Users,
  Clock
} from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Bot,
      title: "Intelligence Artificielle Avancée",
      description: "Algorithmes de machine learning qui analysent les marchés crypto 24/7 pour identifier les meilleures opportunités de trading.",
      color: "#14b8a6"
    },
    {
      icon: Zap,
      title: "Exécution Ultra-Rapide",
      description: "Latence de moins de 10ms pour exécuter vos trades au meilleur moment et capturer chaque mouvement profitable.",
      color: "#10b981"
    },
    {
      icon: Shield,
      title: "Sécurité Bancaire",
      description: "Protection institutionnelle avec gestion des risques avancée, stop-loss automatiques et sauvegarde de votre capital.",
      color: "#14b8a6"
    },
    {
      icon: BarChart3,
      title: "Analytics en Temps Réel",
      description: "Tableaux de bord complets avec métriques de performance, historique des trades et insights de marché détaillés.",
      color: "#10b981"
    },
    {
      icon: Target,
      title: "Stratégies Optimisées",
      description: "Multiples approches de trading : scalping, swing trading, arbitrage et stratégies personnalisées selon vos objectifs.",
      color: "#14b8a6"
    },
    {
      icon: Rocket,
      title: "Croissance Automatisée",
      description: "Réinvestissement intelligent des profits avec compound effect pour maximiser la croissance de votre portefeuille.",
      color: "#10b981"
    }
  ];

  const stats = [
    {
      icon: DollarSign,
      value: "$128M+",
      label: "Volume Total Tradé",
      color: "#14b8a6"
    },
    {
      icon: Users,
      value: "45,000+",
      label: "Traders Actifs",
      color: "#10b981"
    },
    {
      icon: TrendingUp,
      value: "94.2%",
      label: "Taux de Réussite",
      color: "#14b8a6"
    },
    {
      icon: Clock,
      value: "24/7",
      label: "Trading Automatisé",
      color: "#10b981"
    }
  ];

  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/50 to-black" />
      
      {/* Glow effects */}
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ 
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{ backgroundColor: '#14b8a6' }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            Pourquoi choisir{' '}
            <span className="bg-gradient-to-r from-[#14b8a6] to-[#10b981] bg-clip-text text-transparent">
              Warren AI
            </span>
            ?
          </h2>
          <p className="text-xl text-gray-400 max-w-4xl mx-auto font-medium leading-relaxed">
            La plateforme de trading crypto la plus avancée, propulsée par l'IA pour maximiser vos profits 
            tout en minimisant les risques grâce à l'automatisation intelligente.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-gray-900/80 border border-gray-800 rounded-xl p-8 hover:border-gray-700 transition-all duration-300 backdrop-blur-sm"
              >
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 hover:scale-110"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <IconComponent 
                    className="w-8 h-8" 
                    style={{ color: feature.color }} 
                  />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 md:p-12 backdrop-blur-sm"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Les chiffres parlent d'eux-mêmes
            </h3>
            <p className="text-gray-400 text-lg">
              Découvrez pourquoi plus de 45,000 traders nous font confiance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center group cursor-pointer"
                >
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <IconComponent 
                      className="w-8 h-8" 
                      style={{ color: stat.color }} 
                    />
                  </div>
                  <div 
                    className="text-4xl font-black mb-2 transition-colors duration-300"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-gray-400 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 text-center"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#14b8a6] to-[#10b981] rounded-full flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-black" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Régulé & Sécurisé</h4>
              <p className="text-gray-400 text-sm">Conformité réglementaire et sécurité de niveau bancaire</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#14b8a6] to-[#10b981] rounded-full flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Performance Prouvée</h4>
              <p className="text-gray-400 text-sm">Plus de 3 ans d'historique de trading rentable</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#14b8a6] to-[#10b981] rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-black" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Support Expert</h4>
              <p className="text-gray-400 text-sm">Équipe de traders experts disponible 24/7</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
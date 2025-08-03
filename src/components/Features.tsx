'use client';

import { motion } from 'framer-motion';

export default function Features() {
  const features = [
    {
      emoji: "🤖",
      title: "IA Avancée",
      description: "Algorithmes d'apprentissage automatique pour analyser les marchés en temps réel.",
      hoverColor: "hover:border-primary/50",
      titleHoverColor: "group-hover:text-primary",
      bgGradient: "from-primary/10 to-primary/5"
    },
    {
      emoji: "⚡",
      title: "Trading Automatisé",
      description: "Bots de trading qui fonctionnent 24/7 selon vos stratégies personnalisées.",
      hoverColor: "hover:border-secondary/50",
      titleHoverColor: "group-hover:text-secondary",
      bgGradient: "from-secondary/10 to-secondary/5"
    },
    {
      emoji: "🔒",
      title: "Sécurité Maximale",
      description: "Chiffrement de bout en bout et gestion des risques intégrée.",
      hoverColor: "hover:border-accent/50",
      titleHoverColor: "group-hover:text-accent",
      bgGradient: "from-accent/10 to-accent/5"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      {/* Fond glassmorphique décoratif */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0],
            y: [0, 60, 0]
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-32 right-1/3 w-48 h-48 bg-gradient-to-r from-accent/5 to-primary/5 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="backdrop-blur-sm bg-white/5 rounded-2xl p-8 border border-white/10 inline-block"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Pourquoi Choisir TradingAI?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Une suite complète d&apos;outils alimentés par l&apos;IA pour transformer 
              votre approche du trading.
            </p>
          </motion.div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.05,
                y: -10,
                transition: { duration: 0.3 }
              }}
              className="group"
            >
              <div className={`backdrop-blur-xl bg-gradient-to-br ${feature.bgGradient} border border-white/20 p-8 rounded-3xl shadow-2xl ${feature.hoverColor} transition-all duration-500 hover:shadow-3xl hover:bg-white/10`}>
                {/* Effet de brillance glassmorphique */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <motion.div 
                  className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {feature.emoji}
                </motion.div>
                
                <h3 className={`text-xl font-semibold mb-4 text-card-foreground ${feature.titleHoverColor} transition-colors duration-300`}>
                  {feature.title}
                </h3>
                
                <div className="backdrop-blur-sm bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
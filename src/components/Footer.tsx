'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Footer() {
  const footerSections = [
    {
      title: "Produit",
      titleColor: "text-primary",
      links: [
        { name: "Fonctionnalités", href: "#", hoverColor: "hover:text-primary" },
        { name: "Tarifs", href: "#", hoverColor: "hover:text-primary" },
        { name: "API", href: "#", hoverColor: "hover:text-primary" }
      ]
    },
    {
      title: "Support",
      titleColor: "text-secondary",
      links: [
        { name: "Centre d'aide", href: "#", hoverColor: "hover:text-secondary" },
        { name: "Contact", href: "#", hoverColor: "hover:text-secondary" },
        { name: "Communauté", href: "#", hoverColor: "hover:text-secondary" }
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <motion.footer 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
      className="relative bg-accent text-white py-16 overflow-hidden"
    >
      {/* Fond glassmorphique décoratif */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 0.8, 1],
            rotate: [0, -60, 0]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-24 -right-24 w-80 h-80 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 border border-white/10 shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div variants={itemVariants} className="col-span-1 md:col-span-2">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-3 mb-4"
              >
                <motion.div 
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/20"
                >
                  <span className="text-primary-foreground font-bold text-lg">T</span>
                </motion.div>
                <span className="font-bold text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  TradingAI
                </span>
              </motion.div>
              
              <motion.div
                variants={itemVariants}
                className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <p className="text-white/70 max-w-md">
                  La plateforme de trading automatisé alimentée par l&apos;IA 
                  qui révolutionne la façon dont vous investissez.
                </p>
              </motion.div>
            </motion.div>

            {footerSections.map((section, index) => (
              <motion.div key={index} variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10 h-full"
                >
                  <h3 className={`font-semibold mb-4 ${section.titleColor}`}>
                    {section.title}
                  </h3>
                  <ul className="space-y-3 text-white/70">
                    {section.links.map((link, linkIndex) => (
                      <motion.li 
                        key={linkIndex}
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link 
                          href={link.href} 
                          className={`${link.hoverColor} transition-all duration-300 hover:backdrop-blur-sm hover:bg-white/5 hover:rounded px-2 py-1 block`}
                        >
                          {link.name}
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            variants={itemVariants}
            className="border-t border-white/20 mt-12 pt-8 text-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10 inline-block"
            >
              <p className="text-white/60 text-sm">
                © 2025 TradingAI. Tous droits réservés.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
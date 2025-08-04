'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Bot, 
  TrendingUp, 
  Shield, 
  Mail, 
  Phone,
  MapPin,
  Twitter,
  Linkedin,
  Github,
  ExternalLink,
  BarChart3,
  Users,
  Zap
} from 'lucide-react';

export default function Footer() {
  const footerSections = [
    {
      title: "Plateforme",
      links: [
        { name: "Fonctionnalités", href: "/features", icon: BarChart3 },
        { name: "Tarifs", href: "/pricing", icon: TrendingUp },
        { name: "API Trading", href: "/api", icon: ExternalLink },
        { name: "Documentation", href: "/docs", icon: ExternalLink }
      ]
    },
    {
      title: "Trading",
      links: [
        { name: "Bots de Trading", href: "/bots", icon: Bot },
        { name: "Stratégies IA", href: "/strategies", icon: TrendingUp },
        { name: "Analyses de Marché", href: "/market-analysis", icon: BarChart3 },
        { name: "Signaux de Trading", href: "/signals", icon: Zap }
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Centre d'Aide", href: "/help", icon: Users },
        { name: "Communauté", href: "/community", icon: Users },
        { name: "Statut Système", href: "/status", icon: Zap },
        { name: "Sécurité", href: "/security", icon: Shield }
      ]
    },
    {
      title: "Légal",
      links: [
        { name: "Politique de Confidentialité", href: "/privacy", icon: Shield },
        { name: "Conditions d'Utilisation", href: "/terms", icon: ExternalLink },
        { name: "Divulgation des Risques", href: "/risk", icon: Shield },
        { name: "Conformité", href: "/compliance", icon: Shield }
      ]
    }
  ];

  const socialLinks = [
    { 
      name: "Twitter", 
      href: "https://twitter.com/warrenai", 
      icon: Twitter 
    },
    { 
      name: "LinkedIn", 
      href: "https://linkedin.com/company/warrenai", 
      icon: Linkedin 
    },
    { 
      name: "GitHub", 
      href: "https://github.com/warrenai", 
      icon: Github 
    }
  ];

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "support@warren-ai.com",
      href: "mailto:support@warren-ai.com"
    },
    {
      icon: Phone,
      label: "Téléphone",
      value: "+33 1 42 86 83 83",
      href: "tel:+33142868383"
    },
    {
      icon: MapPin,
      label: "Adresse",
      value: "Paris, France",
      href: null
    }
  ];

  return (
    <footer className="bg-black border-t border-gray-800 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/50 to-black" />
      
      {/* Subtle glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.05, 0.15, 0.05]
        }}
        transition={{ 
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-32 rounded-full blur-3xl"
        style={{ backgroundColor: '#14b8a6' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <Link href="/" className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-[#14b8a6] to-[#10b981] rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-black" />
              </div>
              <span className="font-black text-2xl text-white">Warren AI</span>
            </Link>
            
            <p className="text-gray-400 mb-8 max-w-sm leading-relaxed">
              La plateforme de trading crypto la plus avancée, propulsée par l'intelligence artificielle 
              pour maximiser vos profits automatiquement.
            </p>

            {/* Contact Info */}
            <div className="space-y-4 mb-8">
              {contactInfo.map((contact, index) => {
                const IconComponent = contact.icon;
                const content = (
                  <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">{contact.label}</div>
                      <div className="text-sm">{contact.value}</div>
                    </div>
                  </div>
                );

                return contact.href ? (
                  <Link key={index} href={contact.href}>
                    {content}
                  </Link>
                ) : (
                  <div key={index}>{content}</div>
                );
              })}
            </div>

            {/* Social links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <motion.a 
                    key={index}
                    href={social.href} 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-gradient-to-r hover:from-[#14b8a6] hover:to-[#10b981] transition-all duration-300 group"
                  >
                    <IconComponent className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Footer sections */}
          {footerSections.map((section, sectionIndex) => (
            <motion.div 
              key={sectionIndex}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
              className="lg:col-span-1"
            >
              <h3 className="font-bold text-white mb-6 text-lg">{section.title}</h3>
              <ul className="space-y-4">
                {section.links.map((link, linkIndex) => {
                  const IconComponent = link.icon;
                  return (
                    <li key={linkIndex}>
                      <Link 
                        href={link.href} 
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200 group"
                      >
                        <IconComponent className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                        <span className="hover:translate-x-1 transition-transform duration-200">
                          {link.name}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="border-t border-b border-gray-800 py-8 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <TrendingUp className="w-8 h-8 mb-2" style={{ color: '#14b8a6' }} />
              <div className="text-2xl font-bold text-white">$128M+</div>
              <div className="text-gray-400 text-sm">Volume Tradé</div>
            </div>
            <div className="flex flex-col items-center">
              <Users className="w-8 h-8 mb-2" style={{ color: '#10b981' }} />
              <div className="text-2xl font-bold text-white">45,000+</div>
              <div className="text-gray-400 text-sm">Traders Actifs</div>
            </div>
            <div className="flex flex-col items-center">
              <BarChart3 className="w-8 h-8 mb-2" style={{ color: '#14b8a6' }} />
              <div className="text-2xl font-bold text-white">94.2%</div>
              <div className="text-gray-400 text-sm">Taux de Réussite</div>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-8 h-8 mb-2" style={{ color: '#10b981' }} />
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-gray-400 text-sm">Trading Auto</div>
            </div>
          </div>
        </motion.div>

        {/* Bottom section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-center"
        >
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2024 Warren AI. Tous droits réservés.
          </p>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" style={{ color: '#14b8a6' }} />
              <span className="text-gray-400 text-sm">Sécurisé & Régulé</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-[#14b8a6] to-[#10b981] rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-semibold">Systèmes Actifs</span>
            </div>
          </div>
        </motion.div>

        {/* Risk Warning */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 pt-8 border-t border-gray-800"
        >
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#14b8a6' }} />
              <div>
                <h4 className="text-white font-semibold mb-2">Avertissement sur les Risques</h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Le trading de cryptomonnaies implique des risques substantiels et peut ne pas convenir à tous les investisseurs. 
                  Les performances passées ne garantissent pas les résultats futurs. Veuillez vous assurer de bien comprendre 
                  les risques impliqués avant de commencer à trader.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
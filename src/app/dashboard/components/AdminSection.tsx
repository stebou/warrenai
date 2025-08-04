'use client';

import { useAdminInfo } from '@/hooks/useAdmin';
import { motion } from 'framer-motion';
import { Shield, Lock } from 'lucide-react';
import CacheMetrics from './CacheMetrics';

export default function AdminSection() {
  const { isAdmin, userEmail, canAccessCacheMetrics } = useAdminInfo();

  // Si l'utilisateur n'est pas admin, ne rien afficher
  if (!isAdmin) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-6"
    >
      {/* Header Admin */}
      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">
              Zone Administrateur
            </h3>
            <p className="text-sm text-red-300">
              Connecté en tant que: <span className="font-semibold">{userEmail}</span>
            </p>
          </div>
          <div className="ml-auto">
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
              <Lock className="w-3 h-3 text-red-400" />
              <span className="text-xs font-semibold text-red-300">ADMIN</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Metrics - Accessible uniquement aux admins */}
      {canAccessCacheMetrics && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <CacheMetrics />
        </motion.div>
      )}

      {/* Autres outils admin peuvent être ajoutés ici */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="bg-gray-900/80 border border-gray-800/80 rounded-xl p-6 backdrop-blur-sm"
      >
        <h4 className="text-md font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-yellow-400" />
          Outils Administrateur
        </h4>
        <div className="text-sm text-gray-400">
          <p>• Métriques du cache système</p>
          <p>• Monitoring des performances</p>
          <p>• Logs et diagnostics</p>
          <p className="text-yellow-400 mt-2">
            ⚠️ Ces outils ne sont visibles que par les administrateurs
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
'use client';

import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';

// Lazy load heavy components
const BotManagementHub = lazy(() => import('./BotManagementHub'));

const LoadingSkeleton = () => (
  <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 shadow-2xl">
    <div className="animate-pulse">
      <div className="h-6 bg-white/10 rounded mb-4"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white/5 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
);

export default function BotsList() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Suspense fallback={<LoadingSkeleton />}>
        <BotManagementHub />
      </Suspense>
    </motion.div>
  );
}
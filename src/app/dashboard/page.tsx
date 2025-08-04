import { checkAuth } from '@/lib/auth/utils';
import { ensureUserExists } from '@/lib/auth/sync-user';
import DashboardContent from './components/DashboardContent';

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Server-side auth check
  const userId = await checkAuth();
  
  // Synchronisation utilisateur séparée (pas dans checkAuth pour éviter la boucle)
  try {
    await ensureUserExists(userId);
  } catch (error) {
    console.error('[DASHBOARD] Failed to sync user:', error);
    // Continue sans bloquer l'accès au dashboard
  }
  return <DashboardContent />;
}
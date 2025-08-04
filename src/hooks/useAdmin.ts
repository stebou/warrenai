import { useUser } from '@clerk/nextjs';
import { useMemo } from 'react';

/**
 * Hook pour vérifier si l'utilisateur actuel est administrateur
 * @returns {boolean} true si l'utilisateur est admin, false sinon
 */
export function useAdmin(): boolean {
  const { user } = useUser();
  
  return useMemo(() => {
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      return false;
    }

    const userEmail = user.emailAddresses[0].emailAddress;
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '';
    
    // Séparer les emails par virgule et nettoyer les espaces
    const adminEmailsList = adminEmails
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);

    return adminEmailsList.includes(userEmail.toLowerCase());
  }, [user]);
}

/**
 * Hook pour obtenir les informations d'admin avec plus de détails
 * @returns {object} Objet avec isAdmin, userEmail et adminLevel
 */
export function useAdminInfo() {
  const { user } = useUser();
  const isAdmin = useAdmin();
  
  return useMemo(() => ({
    isAdmin,
    userEmail: user?.emailAddresses?.[0]?.emailAddress || null,
    adminLevel: isAdmin ? 'super_admin' : 'user',
    canAccessCacheMetrics: isAdmin,
    canAccessAdminPanel: isAdmin
  }), [user, isAdmin]);
}
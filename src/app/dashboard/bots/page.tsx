import BotManagementHub from '../components/BotManagementHub';
import { checkAuth } from '@/lib/auth/utils';

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';

export default async function BotsPage() {
  // Server-side auth check
  await checkAuth();
  
  return (
    <div className="space-y-6">
      <BotManagementHub />
    </div>
  );
}
import BotTester from '../components/BotTester';
import { checkAuth } from '@/lib/auth/utils';

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';

export default async function TestPage() {
  // Server-side auth check
  await checkAuth();
  
  return (
    <div>
      <BotTester />
    </div>
  );
}
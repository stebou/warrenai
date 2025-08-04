// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes publiques (pas besoin d'être authentifié)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/privacy-policy(.*)',
  '/about(.*)',
  '/features(.*)',
  '/pricing(.*)',
  '/docs(.*)',
  '/api/webhooks(.*)',
  '/api/stripe/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip authentication for public routes
  if (isPublicRoute(req)) {
    return;
  }

  try {
    // Protect non-public routes
    await auth.protect();
  } catch (error) {
    console.error('Clerk middleware error:', error);
    // Don't throw to prevent infinite redirect loops
    return;
  }
});

export const config = {
  matcher: [
    // Aplique la middleware partout sauf sur les fichiers statiques/_next
    '/((?!_next|[^?]*\\.(?:css|js|png|jpg|jpeg|webp|svg|ico|json)).*)',
    '/(api|trpc)(.*)',
  ],
};
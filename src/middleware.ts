// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes publiques (pas besoin d'être authentifié)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/privacy-policy(.*)',
  '/api/webhooks(.*)', // <--- important : exclut /api/webhooks/user
  '/api/stripe/webhooks(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    // Aplique la middleware partout sauf sur les fichiers statiques/_next
    '/((?!_next|[^?]*\\.(?:css|js|png|jpg|jpeg|webp|svg|ico|json)).*)',
    '/(api|trpc)(.*)',
  ],
};
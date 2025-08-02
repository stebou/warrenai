// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes à laisser publiques
const publicRoutes = createRouteMatcher([
  '/sign-in',
  '/sign-up',
  '/api/webhooks/user' // webhooks publics (pas d'auth automatique)
]);

export default clerkMiddleware(async (auth, req) => {
  if (!publicRoutes(req)) {
    // protège toutes les autres routes (redirige vers sign-in si pas connecté)
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // pattern recommandé : exclut internals et fichiers statiques
    '/((?!_next|_next/static|_next/image|favicon.ico).*)',
    '/(api|trpc)(.*)', // s'assure que les API passent aussi par le middleware si besoin
  ],
};
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/account(.*)',
  '/settings(.*)',
]);

// Define public routes that should NEVER be protected
const isPublicRoute = createRouteMatcher([
  '/api/webhooks(.*)',
  '/api/webhooks/user(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
]);

export default clerkMiddleware((auth, req) => {
  // Explicitly skip authentication for public routes
  if (isPublicRoute(req)) {
    return;
  }
  
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
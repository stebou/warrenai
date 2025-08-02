import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isWebhookRoute = createRouteMatcher(['/api/webhooks/user']);

export default clerkMiddleware((auth, req) => {
  if (!isWebhookRoute(req)) {
    auth.protect(); // protégé par défaut sur toutes les routes
  }
});

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)', // toutes les pages
    '/api/webhooks/(.*)'
  ]
};
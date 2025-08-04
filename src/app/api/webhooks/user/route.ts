// src/app/api/webhooks/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/prisma';

interface ClerkUserPayload {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  primary_email_address_id?: string | null;
  email_addresses?: Array<{ id: string; email_address: string }>;
  external_id?: string | null;
  profile_image_url?: string | null;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const isDev = process.env.NODE_ENV !== 'production';

  let event: any;

  try {
    if (isDev) {
      // En dev, accepte un payload brut (simulateur)
      event = JSON.parse(rawBody);
    } else {
      // En prod, vérification manuelle avec Svix
      const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
      const headers = {
        'svix-id': req.headers.get('svix-id') || '',
        'svix-timestamp': req.headers.get('svix-timestamp') || '',
        'svix-signature': req.headers.get('svix-signature') || '',
      };
      event = wh.verify(rawBody, headers);
    }
  } catch (err) {
    console.error('❌ Invalid webhook signature or malformed body', err);
    return new NextResponse('Invalid signature or body', { status: 400 });
  }

  const eventType: string = event.type;
  const user = event.data as ClerkUserPayload;
  
  console.log('[WEBHOOK] Event received:', { 
    eventType, 
    userId: user?.id, 
    isDev,
    userEmail: user.email_addresses?.[0]?.email_address || 'no-email',
    timestamp: new Date().toISOString()
  });
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('[WEBHOOK] Raw event (dev only):', JSON.stringify(event, null, 2));
  }

  if (!user?.id) {
    console.error('[WEBHOOK] Missing user id in payload', { user, event });
    return new NextResponse('Missing user id', { status: 400 });
  }

  // Resolve email: prefer primary_email_address_id if present
  const emailFromList =
    user.email_addresses?.find(
      (e) => e.id === user.primary_email_address_id
    )?.email_address ?? null;

  try {
    if (eventType === 'user.created' || eventType === 'user.updated') {
      // Upsert covers both create and update, avoiding unique constraint errors
      await prisma.user.upsert({
        where: { clerkId: user.id },
        create: {
          clerkId: user.id,
          email: emailFromList ?? `${user.id}@noemail.temp`,
          firstName: user.first_name ?? undefined,
          lastName: user.last_name ?? undefined,
          imageUrl: user.profile_image_url ?? undefined,
          externalId: user.external_id ?? undefined,
        },
        update: {
          // Only set fields if present to avoid overwriting with undefined/null
          ...(user.first_name !== undefined ? { firstName: user.first_name } : {}),
          ...(user.last_name !== undefined ? { lastName: user.last_name } : {}),
          ...(emailFromList !== null ? { email: emailFromList } : {}),
          ...(user.profile_image_url !== undefined ? { imageUrl: user.profile_image_url } : {}),
          ...(user.external_id !== undefined ? { externalId: user.external_id } : {}),
        },
      });
      console.log(`[WEBHOOK] ✅ User ${user.id} upserted successfully (${eventType})`, {
        email: emailFromList,
        firstName: user.first_name,
        lastName: user.last_name,
        timestamp: new Date().toISOString()
      });
    } else if (eventType === 'user.deleted') {
      await prisma.user.deleteMany({ where: { clerkId: user.id } });
      console.log(`[WEBHOOK] User ${user.id} deleted.`);
    }
  } catch (e) {
    console.error('[WEBHOOK] Prisma operation failed', e);
    return new NextResponse('Database error', { status: 500 });
  }

  return new NextResponse('ok', { status: 200 });
}
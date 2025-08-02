// src/app/api/webhooks/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { prisma } from '@/lib/db'; // attention : export named
// Si tu utilises un export différent, ajuste l'import ci-dessus

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
      // En prod, vérification stricte via Clerk/Svix
      event = verifyWebhook({
        payload: rawBody,
        signature: req.headers.get('svix-signature') ?? '',
        timestamp: req.headers.get('svix-timestamp') ?? '',
        id: req.headers.get('svix-id') ?? '',
        secret: process.env.CLERK_WEBHOOK_SECRET!,
      });
    }
  } catch (err) {
    console.error('❌ Invalid webhook signature or malformed body', err);
    return new NextResponse('Invalid signature or body', { status: 400 });
  }

  const eventType: string = event.type;
  const user = event.data as ClerkUserPayload;

  if (!user?.id) {
    console.error('[WEBHOOK] Missing user id in payload');
    return new NextResponse('Missing user id', { status: 400 });
  }

  // Resolve email: prefer primary_email_address_id if present
  const emailFromList =
    user.email_addresses?.find(
      (e) => e.id === user.primary_email_address_id
    )?.email_address ?? null;

  try {
    if (eventType === 'user.created') {
      // Créer l'utilisateur
      await prisma.user.create({
        data: {
          clerkId: user.id,
          email: emailFromList ?? `${user.id}@noemail.temp`,
          firstName: user.first_name ?? undefined,
          lastName: user.last_name ?? undefined,
          imageUrl: user.profile_image_url ?? undefined,
          externalId: user.external_id ?? undefined,
        },
      });
      console.log(`[WEBHOOK] User ${user.id} created.`);
    } else if (eventType === 'user.updated') {
      // Mise à jour intelligente : on n'envoie pas null pour email si absent
      const updateData: any = {};

      if (user.first_name !== undefined) {
        updateData.firstName = user.first_name;
      }
      if (user.last_name !== undefined) {
        updateData.lastName = user.last_name;
      }
      if (emailFromList !== null) {
        updateData.email = emailFromList;
      }
      if (user.profile_image_url !== undefined) {
        updateData.imageUrl = user.profile_image_url;
      }
      if (user.external_id !== undefined) {
        updateData.externalId = user.external_id;
      }

      await prisma.user.update({
        where: { clerkId: user.id },
        data: updateData,
      });
      console.log(`[WEBHOOK] User ${user.id} updated.`);
    } else if (eventType === 'user.deleted') {
      await prisma.user.deleteMany({
        where: { clerkId: user.id },
      });
      console.log(`[WEBHOOK] User ${user.id} deleted.`);
    }
  } catch (e) {
    console.error('[WEBHOOK] Prisma operation failed', e);
    return new NextResponse('Database error', { status: 500 });
  }

  return new NextResponse('ok', { status: 200 });
}
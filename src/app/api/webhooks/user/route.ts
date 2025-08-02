// Fichier : src/app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Types TypeScript pour les données de mise à jour
interface UserUpdateData {
  name?: string;
  email?: string;
}

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local'
    );
  }

  // Obtenir les en-têtes
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Webhook error: Missing svix headers');
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  const eventType = evt.type;
  console.log(`[CLERK_WEBHOOK] Received event of type: ${eventType}`);
  console.log(`[CLERK_WEBHOOK] Event data:`, JSON.stringify(evt.data, null, 2));

  if (eventType === 'user.created') {
    const {
      id,
      email_addresses,
      first_name,
      last_name,
      primary_email_address_id,
    } = evt.data;

    // Validation améliorée - on vérifie juste l'ID
    if (!id) {
      console.error('[CLERK_WEBHOOK] Missing user ID');
      return new Response('Error: Missing user ID', { status: 400 });
    }

    // Gestion intelligente de l'email
    let userEmail = '';

    if (email_addresses && email_addresses.length > 0) {
      userEmail = email_addresses[0].email_address;
    } else if (primary_email_address_id) {
      // Si email_addresses est vide mais qu'on a un primary_email_address_id,
      // on crée un email temporaire basé sur l'ID Clerk
      userEmail = `user_${id.replace('user_', '')}@temp.clerk`;
      console.log(`[CLERK_WEBHOOK] Using temporary email: ${userEmail}`);
    } else {
      console.error('[CLERK_WEBHOOK] No email found, using fallback');
      userEmail = `${id}@noemail.temp`;
    }

    try {
      const user = await prisma.user.create({
        data: {
          clerkId: id,
          email: userEmail,
          name:
            `${first_name || ''} ${last_name || ''}`.trim() || 'Utilisateur',
          // Ajoutez ici d'autres champs par défaut si nécessaire
          // creditsRemaining: 5,
          // currentPlan: 'free',
        },
      });

      console.log(
        `[CLERK_WEBHOOK] User ${id} created in database successfully:`,
        user
      );
    } catch (dbError) {
      console.error(
        `[CLERK_WEBHOOK] Database error creating user ${id}:`,
        dbError
      );
      return new Response('Database error', { status: 500 });
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    if (!id) {
      return new Response('Error: Missing user ID', { status: 400 });
    }

    try {
      const updateData: UserUpdateData = {
        name: `${first_name || ''} ${last_name || ''}`.trim(),
      };

      // Mise à jour de l'email seulement s'il existe
      if (email_addresses && email_addresses.length > 0) {
        updateData.email = email_addresses[0].email_address;
      }

      const user = await prisma.user.update({
        where: {
          clerkId: id,
        },
        data: updateData,
      });

      console.log(`[CLERK_WEBHOOK] User ${id} updated in database:`, user);
    } catch (dbError) {
      console.error(
        `[CLERK_WEBHOOK] Database error updating user ${id}:`,
        dbError
      );
      return new Response('Database error', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    if (!id) {
      return new Response('Error: Missing user ID', { status: 400 });
    }

    try {
      await prisma.user.deleteMany({
        where: {
          clerkId: id,
        },
      });

      console.log(`[CLERK_WEBHOOK] User ${id} deleted from database.`);
    } catch (dbError) {
      console.error(
        `[CLERK_WEBHOOK] Database error deleting user ${id}:`,
        dbError
      );
      return new Response('Database error', { status: 500 });
    }
  }

  return new Response('Webhook processed successfully', { status: 200 });
}

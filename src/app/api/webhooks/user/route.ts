// src/app/api/webhooks/user/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Disable middleware for this route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  console.log('Webhook received');
  
  try {
    const payload = await req.text();
    const headerList = await headers();
    const headerPayload = Object.fromEntries(headerList.entries());

    console.log('Headers received:', Object.keys(headerPayload));

    if (!WEBHOOK_SECRET) {
      console.error('CLERK_WEBHOOK_SECRET not found');
      return new NextResponse('Webhook secret not configured', { status: 500 });
    }

    const wh = new Webhook(WEBHOOK_SECRET);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let evt: any;

    try {
      evt = wh.verify(payload, headerPayload);
      console.log('Webhook verified successfully, event type:', evt.type);
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return new NextResponse('Webhook verification failed', { status: 400 });
    }

    const { id, email_addresses, first_name, last_name } = evt.data;

    if (evt.type === 'user.created') {
      const email = email_addresses?.[0]?.email_address;
      console.log('Creating user:', { id, email, first_name, last_name });

      try {
        await db.user.upsert({
          where: { clerkId: id },
          update: {},
          create: {
            clerkId: id,
            email,
            name: `${first_name || ''} ${last_name || ''}`.trim(),
          },
        });
        console.log('User created/updated successfully');
      } catch (dbError) {
        console.error('Database error:', dbError);
        return new NextResponse('Database error', { status: 500 });
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// Add GET handler for testing
export async function GET() {
  return new NextResponse('Webhook endpoint is working', { status: 200 });
}
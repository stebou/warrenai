import { Webhook } from 'svix';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  console.log('Webhook received');
  
  const secret = process.env.CLERK_WEBHOOK_SECRET || '';
  
  if (!secret) {
    console.error('CLERK_WEBHOOK_SECRET not found');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  try {
    const payload = await req.text();
    const headerPayload = {
      'svix-id': req.headers.get('svix-id') || '',
      'svix-timestamp': req.headers.get('svix-timestamp') || '',
      'svix-signature': req.headers.get('svix-signature') || '',
    };

    console.log('Headers received:', Object.keys(headerPayload));

    const wh = new Webhook(secret);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let evt: any;
    
    try {
      evt = wh.verify(payload, headerPayload);
      console.log('Webhook verified successfully, event type:', evt.type);
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    const { id, email_addresses, first_name, last_name } = evt.data;

    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const email = email_addresses?.[0]?.email_address;
      console.log(`User ${evt.type}:`, { id, email, first_name, last_name });

      try {
        await db.user.upsert({
          where: { clerkId: id },
          update: {
            email,
            name: `${first_name || ''} ${last_name || ''}`.trim(),
          },
          create: {
            clerkId: id,
            email,
            name: `${first_name || ''} ${last_name || ''}`.trim(),
          },
        });
        console.log('User created/updated successfully');
      } catch (dbError) {
        console.error('Database error:', dbError);
        return new Response('Database error', { status: 500 });
      }
    }

    if (evt.type === 'user.deleted') {
      console.log('Deleting user:', { id });
      
      try {
        await db.user.delete({
          where: { clerkId: id },
        });
        console.log('User deleted successfully');
      } catch (dbError) {
        console.error('Database delete error:', dbError);
        return new Response('Database error', { status: 500 });
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
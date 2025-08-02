// scripts/send-signed-webhook.js
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Webhook } from 'svix';

dotenv.config();

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
  console.error('❌ Missing CLERK_WEBHOOK_SECRET in .env or env');
  process.exit(1);
}

// Tu peux surcharger la cible via env (utile pour ngrok)
const WEBHOOK_TARGET_URL =
  process.env.WEBHOOK_TARGET_URL || 'http://localhost:3001/api/webhooks/user';

// Exemple de payload
const payload = {
  type: 'user.created',
  data: {
    id: `user_test_${Date.now()}`,
    first_name: 'Alice',
    last_name: 'Example',
    email_addresses: [{ id: 'email_1', email_address: 'alice@example.com' }],
    primary_email_address_id: 'email_1',
    external_id: 'ext_123',
    profile_image_url: 'https://example.com/avatar.png',
  },
};

async function main() {
  const bodyString = JSON.stringify(payload);

  let headers;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    const msgId = `msg_${Date.now()}`;
    const timestamp = new Date();
    
    const signature = wh.sign(msgId, timestamp, bodyString);
    
    headers = {
      'svix-id': msgId,
      'svix-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
      'svix-signature': signature,
    };
  } catch (err) {
    console.error('❌ Error signing webhook payload:', err);
    process.exit(1);
  }

  console.log('➡️ Sending signed webhook to', WEBHOOK_TARGET_URL);
  console.log('Headers:', headers);
  console.log('Body:', bodyString);

  try {
    const res = await fetch(WEBHOOK_TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers, // headers contient déjà svix-id, svix-timestamp, svix-signature
      },
      body: bodyString,
    });

    const text = await res.text();
    console.log(`⬅️ Response status: ${res.status}`);
    console.log('⬅️ Response body:', text);
  } catch (err) {
    console.error('❌ Request failed:', err);
  }
}

main();
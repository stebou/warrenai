// scripts/send-signed-webhook.js
import fetch from 'node-fetch';
import { Webhook } from 'svix';

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || 'ton_secret_de_test';

// Exemple de payload simulant un user.created
const payload = {
  type: 'user.created',
  data: {
    id: 'user_signed_test',
    first_name: 'Bob',
    last_name: 'Builder',
    email_addresses: [{ id: 'email_1', email_address: 'bob@example.com' }],
    primary_email_address_id: 'email_1',
    external_id: 'ext_456',
    profile_image_url: 'https://example.com/avatar.png',
  },
};

const wh = new Webhook(WEBHOOK_SECRET);
const body = JSON.stringify(payload);
const headers = wh.sign(body); // génère svix-id, svix-timestamp, svix-signature

(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/webhooks/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    });
    console.log('Status:', res.status);
    console.log('Response:', await res.text());
  } catch (err) {
    console.error('Erreur en envoyant le webhook :', err);
  }
})();
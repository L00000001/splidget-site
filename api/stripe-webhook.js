// POST /api/stripe-webhook
// Stripe calls this directly (not the browser) whenever something happens on
// your account. We only care about one event: checkout.session.completed —
// a real, confirmed payment. On that, we tick the edition counter down by one.
//
// Needs two env vars set in Vercel:
//   STRIPE_SECRET_KEY      — from Stripe dashboard > Developers > API keys
//   STRIPE_WEBHOOK_SECRET  — given to you when you register this endpoint's
//                            URL in Stripe dashboard > Developers > Webhooks
import Stripe from 'stripe';
import { kv } from '@vercel/kv';

// Vercel must hand us the raw, unparsed request body — Stripe's signature
// check fails on anything that's been through a JSON parser first.
export const config = {
  api: { bodyParser: false },
};

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) => chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('stripe-webhook.js: signature check failed —', err.message);
    res.status(400).send('Webhook Error: ' + err.message);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    let count = await kv.get('splidget_count');
    if (count === null || count === undefined) count = 100;
    count = count - 1;
    await kv.set('splidget_count', count);
  }

  res.status(200).json({ received: true });
}

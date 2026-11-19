// GET /api/edition
// Returns the current edition countdown number. Never blocks, never sold out —
// it just reports whatever the counter currently stands at. Starts at 100 the
// first time it's ever asked for, then only moves when stripe-webhook.js
// decrements it on a confirmed payment.
import { kv } from '@vercel/kv';

const START = 100;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  try {
    let count = await kv.get('splidget_count');
    if (count === null || count === undefined) {
      count = START;
      await kv.set('splidget_count', count);
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ count: count });
  } catch (err) {
    console.error('edition.js error:', err);
    res.status(200).json({ count: START, fallback: true });
  }
}

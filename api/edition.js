// GET /api/edition
// Returns the edition number the NEXT confirmed buyer would receive. Rewards
// early adopters — starts at 1 and only ever goes up, by one, on each
// confirmed stripe payment (never sold out, never blocks a purchase; just
// keeps counting).
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  try {
    let sold = await kv.get('splidget_sold');
    if (sold === null || sold === undefined) {
      sold = 0;
      await kv.set('splidget_sold', sold);
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ count: sold + 1 });
  } catch (err) {
    console.error('edition.js error:', err);
    res.status(200).json({ count: 1, fallback: true });
  }
}

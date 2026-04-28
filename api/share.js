// /api/share.js — POST: log share events for viral tracking
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { lead_id, channel, exam_id, total_earnings } = req.body;

    if (!channel || !['whatsapp', 'telegram', 'copy'].includes(channel)) {
      return res.status(400).json({ error: 'Invalid channel' });
    }

    const { error } = await supabase
      .from('share_events')
      .insert([{
        lead_id: lead_id || null,
        channel,
        exam_id: exam_id || null,
        total_earnings: total_earnings || null
      }]);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to log share' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

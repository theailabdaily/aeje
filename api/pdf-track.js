// /api/pdf-track.js — POST: log PDF download events
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
    const { lead_id, exam_id, cpc_mode, city_override, language } = req.body;

    const { error } = await supabase
      .from('pdf_downloads')
      .insert([{
        lead_id: lead_id || null,
        exam_id: exam_id || null,
        cpc_mode: cpc_mode || 'off',
        city_override: city_override || 'auto',
        language: language || 'en'
      }]);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to log PDF download' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

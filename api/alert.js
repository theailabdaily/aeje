// /api/alert.js — POST: subscribe to vacancy notifications
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
    const { lead_id, exam_id, phone, whatsapp_optin } = req.body;

    if (!exam_id || !phone) {
      return res.status(400).json({ error: 'Missing exam_id or phone' });
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone' });
    }

    const { data, error } = await supabase
      .from('vacancy_alerts')
      .insert([{
        lead_id: lead_id || null,
        exam_id,
        phone,
        whatsapp_optin: whatsapp_optin !== false,
        status: 'active'
      }])
      .select('id')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to set alert' });
    }

    return res.status(200).json({ ok: true, alert_id: data.id });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

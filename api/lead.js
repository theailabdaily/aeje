// /api/lead.js — POST: capture quiz completion + contact
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;

    // Basic validation
    if (!body.name || !body.phone || !body.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!/^[6-9]\d{9}$/.test(body.phone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    // Hash IP for privacy-respecting analytics
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const ipHash = crypto.createHash('sha256').update(String(ip)).digest('hex').substring(0, 16);

    const recommendations = body.recommendations || [];
    const topMatch = recommendations[0] || {};

    const lead = {
      name: body.name.trim().substring(0, 100),
      phone: body.phone,
      email: body.email.toLowerCase().trim().substring(0, 200),
      qualification: body.qualification,
      branch: body.branch,
      age: body.age,
      state: body.state,
      relocate: body.relocate,
      attempts: body.attempts,
      hours: body.hours,
      top_match_id: topMatch.id || null,
      top_match_score: topMatch.matchScore || null,
      recommendations: recommendations,
      selected_exam_id: body.selectedExamId || topMatch.id || null,
      language: body.language || 'en',
      ip_hash: ipHash,
      user_agent: (req.headers['user-agent'] || '').substring(0, 500),
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null
    };

    const { data, error } = await supabase
      .from('leads')
      .insert([lead])
      .select('id')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save lead' });
    }

    return res.status(200).json({ ok: true, lead_id: data.id });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

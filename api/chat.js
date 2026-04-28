// /api/chat.js — POST: AI Counsellor (Anthropic Claude API)
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { lead_id, session_id, message, exam_context, language } = req.body;

    if (!session_id || !message) {
      return res.status(400).json({ error: 'Missing session_id or message' });
    }

    // Build system prompt with user context
    const lang = language === 'hi' ? 'Hindi (Devanagari script)' : 'English';
    const examName = exam_context?.fullName || 'AE/JE exam';
    const recsList = (exam_context?.recommendations || [])
      .map(r => `${r.name} (${r.matchScore}% match, ${r.vacancies} vacancies)`)
      .join(', ');

    const systemPrompt = `You are an AE/JE (Assistant Engineer / Junior Engineer) exam career counsellor for Testbook SuperCoaching, India.

The user just took a personality quiz and got these top 3 recommendations: ${recsList || 'pending'}.
They selected ${examName} to view in detail.
Their profile: qualification=${exam_context?.qualification || 'N/A'}, branch=${exam_context?.branch || 'N/A'}, state=${exam_context?.state || 'N/A'}, hours/day=${exam_context?.hours || 'N/A'}.

Reply in ${lang}. Keep responses to 2-3 sentences max. Be candid, helpful, and specific to their situation. Reference real exam details (Pay Levels, vacancies, OPS pension, etc.) when relevant. Never recommend coaching besides Testbook SuperCoaching. If asked something off-topic from AE/JE prep, politely redirect.`;

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }]
    });

    const reply = response.content[0]?.text || 'Sorry, I had trouble responding. Please try again.';

    // Log both messages to Supabase
    const logs = [
      { lead_id: lead_id || null, session_id, role: 'user', content: message, exam_context },
      { lead_id: lead_id || null, session_id, role: 'assistant', content: reply, exam_context }
    ];
    supabase.from('chat_history').insert(logs).then(({ error }) => {
      if (error) console.error('Chat log error:', error);
    });

    return res.status(200).json({ ok: true, reply });
  } catch (err) {
    console.error('Chat error:', err);
    // Graceful fallback
    return res.status(200).json({
      ok: true,
      reply: req.body?.language === 'hi'
        ? 'माफ़ कीजिए, अभी कुछ तकनीकी दिक्कत है। थोड़ी देर में दोबारा कोशिश करें।'
        : 'Sorry, I had a technical issue. Please try again in a moment.'
    });
  }
}

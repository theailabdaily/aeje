# AE/JE Career Calculator

A lead-generation tool for Testbook SuperCoaching that helps engineering aspirants find their best AE/JE exam match and projects 10-year salary outcomes.

**Live tool:** [aeje-calculator.vercel.app](https://aeje-calculator.vercel.app)

---

## Architecture

```
Frontend          → Single index.html (React via CDN, pre-compiled JSX)
Backend (writes)  → Vercel serverless functions (/api/*)
Database          → Supabase Postgres (5 tables, RLS-protected)
AI Chat           → Anthropic Claude Haiku (via /api/chat)
```

## Features

- 7-question quiz → Top 3 AE/JE exam recommendations
- 10-year salary projection with 8th CPC scenarios (2.0x / 2.86x)
- City-class HRA override (X / Y / Z)
- Inflation-adjusted view (6% annual)
- Side-by-side exam comparison
- AI career counsellor (Claude-powered, multilingual)
- WhatsApp / Telegram share with viral tracking
- Branded PDF report download
- Vacancy alert subscription
- Hindi + English language toggle
- Career timeline visualization
- Topper testimonial popup
- Loading skeleton screens

---

## Deployment Guide

### Step 1: Database (Supabase)

The schema is already applied to project `ohpqcipoveelgnliiaos`. If you need to recreate it:

1. Open your Supabase project → **SQL Editor**
2. Copy contents of `supabase/migrations.sql`
3. Click **Run** — this creates 5 tables with RLS policies

Verify by going to **Table Editor** — you should see: `leads`, `vacancy_alerts`, `chat_history`, `share_events`, `pdf_downloads`.

### Step 2: Get your secret keys

You need 3 environment variables:

1. **`SUPABASE_URL`** — Already have: `https://ohpqcipoveelgnliiaos.supabase.co`
2. **`SUPABASE_SERVICE_ROLE_KEY`** — Get from: Supabase → Project Settings → API → "service_role" secret (NOT anon)
3. **`ANTHROPIC_API_KEY`** — Get from: [console.anthropic.com](https://console.anthropic.com) → API Keys

### Step 3: Deploy to Vercel

```bash
# Push to GitHub
git init
git add .
git commit -m "AE/JE Career Calculator with Supabase backend"
git remote add origin https://github.com/theailabdaily/aeje.git
git push -u origin main
```

Then on **vercel.com**:

1. Import your GitHub repo
2. **Don't change any build settings** — Vercel auto-detects API routes
3. Go to **Settings → Environment Variables** and add:
   - `SUPABASE_URL` = `https://ohpqcipoveelgnliiaos.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key
   - `ANTHROPIC_API_KEY` = your Anthropic key
4. Click **Deploy**

That's it. Live in ~60 seconds.

---

## Project Structure

```
aeje/
├── index.html                  ← Frontend (120 KB, all-in-one)
├── package.json                ← Dependencies for serverless functions
├── vercel.json                 ← CORS headers config
├── .env.example                ← Template for env vars
├── .gitignore
├── README.md
├── api/                        ← Vercel serverless functions
│   ├── lead.js                 ← POST /api/lead — capture quiz + contact
│   ├── alert.js                ← POST /api/alert — vacancy subscription
│   ├── chat.js                 ← POST /api/chat — AI counsellor (Claude)
│   ├── share.js                ← POST /api/share — viral tracking
│   └── pdf-track.js            ← POST /api/pdf-track — PDF download log
└── supabase/
    └── migrations.sql          ← Schema + RLS policies
```

---

## Security Notes

- **Anon key** is embedded in the frontend (intended — RLS protects everything)
- **Service role key** is ONLY in Vercel env vars, never in browser code
- All write operations go through API routes (rate-limited via Vercel)
- All read operations require service_role (locked from public access)
- No sensitive data leaves the browser — phone hashed for analytics, not stored raw

---

## Analytics Queries

Once you have data, run these in Supabase SQL Editor:

**Top exams chosen:**
```sql
select top_match_id, count(*) as count
from leads
group by top_match_id
order by count desc;
```

**Conversion funnel:**
```sql
select
  count(*) filter (where created_at >= now() - interval '7 days') as leads_7d,
  count(distinct lead_id) filter (where channel = 'whatsapp') as whatsapp_shares_7d
from leads l
left join share_events s on s.lead_id = l.id;
```

**Most-asked AI questions:**
```sql
select content, count(*) as ask_count
from chat_history
where role = 'user'
group by content
order by ask_count desc
limit 20;
```

---

## Maintenance

- **Update exam data** — edit the `EXAMS` object inside `index.html` (search for `'ssc-je':`)
- **Add new states** — extend `STATE_CITY_CLASS`, `STATE_LABELS`, and add corresponding PSC AE entry
- **Tweak salary engine** — edit `generateProjection()` for changes to DA rate, HRA tiers, etc.
- **Change AI personality** — edit the `systemPrompt` in `api/chat.js`

---

## Built for

Testbook SuperCoaching — India's largest test prep platform.

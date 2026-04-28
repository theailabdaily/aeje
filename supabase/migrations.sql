-- ============================================================
-- AE/JE Career Calculator — Supabase Schema
-- Run this once if recreating the database from scratch.
-- (Already applied to project ohpqcipoveelgnliiaos)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- LEADS — captures every quiz completion + contact
-- ============================================================
create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  email text not null,
  qualification text,
  branch text,
  age text,
  state text,
  relocate text,
  attempts text,
  hours text,
  top_match_id text,
  top_match_score int,
  recommendations jsonb,
  selected_exam_id text,
  language text default 'en',
  ip_hash text,
  user_agent text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_leads_phone on public.leads(phone);
create index idx_leads_email on public.leads(email);
create index idx_leads_created on public.leads(created_at desc);
create index idx_leads_top_match on public.leads(top_match_id);

-- ============================================================
-- VACANCY ALERTS
-- ============================================================
create table public.vacancy_alerts (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete cascade,
  exam_id text not null,
  phone text not null,
  whatsapp_optin boolean default true,
  status text default 'active' check (status in ('active', 'unsubscribed', 'fired')),
  created_at timestamptz default now(),
  fired_at timestamptz
);

create index idx_alerts_exam on public.vacancy_alerts(exam_id);
create index idx_alerts_phone on public.vacancy_alerts(phone);
create index idx_alerts_status on public.vacancy_alerts(status);

-- ============================================================
-- CHAT HISTORY — AI counsellor messages
-- ============================================================
create table public.chat_history (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete cascade,
  session_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  exam_context jsonb,
  created_at timestamptz default now()
);

create index idx_chat_session on public.chat_history(session_id);
create index idx_chat_lead on public.chat_history(lead_id);

-- ============================================================
-- SHARE EVENTS — viral tracking
-- ============================================================
create table public.share_events (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'telegram', 'copy')),
  exam_id text,
  total_earnings bigint,
  created_at timestamptz default now()
);

create index idx_share_lead on public.share_events(lead_id);
create index idx_share_channel on public.share_events(channel);

-- ============================================================
-- PDF DOWNLOADS
-- ============================================================
create table public.pdf_downloads (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete cascade,
  exam_id text,
  cpc_mode text,
  city_override text,
  language text,
  created_at timestamptz default now()
);

create index idx_pdf_lead on public.pdf_downloads(lead_id);

-- ============================================================
-- AUTO-UPDATE TIMESTAMP
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Strategy: anon key can INSERT, cannot SELECT/UPDATE/DELETE
-- All reads happen via service_role from Vercel API routes
-- ============================================================

-- LEADS
alter table public.leads enable row level security;
create policy "anon can insert leads" on public.leads for insert to anon with check (true);
create policy "anon cannot read leads" on public.leads for select to anon using (false);

-- VACANCY ALERTS
alter table public.vacancy_alerts enable row level security;
create policy "anon can insert alerts" on public.vacancy_alerts for insert to anon with check (true);
create policy "anon cannot read alerts" on public.vacancy_alerts for select to anon using (false);

-- CHAT HISTORY
alter table public.chat_history enable row level security;
create policy "anon can insert chat" on public.chat_history for insert to anon with check (true);
create policy "anon cannot read chat" on public.chat_history for select to anon using (false);

-- SHARE EVENTS
alter table public.share_events enable row level security;
create policy "anon can insert shares" on public.share_events for insert to anon with check (true);
create policy "anon cannot read shares" on public.share_events for select to anon using (false);

-- PDF DOWNLOADS
alter table public.pdf_downloads enable row level security;
create policy "anon can insert pdfs" on public.pdf_downloads for insert to anon with check (true);
create policy "anon cannot read pdfs" on public.pdf_downloads for select to anon using (false);

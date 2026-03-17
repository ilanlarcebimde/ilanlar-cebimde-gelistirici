-- Akilli vize danismanligi wizard tablolari + storage bucket

create table if not exists public.visa_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text,
  phone text,
  whatsapp text,
  email text,
  age integer,
  city text,
  nationality text,
  visa_type text,
  target_country text,
  application_goal text,
  application_timeline text,
  profession text,
  experience_years integer,
  abroad_experience boolean,
  language_level text,
  has_cv boolean,
  has_job_offer boolean,
  travel_duration text,
  has_invitation boolean,
  has_accommodation_plan boolean,
  family_relation text,
  spouse_country text,
  official_marriage boolean,
  spouse_residency_status text,
  school_acceptance boolean,
  school_program text,
  education_budget text,
  unsure_reason text,
  passport_status text,
  passport_validity text,
  previous_refusal boolean,
  budget_ready boolean,
  can_follow_process boolean,
  preferred_contact_channel text,
  support_need text,
  consultant_note_for_call text,
  consent_data_share boolean not null default false,
  consent_contact boolean not null default false,
  consent_accuracy boolean not null default false,
  lead_score integer not null default 0,
  lead_status text not null default 'new',
  assigned_company_id uuid null,
  assigned_at timestamptz null
);

create table if not exists public.visa_companies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_name text,
  contact_person text,
  email text,
  whatsapp text,
  supported_visa_types text[] not null default '{}'::text[],
  supported_countries text[] not null default '{}'::text[],
  is_active boolean not null default true
);

create table if not exists public.visa_lead_files (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid not null references public.visa_leads(id) on delete cascade,
  file_type text not null,
  file_name text not null,
  file_path text not null,
  mime_type text,
  file_size bigint
);

create table if not exists public.visa_lead_assignments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid not null references public.visa_leads(id) on delete cascade,
  company_id uuid not null references public.visa_companies(id) on delete cascade,
  assignment_status text,
  sent_channel text,
  response_note text
);

alter table public.visa_leads
  add constraint visa_leads_lead_status_check
  check (lead_status in ('new', 'weak', 'low', 'warm', 'hot'));

alter table public.visa_leads
  add constraint visa_leads_visa_type_check
  check (visa_type in ('work', 'tourist', 'family', 'student', 'unsure'));

alter table public.visa_leads
  add constraint visa_leads_contact_channel_check
  check (preferred_contact_channel in ('whatsapp', 'phone', 'email'));

create index if not exists idx_visa_leads_created_at on public.visa_leads(created_at desc);
create index if not exists idx_visa_leads_status on public.visa_leads(lead_status);
create index if not exists idx_visa_leads_visa_type on public.visa_leads(visa_type);
create index if not exists idx_visa_lead_files_lead_id on public.visa_lead_files(lead_id);
create index if not exists idx_visa_lead_assignments_lead_id on public.visa_lead_assignments(lead_id);
create index if not exists idx_visa_lead_assignments_company_id on public.visa_lead_assignments(company_id);

alter table public.visa_leads enable row level security;
alter table public.visa_lead_files enable row level security;
alter table public.visa_companies enable row level security;
alter table public.visa_lead_assignments enable row level security;

drop policy if exists "visa_leads_insert_public" on public.visa_leads;
create policy "visa_leads_insert_public"
  on public.visa_leads for insert
  with check (true);

drop policy if exists "visa_lead_files_insert_public" on public.visa_lead_files;
create policy "visa_lead_files_insert_public"
  on public.visa_lead_files for insert
  with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'visa-lead-files',
  'visa-lead-files',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

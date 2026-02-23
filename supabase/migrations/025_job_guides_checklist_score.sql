-- job_guides: deterministik checklist + skor + risk seviyesi (yolwise tarzı panel)
alter table public.job_guides
  add column if not exists checklist_json jsonb not null default '{}'::jsonb,
  add column if not exists score int,
  add column if not exists risk_level text check (risk_level is null or risk_level in ('low','medium','high'));

comment on column public.job_guides.checklist_json is 'Deterministik checklist anlık durumu (opsiyonel persist).';
comment on column public.job_guides.score is 'Gemini uygunluk skoru 0-100.';
comment on column public.job_guides.risk_level is 'Gemini risk seviyesi: low, medium, high.';

-- job_guide_events: yeni event tipleri
alter table public.job_guide_events
  drop constraint if exists job_guide_events_type_check;

alter table public.job_guide_events
  add constraint job_guide_events_type_check
  check (type in ('question','answer','system','report_update','checklist_update','error'));

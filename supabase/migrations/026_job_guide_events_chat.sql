-- Chat tabanlı sohbet için event tipleri
alter table public.job_guide_events
  drop constraint if exists job_guide_events_type_check;

alter table public.job_guide_events
  add constraint job_guide_events_type_check
  check (type in (
    'question','answer','system','report_update','checklist_update','error',
    'user_message','assistant_message'
  ));

comment on column public.job_guide_events.content is 'Metin veya JSON; user_message/assistant_message için mesaj metni veya next_questions JSON.';

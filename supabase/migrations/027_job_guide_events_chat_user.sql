-- chat_user / chat_assistant event tipleri (sohbet logu)
alter table public.job_guide_events
  drop constraint if exists job_guide_events_type_check;

alter table public.job_guide_events
  add constraint job_guide_events_type_check
  check (type in (
    'question','answer','system','report_update','checklist_update','error',
    'user_message','assistant_message','chat_user','chat_assistant'
  ));

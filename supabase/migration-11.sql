-- ============================================================
-- Omniscale — Migration 11 : pg_cron pour sync iClosed
-- ============================================================
-- Le webhook iClosed ne fire jamais (free tier broken). On bypass
-- en pollant directement leur API REST toutes les 5 minutes.
-- Même pattern que migration-9 (LinkedIn cron).

-- 1. Active les extensions (idempotent — déjà actives via migration-9)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. (Re)programme le job. Schedule "*/5 * * * *" = toutes les 5 min.
do $$
declare
  job_id bigint;
begin
  select jobid into job_id from cron.job where jobname = 'sync_iclosed_bookings';
  if job_id is not null then
    perform cron.unschedule(job_id);
  end if;
end$$;

select cron.schedule(
  'sync_iclosed_bookings',
  '*/5 * * * *',
  $body$
    select net.http_get(
      url := 'https://www.omniscale.fr/api/cron/sync-iclosed-bookings',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer cba538bc68680db19a8c4ba4f824e33fbbb011b6ebca5e33d3607e02fe595212'
      ),
      timeout_milliseconds := 50000
    );
  $body$
);

-- 3. Vérification : voir tous les jobs cron actifs
-- select jobid, jobname, schedule, command, active from cron.job;

-- 4. Vérification des dernières exécutions :
-- select jobid, status, start_time, end_time, return_message
-- from cron.job_run_details
-- where jobid in (select jobid from cron.job where jobname = 'sync_iclosed_bookings')
-- order by start_time desc limit 10;

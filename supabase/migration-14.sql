-- ============================================================
-- Omniscale — Migration 14 : pg_cron pour publication X programmée
-- ============================================================
-- Mirror exact de migration-9 (LinkedIn). Toutes les 5 minutes,
-- appelle /api/cron/x-publish-due qui publie les tweets dont
-- scheduled_at <= now().

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  job_id bigint;
begin
  select jobid into job_id from cron.job where jobname = 'x_publish_due';
  if job_id is not null then
    perform cron.unschedule(job_id);
  end if;
end$$;

select cron.schedule(
  'x_publish_due',
  '*/5 * * * *',
  $body$
    select net.http_get(
      url := 'https://www.omniscale.fr/api/cron/x-publish-due',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer cba538bc68680db19a8c4ba4f824e33fbbb011b6ebca5e33d3607e02fe595212'
      ),
      timeout_milliseconds := 30000
    );
  $body$
);

-- Vérification :
-- select jobid, jobname, schedule, command, active from cron.job;
-- select * from cron.job_run_details where jobid in
--   (select jobid from cron.job where jobname = 'x_publish_due')
-- order by start_time desc limit 10;

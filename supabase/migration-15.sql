-- ============================================================
-- Omniscale — Migration 15 : Fix URL canonique pour cron LinkedIn
-- ============================================================
-- Bug : migration-9 appelait https://omniscale.fr/... qui renvoie un
-- 307 vers https://www.omniscale.fr/... — pg_net ne follow pas les
-- redirects par défaut, donc le cron LinkedIn échouait silencieusement
-- toutes les 5 minutes depuis sa création (les posts programmés ne
-- partaient jamais à l'heure).
--
-- Fix : ré-schedule avec l'URL canonique (www + trailing slash) qui
-- répond direct en 200.

do $$
declare
  job_id bigint;
begin
  select jobid into job_id from cron.job where jobname = 'linkedin_publish_due';
  if job_id is not null then
    perform cron.unschedule(job_id);
  end if;
end$$;

select cron.schedule(
  'linkedin_publish_due',
  '*/5 * * * *',
  $body$
    select net.http_get(
      url := 'https://www.omniscale.fr/api/cron/linkedin-publish-due/',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer cba538bc68680db19a8c4ba4f824e33fbbb011b6ebca5e33d3607e02fe595212'
      ),
      timeout_milliseconds := 30000
    );
  $body$
);

-- Bonus : pareil pour le cron X (migration-14 a la bonne URL déjà,
-- mais on vérifie au cas où).
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
      url := 'https://www.omniscale.fr/api/cron/x-publish-due/',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer cba538bc68680db19a8c4ba4f824e33fbbb011b6ebca5e33d3607e02fe595212'
      ),
      timeout_milliseconds := 30000
    );
  $body$
);

-- Bonus 2 : pareil pour le cron iClosed bookings (migration-11).
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
      url := 'https://www.omniscale.fr/api/cron/sync-iclosed-bookings/',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer cba538bc68680db19a8c4ba4f824e33fbbb011b6ebca5e33d3607e02fe595212'
      ),
      timeout_milliseconds := 50000
    );
  $body$
);

-- Vérification :
-- select jobid, jobname, schedule, command, active from cron.job;

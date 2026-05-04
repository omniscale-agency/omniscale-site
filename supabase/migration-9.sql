-- ============================================================
-- Omniscale — Migration 9 : Cron pg_cron pour publication LinkedIn
-- ============================================================
-- Vercel Cron est payant (Pro $20/mois). À la place on utilise
-- pg_cron + pg_net (extensions Supabase gratuites) pour appeler
-- notre endpoint /api/cron/linkedin-publish-due toutes les 5 min.

-- 1. Active les extensions (idempotent)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. (Re)programme le job. Schedule "*/5 * * * *" = toutes les 5 min.
--    Si le job existe déjà, on l'unschedule d'abord pour permettre les updates.
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
      url := 'https://omniscale.fr/api/cron/linkedin-publish-due',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || current_setting('app.cron_secret', true)
      ),
      timeout_milliseconds := 30000
    );
  $body$
);

-- 3. CRON_SECRET stocké comme settings DB (lu par le job ci-dessus).
--    À exécuter UNE FOIS — si tu changes le secret, ré-exécute juste cette ligne.
--    Remplace la valeur ci-dessous par celle que tu as mise dans Vercel.
alter database postgres set app.cron_secret = 'cba538bc68680db19a8c4ba4f824e33fbbb011b6ebca5e33d3607e02fe595212';

-- 4. Vérification : voir les jobs cron actifs
-- select * from cron.job;
-- 5. Vérification des dernières exécutions :
-- select * from cron.job_run_details order by start_time desc limit 10;

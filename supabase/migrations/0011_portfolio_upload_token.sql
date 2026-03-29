-- Secret presented by the browser after submit to authorize portfolio file prepare/finalize (not guessable from application id alone).

alter table public.applications
  add column if not exists portfolio_upload_token uuid;

comment on column public.applications.portfolio_upload_token is 'Opaque token returned once after submit; required for portfolio upload prepare/finalize APIs.';

create unique index if not exists applications_portfolio_upload_token_key
  on public.applications (portfolio_upload_token)
  where portfolio_upload_token is not null;

alter table public.applications
  add column if not exists applicant_confirmation_email_sent boolean not null default false,
  add column if not exists applicant_confirmation_email_sent_at timestamptz,
  add column if not exists applicant_confirmation_email_error text;

comment on column public.applications.applicant_confirmation_email_sent is 'Resend delivery of thank-you email to the applicant (contact email).';
comment on column public.applications.applicant_confirmation_email_error is 'Last Resend error for applicant confirmation email, if any.';

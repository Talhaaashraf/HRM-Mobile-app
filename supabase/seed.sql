-- ═══════════════════════════════════════════════════════════════════════════
-- LOCAL TESTING ONLY — loaded by `npx supabase start` / `npx supabase db reset`
-- after schema.sql. Do NOT run this on your real (cloud) project.
--
-- Demo logins (password for both: password123)
--   Recruiter panel:  recruiter@demo.com
--   Job Finder panel: jobfinder@demo.com
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function pg_temp.demo_user(p_id uuid, p_email text, p_meta jsonb)
returns void language plpgsql as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt('password123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', p_meta, now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text,
          jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
          'email', now(), now(), now());
end $$;

select pg_temp.demo_user('aaaaaaaa-0000-0000-0000-000000000001', 'recruiter@demo.com',
  '{"role":"recruiter","full_name":"Rita Recruiter","company_name":"Acme Tech"}');
select pg_temp.demo_user('bbbbbbbb-0000-0000-0000-000000000002', 'jobfinder@demo.com',
  '{"role":"candidate","full_name":"Jamal Jobfinder"}');

insert into public.jobs (recruiter_id, title, company_name, location, type, description, requirements, salary_range, created_at) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'React Native developer', 'Acme Tech', 'Remote', 'technical',
   'Build and ship our iOS and Android apps with React Native and Expo.',
   '{"2+ years React Native","TypeScript","Published an app to a store"}', '250k – 350k PKR / month', now() - interval '2 days'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Backend engineer (Node.js)', 'Acme Tech', 'Lahore', 'technical',
   'Design APIs and data models for our recruitment platform.',
   '{"Node.js","PostgreSQL","REST API design"}', '300k – 400k PKR / month', now() - interval '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'HR business partner', 'Acme Tech', 'Karachi', 'non_technical',
   'Partner with team leads on hiring, onboarding and employee relations.',
   '{"3+ years HR experience","Excellent communication"}', null, now() - interval '5 hours'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Marketing coordinator', 'Acme Tech', 'Islamabad', 'non_technical',
   'Plan campaigns and manage our social media channels.',
   '{"Social media marketing","Copywriting"}', '120k PKR / month', now() - interval '1 hour');

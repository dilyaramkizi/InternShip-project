BEGIN;

-- Accounts: one profile per auth user. Role is fixed at signup by the trigger below and never updated by clients.
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  role text NOT NULL CHECK (role IN ('student','company')),
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '' CHECK (length(full_name) <= 120),
  is_pilot boolean NOT NULL DEFAULT false,
  CHECK (role <> 'student' OR lower(email) LIKE '%@narxoz.kz')
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());

-- Students sign up with @narxoz.kz only. Google sign-ins carry no role, so the email domain decides.
-- Pilot signups (pilot_submissions, student/signup) are linked by email: their name pre-fills and is_pilot is set.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text := lower(coalesce(NEW.email, ''));
  v_role text := coalesce(NEW.raw_user_meta_data->>'role', CASE WHEN v_email LIKE '%@narxoz.kz' THEN 'student' ELSE 'company' END);
  v_pilot_name text;
BEGIN
  IF v_role NOT IN ('student','company') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  IF v_role = 'student' AND v_email NOT LIKE '%@narxoz.kz' THEN
    RAISE EXCEPTION 'Students must register with a @narxoz.kz email';
  END IF;
  SELECT details->>'full_name' INTO v_pilot_name FROM public.pilot_submissions
    WHERE lower(email) = v_email AND audience = 'student' AND kind = 'signup'
    ORDER BY created_at DESC LIMIT 1;
  INSERT INTO public.profiles (id, role, email, full_name, is_pilot)
  VALUES (
    NEW.id, v_role, v_email,
    left(coalesce(nullif(NEW.raw_user_meta_data->>'full_name', ''), nullif(NEW.raw_user_meta_data->>'name', ''), v_pilot_name, ''), 120),
    v_role = 'student' AND EXISTS (SELECT 1 FROM public.pilot_submissions WHERE lower(email) = v_email AND audience = 'student')
  );
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Companies. A company is managed by its owner_id, or by whoever confirms the email in company_claims
-- (used for companies the team onboarded before they had an account, e.g. Magnum).
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
  website text NOT NULL DEFAULT '' CHECK (length(website) <= 200),
  city text NOT NULL DEFAULT 'Almaty' CHECK (length(city) <= 80),
  verified boolean NOT NULL DEFAULT false
);
CREATE TABLE public.company_claims (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL
);
ALTER TABLE public.company_claims ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.company_claims TO service_role;

CREATE OR REPLACE FUNCTION public.is_company_member(cid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = cid AND c.owner_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_claims cc JOIN auth.users u ON u.id = auth.uid()
      WHERE cc.company_id = cid AND lower(cc.email) = lower(u.email) AND u.email_confirmed_at IS NOT NULL
    );
$$;
CREATE OR REPLACE FUNCTION public.my_company_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id FROM public.companies c WHERE public.is_company_member(c.id) ORDER BY c.created_at LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.my_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.is_company_member(uuid), public.my_company_id(), public.my_role() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid), public.my_company_id(), public.my_role() TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users browse companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Company accounts create their company" ON public.companies FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND verified = false AND public.my_role() = 'company' AND public.my_company_id() IS NULL);
CREATE POLICY "Members edit their company" ON public.companies FOR UPDATE TO authenticated
  USING (public.is_company_member(id)) WITH CHECK (public.is_company_member(id));
-- verified is set by the team only.
CREATE OR REPLACE FUNCTION public.keep_company_verified() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_user = 'authenticated' THEN NEW.verified := OLD.verified; NEW.owner_id := OLD.owner_id; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER companies_keep_verified BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.keep_company_verified();

CREATE TABLE public.internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  department text NOT NULL DEFAULT '' CHECK (length(department) <= 160),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 4000),
  tasks text NOT NULL DEFAULT '' CHECK (length(tasks) <= 4000),
  requirements text NOT NULL DEFAULT '' CHECK (length(requirements) <= 4000),
  stack text NOT NULL DEFAULT '' CHECK (length(stack) <= 400),
  format text NOT NULL DEFAULT 'office' CHECK (format IN ('office','hybrid','remote')),
  location text NOT NULL DEFAULT 'Almaty' CHECK (length(location) <= 160),
  pay text NOT NULL DEFAULT '' CHECK (length(pay) <= 120),
  slots integer NOT NULL DEFAULT 1 CHECK (slots BETWEEN 1 AND 100),
  duration text NOT NULL DEFAULT '' CHECK (length(duration) <= 120),
  deadline date,
  contact text NOT NULL DEFAULT '' CHECK (length(contact) <= 200),
  paperwork boolean NOT NULL DEFAULT true,
  is_open boolean NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internships TO authenticated;
GRANT ALL ON public.internships TO service_role;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students browse open internships, members see their own" ON public.internships FOR SELECT TO authenticated
  USING (is_open OR public.is_company_member(company_id));
CREATE POLICY "Members add internships" ON public.internships FOR INSERT TO authenticated WITH CHECK (public.is_company_member(company_id));
CREATE POLICY "Members edit internships" ON public.internships FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id)) WITH CHECK (public.is_company_member(company_id));
CREATE POLICY "Members delete internships" ON public.internships FOR DELETE TO authenticated USING (public.is_company_member(company_id));

-- One CV per student.
CREATE TABLE public.student_cvs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL DEFAULT '' CHECK (length(full_name) <= 120),
  program text NOT NULL DEFAULT '' CHECK (length(program) <= 120),
  year integer CHECK (year BETWEEN 1 AND 6),
  phone text NOT NULL DEFAULT '' CHECK (length(phone) <= 40),
  telegram text NOT NULL DEFAULT '' CHECK (length(telegram) <= 60),
  headline text NOT NULL DEFAULT '' CHECK (length(headline) <= 160),
  summary text NOT NULL DEFAULT '' CHECK (length(summary) <= 2000),
  skills text NOT NULL DEFAULT '' CHECK (length(skills) <= 1000),
  experience text NOT NULL DEFAULT '' CHECK (length(experience) <= 4000),
  projects text NOT NULL DEFAULT '' CHECK (length(projects) <= 4000),
  education text NOT NULL DEFAULT '' CHECK (length(education) <= 2000),
  languages text NOT NULL DEFAULT '' CHECK (length(languages) <= 300),
  links text NOT NULL DEFAULT '' CHECK (length(links) <= 600),
  gpa numeric(3,2) CHECK (gpa BETWEEN 0 AND 4)
);

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Sent' CHECK (status IN ('Sent','Viewed','Interview','Offer','Declined')),
  UNIQUE (internship_id, student_id)
);

GRANT SELECT, INSERT, UPDATE ON public.student_cvs TO authenticated;
GRANT ALL ON public.student_cvs TO service_role;
ALTER TABLE public.student_cvs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own CV" ON public.student_cvs FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND public.my_role() = 'student');
CREATE POLICY "Companies read applicants' CVs" ON public.student_cvs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.internships i ON i.id = a.internship_id
                 WHERE a.student_id = student_cvs.user_id AND public.is_company_member(i.company_id)));

GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own applications" ON public.applications FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Students apply with a CV to open internships" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND status = 'Sent' AND public.my_role() = 'student'
    AND EXISTS (SELECT 1 FROM public.student_cvs c WHERE c.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.internships i WHERE i.id = internship_id AND i.is_open));
CREATE POLICY "Companies see applications to their internships" ON public.applications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.internships i WHERE i.id = internship_id AND public.is_company_member(i.company_id)));
CREATE POLICY "Companies update application status" ON public.applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.internships i WHERE i.id = internship_id AND public.is_company_member(i.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.internships i WHERE i.id = internship_id AND public.is_company_member(i.company_id)));
CREATE POLICY "Companies read applicants' profiles" ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.internships i ON i.id = a.internship_id
                 WHERE a.student_id = profiles.id AND public.is_company_member(i.company_id)));
-- Companies may change status only.
REVOKE UPDATE ON public.applications FROM authenticated;
GRANT UPDATE (status) ON public.applications TO authenticated;

-- First pilot company. Add the hiring contact's email to company_claims so they can manage it:
-- INSERT INTO public.company_claims (company_id, email) VALUES ('8f6b0c1e-6a43-4d0a-9a51-1f1c3a7a9b01', '<contact email>');
INSERT INTO public.companies (id, name, description, website, city, verified) VALUES (
  '8f6b0c1e-6a43-4d0a-9a51-1f1c3a7a9b01', 'Magnum Cash&Carry',
  'Kazakhstan''s largest food retail chain. The Corporate Data Warehouse (KHD) team is building a Lakehouse platform on S3 (MinIO), Apache Spark and high-performance OLAP engines (StarRocks/Trino).',
  'https://magnum.kz', 'Almaty', true
);
INSERT INTO public.internships (company_id, title, department, description, tasks, requirements, stack, format, location, pay, slots, contact) VALUES (
  '8f6b0c1e-6a43-4d0a-9a51-1f1c3a7a9b01', 'Data Engineering Intern (Corporate Data Warehouse)', 'Corporate Data Warehouse (KHD)',
  'We are developing a Lakehouse approach and looking for interns who want to work at the intersection of DWH, Data Lake and Analytics, and take part in building the company''s modern data architecture. We don''t just maintain existing solutions — we are building a new platform: rolling out S3 storage (MinIO), moving to Apache Spark and modern high-performance OLAP engines (StarRocks/Trino). Hands-on experience with a modern stack, real projects, and a say in how the company works with data.',
  'Take part in building the Lakehouse platform: data pipelines, S3 (MinIO) storage, Apache Spark jobs, OLAP models in StarRocks/Trino.',
  'Interest in data engineering, DWH and analytics. SQL; Python is a plus.',
  'SQL, Python, Apache Spark, MinIO, S3, StarRocks, Trino, DWH, Data Lake',
  'office', 'Almaty, Astana 1 microdistrict, 10', '', 1,
  'Natalia Trebukhova, Senior Recruitment Specialist'
);

-- Anonymous product events (no emails or names, same as the landing events).
ALTER TABLE public.landing_events DROP CONSTRAINT IF EXISTS landing_events_event_check;
ALTER TABLE public.landing_events ADD CONSTRAINT landing_events_event_check CHECK (event IN ('page_view','toggle_switch','cta_click','email_submit','listing_form_start','listing_form_submit','call_booked','faq_open','call_requested','section_view','lang_switch','account_sign_up','account_sign_in','cv_saved','apply_submit','internship_created'));

COMMIT;

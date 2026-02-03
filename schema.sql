-- =================================================================
--
--  Syrian Center for Science (SCS) - Supabase Database Schema
--  Version: 1.1
--  Author: Senior Database Architect & Security Engineer
--  Date: 2024-07-28
--
--  This script creates the complete, production-ready schema for the SCS platform.
--  It is designed to be executed directly in the Supabase SQL Editor.
--  The schema adheres to the principles of STEP 1 (Educational Identity),
--  STEP 2 (System Architecture), and STEP 3 (Approved Schema Design).
--
--  Execution Order:
--  1.  Extensions & Global Setup
--  2.  Custom Types (ENUMs)
--  3.  Table Creation (Dependency-safe order)
--  4.  Timestamp Triggers
--  5.  Indexes for Performance
--  6.  Row-Level Security (RLS) Policies
--
-- =================================================================

-- =================================================================
-- SECTION 1: EXTENSIONS & GLOBAL SETUP
-- =================================================================
-- Enable UUID generation functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Create a function to automatically handle 'updated_at' timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =================================================================
-- SECTION 2: CUSTOM TYPES (ENUMS)
-- =================================================================
CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE public.difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.lesson_type AS ENUM ('theory', 'simulation', 'mixed');
CREATE TYPE public.progress_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE public.question_type AS ENUM ('mcq', 'numeric', 'open_ended');
CREATE TYPE public.ai_context_type AS ENUM ('lesson_explanation', 'question_feedback', 'general_chat');
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'expired');
CREATE TYPE public.payment_status AS ENUM ('pending', 'succeeded', 'failed');
CREATE TYPE public.file_type AS ENUM ('video', 'pdf', 'image', 'simulation_asset');

-- =================================================================
-- SECTION 3: TABLE CREATION
-- =================================================================

-- ---------------------------------
-- USER & IDENTITY LAYER
-- ---------------------------------
CREATE TABLE public.users (
  id uuid NOT NULL PRIMARY KEY DEFAULT auth.uid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role public.user_role NOT NULL DEFAULT 'student',
  grade_level integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_profiles (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  avatar_url text,
  preferences jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------
-- ACADEMIC STRUCTURE LAYER
-- ---------------------------------
CREATE TABLE public.subjects (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.courses (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  grade_level integer NOT NULL,
  title text NOT NULL,
  description text,
  difficulty_level public.difficulty_level,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.modules (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lessons (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  concept_summary text,
  estimated_time_minutes integer,
  lesson_type public.lesson_type NOT NULL DEFAULT 'theory',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------
-- ACADEMIC RELATIONSHIP LAYER
-- ---------------------------------
CREATE TABLE public.teacher_courses (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teacher_courses_unique UNIQUE (teacher_id, course_id)
);

-- ---------------------------------
-- LEARNING & PROGRESS LAYER
-- ---------------------------------
CREATE TABLE public.lesson_progress (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  status public.progress_status NOT NULL DEFAULT 'not_started',
  time_spent_seconds integer NOT NULL DEFAULT 0,
  last_accessed timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE public.concept_mastery (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  concept_tag text NOT NULL,
  mastery_score integer NOT NULL DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
  last_updated timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, concept_tag)
);

-- ---------------------------------
-- ASSESSMENT LAYER
-- ---------------------------------
CREATE TABLE public.questions (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  question_type public.question_type NOT NULL,
  difficulty integer NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
  content jsonb NOT NULL,
  correct_answer text, -- Should be encrypted in a real application
  concept_tags text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Forward declaration for circular dependency
CREATE TABLE public.ai_responses (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()
);

CREATE TABLE public.student_answers (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  answer_content text NOT NULL,
  is_correct boolean,
  ai_feedback_id uuid REFERENCES public.ai_responses(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------
-- AI GOVERNANCE LAYER
-- ---------------------------------
CREATE TABLE public.ai_requests (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  context_type public.ai_context_type NOT NULL,
  context_id text,
  prompt_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Now fully define ai_responses
ALTER TABLE public.ai_responses
  ADD COLUMN request_id uuid NOT NULL REFERENCES public.ai_requests(id) ON DELETE CASCADE,
  ADD COLUMN response_content jsonb NOT NULL,
  ADD COLUMN confidence_score real,
  ADD COLUMN is_validated_by_human boolean NOT NULL DEFAULT false,
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();


-- ---------------------------------
-- FINANCIAL SYSTEM LAYER
-- ---------------------------------
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  price numeric(10, 2) NOT NULL,
  currency varchar(3) NOT NULL,
  duration_days integer NOT NULL,
  features jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status public.subscription_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  subscription_id uuid REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  amount numeric(10, 2) NOT NULL,
  currency varchar(3) NOT NULL,
  payment_provider_txn_id text UNIQUE,
  status public.payment_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------
-- CONTENT STORAGE & AUDIT/ANALYTICS
-- ---------------------------------
CREATE TABLE public.files (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_type public.file_type NOT NULL,
  storage_path text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.learning_analytics (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  metric text NOT NULL,
  value double precision NOT NULL,
  context jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =================================================================
-- SECTION 4: TIMESTAMP TRIGGERS
-- =================================================================
-- Create a trigger for each table to auto-update the 'updated_at' column
CREATE TRIGGER on_users_update BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_user_profiles_update BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_subjects_update BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_courses_update BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_modules_update BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_lessons_update BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_teacher_courses_update BEFORE UPDATE ON public.teacher_courses FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_lesson_progress_update BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_concept_mastery_update BEFORE UPDATE ON public.concept_mastery FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_questions_update BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_student_answers_update BEFORE UPDATE ON public.student_answers FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_ai_requests_update BEFORE UPDATE ON public.ai_requests FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_ai_responses_update BEFORE UPDATE ON public.ai_responses FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_subscription_plans_update BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_user_subscriptions_update BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_payments_update BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_files_update BEFORE UPDATE ON public.files FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();


-- =================================================================
-- SECTION 5: INDEXES FOR PERFORMANCE
-- =================================================================
-- Foreign Key Indexes (many are created automatically with FK, but explicit is clear)
CREATE INDEX idx_courses_subject_id ON public.courses(subject_id);
CREATE INDEX idx_modules_course_id ON public.modules(course_id);
CREATE INDEX idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX idx_teacher_courses_teacher_id ON public.teacher_courses(teacher_id);
CREATE INDEX idx_teacher_courses_course_id ON public.teacher_courses(course_id);
CREATE INDEX idx_questions_lesson_id ON public.questions(lesson_id);
CREATE INDEX idx_student_answers_question_id ON public.student_answers(question_id);
CREATE INDEX idx_student_answers_user_id ON public.student_answers(user_id);
CREATE INDEX idx_ai_responses_request_id ON public.ai_responses(request_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);

-- GIN index for array column in questions for fast concept tag lookups
CREATE INDEX idx_questions_concept_tags ON public.questions USING GIN (concept_tags);

-- Index for analytics and logging tables on frequently queried columns
CREATE INDEX idx_learning_analytics_user_id_metric ON public.learning_analytics(user_id, metric);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);

-- =================================================================
-- SECTION 6: ROW-LEVEL SECURITY (RLS) POLICIES
-- =================================================================

-- ---------------------------------
-- Helper function to get user role
-- ---------------------------------
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ---------------------------------
-- User & Profile Policies
-- ---------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to see their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update their own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins have full access to users" ON public.users FOR ALL USING (public.get_my_role() = 'admin');

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own profile" ON public.user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to profiles" ON public.user_profiles FOR ALL USING (public.get_my_role() = 'admin');

-- ---------------------------------
-- Academic Content Policies
-- ---------------------------------
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read subjects" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admins to manage subjects" ON public.subjects FOR ALL USING (public.get_my_role() = 'admin');

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read courses" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admins to manage courses" ON public.courses FOR ALL USING (public.get_my_role() = 'admin');

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read modules" ON public.modules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admins to manage modules" ON public.modules FOR ALL USING (public.get_my_role() = 'admin');

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read lessons" ON public.lessons FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admins to manage lessons" ON public.lessons FOR ALL USING (public.get_my_role() = 'admin');

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read questions" ON public.questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admins to manage questions" ON public.questions FOR ALL USING (public.get_my_role() = 'admin');

-- ---------------------------------
-- Academic Relationship Policies
-- ---------------------------------
ALTER TABLE public.teacher_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view their own course assignments" ON public.teacher_courses FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all teacher course assignments" ON public.teacher_courses FOR ALL USING (public.get_my_role() = 'admin');


-- ---------------------------------
-- Learning & Progress Policies
-- ---------------------------------
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own lesson progress" ON public.lesson_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view progress of students in their courses" ON public.lesson_progress FOR SELECT USING (
  public.get_my_role() = 'teacher' AND
  EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.modules m ON l.module_id = m.id
    JOIN public.teacher_courses tc ON m.course_id = tc.course_id
    WHERE l.id = lesson_progress.lesson_id AND tc.teacher_id = auth.uid()
  )
);
CREATE POLICY "Admins have full access to lesson progress" ON public.lesson_progress FOR ALL USING (public.get_my_role() = 'admin');

ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own concept mastery" ON public.concept_mastery FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view mastery of students in their courses" ON public.concept_mastery FOR SELECT USING (
  public.get_my_role() = 'teacher' AND
  EXISTS (
    SELECT 1 FROM public.lesson_progress lp
    JOIN public.lessons l ON lp.lesson_id = l.id
    JOIN public.modules m ON l.module_id = m.id
    JOIN public.teacher_courses tc ON m.course_id = tc.course_id
    WHERE lp.user_id = concept_mastery.user_id AND tc.teacher_id = auth.uid()
  )
);
CREATE POLICY "Admins have full access to concept mastery" ON public.concept_mastery FOR ALL USING (public.get_my_role() = 'admin');

ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own answers" ON public.student_answers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view answers from students in their courses" ON public.student_answers FOR SELECT USING (
  public.get_my_role() = 'teacher' AND
  EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.lessons l ON q.lesson_id = l.id
    JOIN public.modules m ON l.module_id = m.id
    JOIN public.teacher_courses tc ON m.course_id = tc.course_id
    WHERE q.id = student_answers.question_id AND tc.teacher_id = auth.uid()
  )
);
CREATE POLICY "Admins have full access to student answers" ON public.student_answers FOR ALL USING (public.get_my_role() = 'admin');

-- ---------------------------------
-- AI Governance Policies
-- ---------------------------------
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create and view their own AI requests" ON public.ai_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to AI requests" ON public.ai_requests FOR ALL USING (public.get_my_role() = 'admin');

ALTER TABLE public.ai_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view AI responses linked to their requests" ON public.ai_responses FOR SELECT
  USING (request_id IN (SELECT id FROM public.ai_requests WHERE user_id = auth.uid()));
CREATE POLICY "Admins have full access to AI responses" ON public.ai_responses FOR ALL USING (public.get_my_role() = 'admin');

-- ---------------------------------
-- Financial System Policies (VERY RESTRICTIVE)
-- ---------------------------------
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read plans" ON public.subscription_plans FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL USING (public.get_my_role() = 'admin');
-- Disallow direct client modification even for admins by default; use service role key
ALTER TABLE public.subscription_plans ALTER COLUMN id SET DEFAULT uuid_generate_v4();

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions FOR SELECT USING (public.get_my_role() = 'admin');
-- NOTE: All INSERT/UPDATE/DELETE operations on subscriptions MUST be done via a backend function with a service_role key.

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view payments" ON public.payments FOR SELECT USING (public.get_my_role() = 'admin');
-- NOTE: All INSERT/UPDATE/DELETE operations on payments MUST be done via a backend function with a service_role key.

-- =================================================================
-- END OF SCHEMA SCRIPT
-- =================================================================

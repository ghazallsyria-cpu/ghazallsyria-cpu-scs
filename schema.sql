-- =================================================================
-- Enable UUID extension
-- =================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- Custom Types (ENUMs) for standardized values
-- =================================================================
CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE public.subscription_status AS ENUM ('active', 'inactive', 'canceled', 'trialing');
CREATE TYPE public.lesson_status AS ENUM ('not_started', 'in_progress', 'completed');

-- =================================================================
-- Users and Profiles
-- This table stores public profile information and the app-specific role.
-- =================================================================
DROP TABLE IF EXISTS public.users;
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    role public.user_role NOT NULL DEFAULT 'student',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz
);
-- Index for faster role lookups
CREATE INDEX ON public.users(role);

-- =================================================================
-- Educational Content Structure
-- =================================================================
DROP TABLE IF EXISTS public.courses;
CREATE TABLE public.courses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    description text,
    subject text NOT NULL, -- e.g., 'Physics', 'Chemistry'
    target_grade int, -- e.g., 10, 11, 12
    created_at timestamptz NOT NULL DEFAULT now()
);

DROP TABLE IF EXISTS public.modules;
CREATE TABLE public.modules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title text NOT NULL,
    module_order int NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(course_id, module_order)
);
CREATE INDEX ON public.modules(course_id);

DROP TABLE IF EXISTS public.lessons;
CREATE TABLE public.lessons (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    title text NOT NULL,
    content jsonb, -- Can store rich text, videos, simulation links
    lesson_order int NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(module_id, lesson_order)
);
CREATE INDEX ON public.lessons(module_id);

-- =================================================================
-- User-Content Linking Tables
-- =================================================================
DROP TABLE IF EXISTS public.course_enrollments;
CREATE TABLE public.course_enrollments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(student_id, course_id)
);
CREATE INDEX ON public.course_enrollments(student_id);
CREATE INDEX ON public.course_enrollments(course_id);

-- CRITICAL TABLE FOR TEACHER RLS
DROP TABLE IF EXISTS public.teacher_courses;
CREATE TABLE public.teacher_courses (
    teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (teacher_id, course_id)
);
CREATE INDEX ON public.teacher_courses(teacher_id);
CREATE INDEX ON public.teacher_courses(course_id);

-- =================================================================
-- Student Progress and Assessment
-- =================================================================
DROP TABLE IF EXISTS public.lesson_progress;
CREATE TABLE public.lesson_progress (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    status public.lesson_status NOT NULL DEFAULT 'not_started',
    started_at timestamptz,
    completed_at timestamptz,
    UNIQUE(student_id, lesson_id)
);
CREATE INDEX ON public.lesson_progress(student_id);
CREATE INDEX ON public.lesson_progress(lesson_id);

DROP TABLE IF EXISTS public.questions;
CREATE TABLE public.questions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    question_type text NOT NULL, -- 'multiple_choice', 'free_text'
    correct_answer text,
    metadata jsonb
);
CREATE INDEX ON public.questions(lesson_id);

DROP TABLE IF EXISTS public.student_answers;
CREATE TABLE public.student_answers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_text text NOT NULL,
    is_correct boolean,
    submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.student_answers(student_id);
CREATE INDEX ON public.student_answers(question_id);


-- =================================================================
-- AI Governance and Logging
-- =================================================================
DROP TABLE IF EXISTS public.ai_requests;
CREATE TABLE public.ai_requests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    prompt text NOT NULL,
    context jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.ai_requests(user_id);

DROP TABLE IF EXISTS public.ai_responses;
CREATE TABLE public.ai_responses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id uuid NOT NULL REFERENCES public.ai_requests(id) ON DELETE CASCADE,
    response_payload jsonb NOT NULL,
    is_validated_by_human boolean NOT NULL DEFAULT false,
    validated_by uuid REFERENCES public.users(id), -- Teacher/Admin who validated
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.ai_responses(request_id);

-- =================================================================
-- Financial System (Placeholder)
-- =================================================================
DROP TABLE IF EXISTS public.subscription_plans;
CREATE TABLE public.subscription_plans (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    price numeric(10, 2) NOT NULL,
    currency text NOT NULL DEFAULT 'USD',
    duration_days int NOT NULL
);

DROP TABLE IF EXISTS public.user_subscriptions;
CREATE TABLE public.user_subscriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
    status public.subscription_status NOT NULL,
    start_date timestamptz,
    end_date timestamptz,
    UNIQUE(user_id) -- Assuming one active subscription per user
);
CREATE INDEX ON public.user_subscriptions(user_id);

DROP TABLE IF EXISTS public.payments;
CREATE TABLE public.payments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id uuid REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
    amount numeric(10, 2) NOT NULL,
    status text NOT NULL, -- e.g., 'succeeded', 'failed'
    payment_provider_txn_id text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.payments(user_id);

-- =================================================================
-- Helper Functions for RLS
-- =================================================================
-- Function to get the role of the currently authenticated user
CREATE OR REPLACE FUNCTION auth.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid()
$$;

-- =================================================================
-- Row-Level Security (RLS) Policies
-- =================================================================

-- Enable RLS on all relevant tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- Allow public read access on these tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

--
-- POLICIES for 'users' table
--
DROP POLICY IF EXISTS "Allow admins to see all users" ON public.users;
CREATE POLICY "Allow admins to see all users" ON public.users FOR SELECT
USING (auth.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Allow users to see their own profile" ON public.users;
CREATE POLICY "Allow users to see their own profile" ON public.users FOR SELECT
USING (id = auth.uid());

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

--
-- POLICIES for 'course_enrollments'
--
DROP POLICY IF EXISTS "Allow admins to manage all enrollments" ON public.course_enrollments;
CREATE POLICY "Allow admins to manage all enrollments" ON public.course_enrollments FOR ALL
USING (auth.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Students can see their own enrollments" ON public.course_enrollments;
CREATE POLICY "Students can see their own enrollments" ON public.course_enrollments FOR SELECT
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can see enrollments for their courses" ON public.course_enrollments;
CREATE POLICY "Teachers can see enrollments for their courses" ON public.course_enrollments FOR SELECT
USING (
  auth.get_my_role() = 'teacher' AND
  course_id IN (
    SELECT tc.course_id FROM public.teacher_courses tc WHERE tc.teacher_id = auth.uid()
  )
);

--
-- POLICIES for 'lesson_progress'
--
DROP POLICY IF EXISTS "Admins can manage all lesson progress" ON public.lesson_progress;
CREATE POLICY "Admins can manage all lesson progress" ON public.lesson_progress FOR ALL
USING (auth.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Students can manage their own lesson progress" ON public.lesson_progress;
CREATE POLICY "Students can manage their own lesson progress" ON public.lesson_progress FOR ALL
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can see lesson progress for their students" ON public.lesson_progress;
CREATE POLICY "Teachers can see lesson progress for their students" ON public.lesson_progress FOR SELECT
USING (
  auth.get_my_role() = 'teacher' AND
  student_id IN (
    SELECT ce.student_id FROM public.course_enrollments ce
    WHERE ce.course_id IN (
      SELECT tc.course_id FROM public.teacher_courses tc WHERE tc.teacher_id = auth.uid()
    )
  )
);

--
-- POLICIES for 'student_answers'
--
DROP POLICY IF EXISTS "Admins can manage all student answers" ON public.student_answers;
CREATE POLICY "Admins can manage all student answers" ON public.student_answers FOR ALL
USING (auth.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Students can manage their own answers" ON public.student_answers;
CREATE POLICY "Students can manage their own answers" ON public.student_answers FOR ALL
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can see answers from their students" ON public.student_answers;
CREATE POLICY "Teachers can see answers from their students" ON public.student_answers FOR SELECT
USING (
  auth.get_my_role() = 'teacher' AND
  student_id IN (
    SELECT ce.student_id FROM public.course_enrollments ce
    WHERE ce.course_id IN (
      SELECT tc.course_id FROM public.teacher_courses tc WHERE tc.teacher_id = auth.uid()
    )
  )
);

--
-- POLICIES for public content
--
DROP POLICY IF EXISTS "Allow authenticated users to read content" ON public.courses;
CREATE POLICY "Allow authenticated users to read content" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated users to read content" ON public.modules;
CREATE POLICY "Allow authenticated users to read content" ON public.modules FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated users to read content" ON public.lessons;
CREATE POLICY "Allow authenticated users to read content" ON public.lessons FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated users to read content" ON public.questions;
CREATE POLICY "Allow authenticated users to read content" ON public.questions FOR SELECT USING (auth.role() = 'authenticated');


-- =================================================================
-- Database Automation (Triggers)
-- =================================================================

-- Function to create a user profile upon new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'student');
  RETURN new;
END;
$$;

-- Trigger to execute the function after a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

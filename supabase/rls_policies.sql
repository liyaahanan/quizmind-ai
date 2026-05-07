-- Row Level Security Policies for QuizMind AI
-- Fixed for UUID/BIGINT compatibility

-- First, drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Professors can view own profile" ON public.professors;
DROP POLICY IF EXISTS "Professors can insert own profile" ON public.professors;
DROP POLICY IF EXISTS "Professors can update own profile" ON public.professors;
DROP POLICY IF EXISTS "Students can view own profile" ON public.students;
DROP POLICY IF EXISTS "Students can insert own profile" ON public.students;
DROP POLICY IF EXISTS "Students can update own profile" ON public.students;
DROP POLICY IF EXISTS "Professors can view own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Professors can create own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Professors can update own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Professors can delete own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Students can view available quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Professors can view own quiz questions" ON public.questions;
DROP POLICY IF EXISTS "Professors can create own quiz questions" ON public.questions;
DROP POLICY IF EXISTS "Professors can update own quiz questions" ON public.questions;
DROP POLICY IF EXISTS "Professors can delete own quiz questions" ON public.questions;
DROP POLICY IF EXISTS "Students can view quiz questions" ON public.questions;
DROP POLICY IF EXISTS "Students can view own results" ON public.results;
DROP POLICY IF EXISTS "Students can create own results" ON public.results;
DROP POLICY IF EXISTS "Students can update own results" ON public.results;
DROP POLICY IF EXISTS "Professors can view own quiz results" ON public.results;

-- Enable RLS on all tables
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Professors table policies (UUID-safe)
-- Professors can read their own record
CREATE POLICY "Professors can view own profile" ON public.professors
  FOR SELECT USING (auth.uid()::text = id::text);

-- Professors can insert their own record (for initial creation)
CREATE POLICY "Professors can insert own profile" ON public.professors
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Professors can update their own record
CREATE POLICY "Professors can update own profile" ON public.professors
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Students table policies (UUID-safe)
-- Students can read their own record
CREATE POLICY "Students can view own profile" ON public.students
  FOR SELECT USING (auth.uid()::text = id::text);

-- Students can insert their own record (for initial creation)
CREATE POLICY "Students can insert own profile" ON public.students
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Students can update their own record
CREATE POLICY "Students can update own profile" ON public.students
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Quizzes table policies (UUID-safe)
-- Professors can read their own quizzes
CREATE POLICY "Professors can view own quizzes" ON public.quizzes
  FOR SELECT USING (auth.uid()::text = professor_id::text);

-- Professors can create quizzes for themselves
CREATE POLICY "Professors can create own quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (auth.uid()::text = professor_id::text);

-- Professors can update their own quizzes
CREATE POLICY "Professors can update own quizzes" ON public.quizzes
  FOR UPDATE USING (auth.uid()::text = professor_id::text);

-- Professors can delete their own quizzes
CREATE POLICY "Professors can delete own quizzes" ON public.quizzes
  FOR DELETE USING (auth.uid()::text = professor_id::text);

-- Questions table policies (UUID-safe)
-- Professors can read questions from their own quizzes
CREATE POLICY "Professors can view own quiz questions" ON public.questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.professor_id::text = auth.uid()::text
    )
  );

-- Professors can create questions for their own quizzes
CREATE POLICY "Professors can create own quiz questions" ON public.questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.professor_id::text = auth.uid()::text
    )
  );

-- Professors can update questions in their own quizzes
CREATE POLICY "Professors can update own quiz questions" ON public.questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.professor_id::text = auth.uid()::text
    )
  );

-- Professors can delete questions from their own quizzes
CREATE POLICY "Professors can delete own quiz questions" ON public.questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.professor_id::text = auth.uid()::text
    )
  );

-- Results table policies (UUID-safe)
-- Students can read their own results
CREATE POLICY "Students can view own results" ON public.results
  FOR SELECT USING (auth.uid()::text = student_id::text);

-- Students can create their own results
CREATE POLICY "Students can create own results" ON public.results
  FOR INSERT WITH CHECK (auth.uid()::text = student_id::text);

-- Students can update their own results
CREATE POLICY "Students can update own results" ON public.results
  FOR UPDATE USING (auth.uid()::text = student_id::text);

-- Professors can read results from their own quizzes
CREATE POLICY "Professors can view own quiz results" ON public.results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = results.quiz_id 
      AND quizzes.professor_id::text = auth.uid()::text
    )
  );

-- Allow authenticated users to view quizzes for student dashboard
CREATE POLICY "Students can view available quizzes" ON public.quizzes
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to view questions for taking quizzes
CREATE POLICY "Students can view quiz questions" ON public.questions
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

-- Anti-Cheating Quiz System Schema for QuizMind AI
-- Run this in Supabase SQL Editor to add anti-cheating functionality

-- Create quiz_sets table to store different quiz variations (Set A, B, C)
CREATE TABLE IF NOT EXISTS public.quiz_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  set_name TEXT NOT NULL CHECK (set_name IN ('A', 'B', 'C')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure each quiz has only one of each set
  UNIQUE(quiz_id, set_name)
);

-- Create student_quiz_assignments table to track which set each student gets
CREATE TABLE IF NOT EXISTS public.student_quiz_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  assigned_set TEXT NOT NULL CHECK (assigned_set IN ('A', 'B', 'C')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure each student gets only one set per quiz
  UNIQUE(student_id, quiz_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS quiz_sets_quiz_id_idx ON public.quiz_sets(quiz_id);
CREATE INDEX IF NOT EXISTS quiz_sets_set_name_idx ON public.quiz_sets(set_name);
CREATE INDEX IF NOT EXISTS student_quiz_assignments_student_id_idx ON public.student_quiz_assignments(student_id);
CREATE INDEX IF NOT EXISTS student_quiz_assignments_quiz_id_idx ON public.student_quiz_assignments(quiz_id);
CREATE INDEX IF NOT EXISTS student_quiz_assignments_assigned_set_idx ON public.student_quiz_assignments(assigned_set);

-- Add updated_at trigger for quiz_sets
DROP TRIGGER IF EXISTS quiz_sets_set_updated_at ON public.quiz_sets;
CREATE TRIGGER quiz_sets_set_updated_at
BEFORE UPDATE ON public.quiz_sets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add updated_at trigger for student_quiz_assignments
DROP TRIGGER IF EXISTS student_quiz_assignments_set_updated_at ON public.student_quiz_assignments;
CREATE TRIGGER student_quiz_assignments_set_updated_at
BEFORE UPDATE ON public.student_quiz_assignments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable Row Level Security
ALTER TABLE public.quiz_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_quiz_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_sets
-- Professors can view quiz sets for their own quizzes
CREATE POLICY "Professors can view own quiz sets" ON public.quiz_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = quiz_sets.quiz_id 
      AND quizzes.professor_id::text = auth.uid()::text
    )
  );

-- Professors can create quiz sets for their own quizzes
CREATE POLICY "Professors can create own quiz sets" ON public.quiz_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = quiz_sets.quiz_id 
      AND quizzes.professor_id::text = auth.uid()::text
    )
  );

-- Professors can update quiz sets for their own quizzes
CREATE POLICY "Professors can update own quiz sets" ON public.quiz_sets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = quiz_sets.quiz_id 
      AND quizzes.professor_id::text = auth.uid()::text
    )
  );

-- Professors can delete quiz sets for their own quizzes
CREATE POLICY "Professors can delete own quiz sets" ON public.quiz_sets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = quiz_sets.quiz_id 
      AND quizzes.professor_id::text = auth.uid()::text
    )
  );

-- RLS Policies for student_quiz_assignments
-- Students can view their own assignments
CREATE POLICY "Students can view own assignments" ON public.student_quiz_assignments
  FOR SELECT USING (auth.uid()::text = student_id::text);

-- Students can create their own assignments (auto-assigned)
CREATE POLICY "Students can create own assignments" ON public.student_quiz_assignments
  FOR INSERT WITH CHECK (auth.uid()::text = student_id::text);

-- Professors can view assignments for their own quizzes
CREATE POLICY "Professors can view quiz assignments" ON public.student_quiz_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = student_quiz_assignments.quiz_id 
      AND quizzes.professor_id::text = auth.uid()::text
    )
  );

-- Professors can create assignments for their own quizzes
CREATE POLICY "Professors can create quiz assignments" ON public.student_quiz_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = student_quiz_assignments.quiz_id 
      AND quizzes.professor_id::text = auth.uid()::text
    )
  );

-- Professors can update assignments for their own quizzes
CREATE POLICY "Professors can update quiz assignments" ON public.student_quiz_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = student_quiz_assignments.quiz_id 
      AND quizzes.professor_id::text = auth.uid()::text
    )
  );

-- Professors can delete assignments for their own quizzes
CREATE POLICY "Professors can delete quiz assignments" ON public.student_quiz_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = student_quiz_assignments.quiz_id 
      AND quizzes.professor_id::text = auth.uid()::text
    )
  );

-- Function to randomly assign a quiz set to a student
CREATE OR REPLACE FUNCTION public.assign_quiz_set(p_student_id UUID, p_quiz_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_assigned_set TEXT;
  v_existing_assignment RECORD;
  v_available_sets TEXT[] := ARRAY['A', 'B', 'C'];
  v_assigned_sets TEXT[];
  v_random_set TEXT;
BEGIN
  -- Check if student already has an assignment
  SELECT * INTO v_existing_assignment 
  FROM public.student_quiz_assignments 
  WHERE student_id = p_student_id AND quiz_id = p_quiz_id;
  
  IF v_existing_assignment IS NOT NULL THEN
    RETURN v_existing_assignment.assigned_set;
  END IF;
  
  -- Get sets that are already assigned to other students for this quiz
  SELECT ARRAY_AGG(DISTINCT assigned_set) INTO v_assigned_sets
  FROM public.student_quiz_assignments 
  WHERE quiz_id = p_quiz_id;
  
  -- Find available sets (not assigned to this student yet)
  IF v_assigned_sets IS NOT NULL THEN
    v_available_sets := v_available_sets - v_assigned_sets;
  END IF;
  
  -- If no available sets, randomly pick from all sets
  IF array_length(v_available_sets, 1) IS NULL OR array_length(v_available_sets, 1) = 0 THEN
    v_available_sets := ARRAY['A', 'B', 'C'];
  END IF;
  
  -- Randomly select a set from available sets
  v_random_set := v_available_sets[floor(random() * array_length(v_available_sets, 1)) + 1];
  
  -- Create the assignment
  INSERT INTO public.student_quiz_assignments (student_id, quiz_id, assigned_set)
  VALUES (p_student_id, p_quiz_id, v_random_set);
  
  RETURN v_random_set;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student's assigned quiz set
CREATE OR REPLACE FUNCTION public.get_student_quiz_set(p_student_id UUID, p_quiz_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_assigned_set TEXT;
BEGIN
  -- Try to get existing assignment
  SELECT assigned_set INTO v_assigned_set
  FROM public.student_quiz_assignments 
  WHERE student_id = p_student_id AND quiz_id = p_quiz_id;
  
  -- If no assignment exists, create one
  IF v_assigned_set IS NULL THEN
    v_assigned_set := public.assign_quiz_set(p_student_id, p_quiz_id);
  END IF;
  
  RETURN v_assigned_set;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification queries
SELECT 'Anti-cheating schema created successfully' as status;

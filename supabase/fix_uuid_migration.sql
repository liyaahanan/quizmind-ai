-- FIXED UUID MIGRATION FOR QUIZMIND AI
-- Safe migration for professors/students BIGINT -> UUID

-- STEP 1: Add new UUID columns
ALTER TABLE public.professors
ADD COLUMN IF NOT EXISTS new_id UUID DEFAULT gen_random_uuid();

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS new_id UUID DEFAULT gen_random_uuid();

-- STEP 2: Drop foreign key constraints
ALTER TABLE public.quizzes
DROP CONSTRAINT IF EXISTS quizzes_professor_id_fkey;

ALTER TABLE public.results
DROP CONSTRAINT IF EXISTS results_student_id_fkey;

-- STEP 3: Rename old columns
ALTER TABLE public.professors RENAME COLUMN id TO old_id;
ALTER TABLE public.students RENAME COLUMN id TO old_id;

-- STEP 4: Rename new UUID columns
ALTER TABLE public.professors RENAME COLUMN new_id TO id;
ALTER TABLE public.students RENAME COLUMN new_id TO id;

-- STEP 5: Drop old primary keys
ALTER TABLE public.professors
DROP CONSTRAINT IF EXISTS professors_pkey;

ALTER TABLE public.students
DROP CONSTRAINT IF EXISTS students_pkey;

-- STEP 6: Create new primary keys
ALTER TABLE public.professors
ADD CONSTRAINT professors_pkey PRIMARY KEY (id);

ALTER TABLE public.students
ADD CONSTRAINT students_pkey PRIMARY KEY (id);

-- STEP 7: Ensure foreign key columns are UUID
ALTER TABLE public.quizzes
ALTER COLUMN professor_id TYPE UUID USING gen_random_uuid();

ALTER TABLE public.results
ALTER COLUMN student_id TYPE UUID USING gen_random_uuid();

-- STEP 8: Recreate foreign keys
ALTER TABLE public.quizzes
ADD CONSTRAINT quizzes_professor_id_fkey
FOREIGN KEY (professor_id)
REFERENCES public.professors(id)
ON DELETE CASCADE;

ALTER TABLE public.results
ADD CONSTRAINT results_student_id_fkey
FOREIGN KEY (student_id)
REFERENCES public.students(id)
ON DELETE CASCADE;

-- STEP 9: Verify types
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('professors','students','quizzes','results')
AND column_name IN ('id','professor_id','student_id');



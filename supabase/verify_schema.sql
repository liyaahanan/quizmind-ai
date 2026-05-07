-- Schema Verification Script for QuizMind AI
-- Run this to verify all UUID types and foreign key relationships

-- Check all table schemas
SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
JOIN information_schema.tables t ON c.table_name = t.table_name
WHERE c.table_schema = 'public'
  AND t.table_name IN ('professors', 'students', 'quizzes', 'questions', 'results')
ORDER BY t.table_name, c.ordinal_position;

-- Check foreign key constraints
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('professors', 'students', 'quizzes', 'questions', 'results');

-- Test UUID compatibility with auth.uid()
SELECT 
  'auth.uid() type:' as test1,
  pg_typeof(auth.uid()) as auth_uid_type,
  'UUID literal type:' as test2,
  pg_typeof('550e8400-e29b-41d4-a716-446655440000'::uuid) as uuid_literal_type,
  'Comparison test:' as test3,
  auth.uid()::text = '550e8400-e29b-41d4-a716-446655440000'::text as comparison_works;

-- Verify RLS policies are active
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('professors', 'students', 'quizzes', 'questions', 'results')
ORDER BY tablename, policyname;

-- Test sample data operations (should work without UUID errors)
-- This will only work if you have sample data
DO $$
BEGIN
  RAISE NOTICE 'Testing UUID operations...';
  
  -- Test professor access
  BEGIN
    PERFORM 1 FROM public.professors LIMIT 1;
    RAISE NOTICE 'Professors table accessible';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Professors table access error: %', SQLERRM;
  END;
  
  -- Test quiz access
  BEGIN
    PERFORM 1 FROM public.quizzes LIMIT 1;
    RAISE NOTICE 'Quizzes table accessible';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Quizzes table access error: %', SQLERRM;
  END;
  
  RAISE NOTICE 'UUID operation tests completed';
END $$;

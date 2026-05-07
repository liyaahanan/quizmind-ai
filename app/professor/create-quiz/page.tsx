import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateQuizForm from './create-quiz-form'

export default async function ProfessorCreateQuizPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login/professor')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-8">
      <CreateQuizForm />
    </main>
  )
}

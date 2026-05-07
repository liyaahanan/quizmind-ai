import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuizRunner from './quiz-runner'

type Props = {
  params: Promise<{ id: string }>
}

export default async function QuizPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login/professor')
  }

  return <QuizRunner quizId={id} studentId={user.id} studentEmail={user.email ?? ''} />
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ResultShell from './result-shell'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login/professor')
  }

  return <ResultShell resultId={id} studentId={user.id} />
}

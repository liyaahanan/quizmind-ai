import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AiGenerateShell from './ai-generate-shell'

export default async function AiGeneratePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    redirect('/login/professor')
  }

  return <AiGenerateShell professorId={user.id} email={user.email} />
}

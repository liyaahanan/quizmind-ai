import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from './dashboard-shell'

export default async function ProfessorDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login/professor')
  }

  return <DashboardShell email={user.email ?? 'Professor'} professorId={user.id} />
}

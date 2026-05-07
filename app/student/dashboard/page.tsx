import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentDashboardShell from './student-dashboard-shell'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login/professor')
  }

  return <StudentDashboardShell studentId={user.id} email={user.email ?? 'student@quizmind.ai'} />
}

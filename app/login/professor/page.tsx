import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfessorLoginForm from './login-form'

export default async function ProfessorLoginPage() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect('/professor/dashboard')
    }
  } catch {
    // Keep login page accessible so client-side error messaging can guide setup.
  }

  return <ProfessorLoginForm />
}

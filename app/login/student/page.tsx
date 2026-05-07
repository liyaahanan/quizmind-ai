import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentAuthForm from './student-auth-form'

export default async function StudentLoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/student/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_50%,#8b5cf633,transparent_50%),radial-gradient(circle_at_80%_80%,#06b6d433,transparent_50%),radial-gradient(circle_at_40%_20%,#f9731633,transparent_50%)]" />
      <div className="fixed inset-0 bg-black/40" />
      
      <div className="relative z-10 w-full max-w-md">
        <StudentAuthForm />
      </div>
    </main>
  )
}

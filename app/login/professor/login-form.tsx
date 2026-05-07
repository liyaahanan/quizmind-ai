'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const toReadableAuthError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  const lower = message.toLowerCase()

  if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return 'Cannot reach Supabase. Verify NEXT_PUBLIC_SUPABASE_URL, internet access, and that your Supabase project is active.'
  }

  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password.'
  }

  if (lower.includes('email not confirmed')) {
    return 'Email is not confirmed. Confirm the account email before logging in.'
  }

  if (lower.includes('signup is disabled') || lower.includes('auth provider')) {
    return 'Email/password authentication appears disabled in Supabase Auth settings.'
  }

  return message
}

export default function ProfessorLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Email and password are required.')
      }

      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        throw error
      }

      if (!data.session) {
        throw new Error('Login succeeded but no session was returned.')
      }

      router.replace('/professor/dashboard')
      router.refresh()
    } catch (error) {
      setErrorMessage(toReadableAuthError(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-4 text-white">
      <h1 className="text-4xl font-bold">Professor Login</h1>

      <form className="flex w-full max-w-sm flex-col gap-3" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          className="rounded bg-gray-800 p-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="rounded bg-gray-800 p-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="rounded bg-blue-600 px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}
    </main>
  )
}

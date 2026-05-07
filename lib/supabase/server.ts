import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseConfig } from './config'

export const createClient = async () => {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseConfig()

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Cookie mutation is not available in all server contexts.
          }
        },
      },
    }
  )
}
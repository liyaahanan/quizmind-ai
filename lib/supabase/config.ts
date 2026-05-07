const assertValidUrl = (value: string) => {
  try {
    const url = new URL(value)
    return Boolean(url.protocol && url.hostname)
  } catch {
    return false
  }
}

export const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to root .env.local and restart Next.js.'
    )
  }

  if (!assertValidUrl(url)) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not a valid URL.')
  }

  if (!anonKey.startsWith('sb_')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY format looks invalid.')
  }

  return { url, anonKey }
}

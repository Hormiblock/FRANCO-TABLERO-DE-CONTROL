import { google } from 'googleapis'
import { createServerClient, createClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Para crons — usa service role y busca el token del admin sin sesión
export async function getGoogleAuthForCron() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  // Buscar el token del admin (fmanzone)
  const { data: tokenRow } = await supabase
    .from('google_tokens')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (!tokenRow) return { error: 'no_token' as const }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  )

  oauth2Client.setCredentials({
    access_token:  tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    expiry_date:   tokenRow.expiry_date,
  })

  // Renovar si está por vencer
  const expiry = tokenRow.expiry_date ?? 0
  if (expiry - Date.now() < 5 * 60 * 1000 && tokenRow.refresh_token) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      oauth2Client.setCredentials(credentials)
      await supabase.from('google_tokens').update({
        access_token: credentials.access_token,
        expiry_date:  credentials.expiry_date,
        updated_at:   new Date().toISOString(),
      }).eq('user_id', tokenRow.user_id)
    } catch {
      return { error: 'token_expired' as const }
    }
  }

  return { auth: oauth2Client, userId: tokenRow.user_id, supabase }
}

export async function getGoogleAuthAndUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'no_auth' as const }

  const { data: tokenRow } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!tokenRow) return { error: 'no_token' as const }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  )

  oauth2Client.setCredentials({
    access_token:  tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    expiry_date:   tokenRow.expiry_date,
  })

  // Renovar token si está vencido o por vencer (menos de 5 min)
  const expiry = tokenRow.expiry_date ?? 0
  const ahoraMs = Date.now()
  const venceProximo = expiry - ahoraMs < 5 * 60 * 1000

  if (venceProximo && tokenRow.refresh_token) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      oauth2Client.setCredentials(credentials)

      // Guardar el nuevo token en Supabase
      await supabase.from('google_tokens').update({
        access_token: credentials.access_token,
        expiry_date:  credentials.expiry_date,
        updated_at:   new Date().toISOString(),
      }).eq('user_id', user.id)
    } catch {
      // Si falla el refresh, el usuario tendrá que reconectar
      return { error: 'token_expired' as const }
    }
  }

  // Verificar que el cliente tiene credenciales válidas
  try {
    const creds = oauth2Client.credentials
    if (!creds.access_token && !creds.refresh_token) {
      return { error: 'token_expired' as const }
    }
  } catch {
    return { error: 'token_expired' as const }
  }

  return { auth: oauth2Client, user, supabase }
}

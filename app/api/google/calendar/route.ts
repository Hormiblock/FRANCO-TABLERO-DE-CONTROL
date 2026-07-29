import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getOAuth2Client(tokens: { access_token: string; refresh_token?: string; expiry_date?: number }) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  )
  client.setCredentials(tokens)
  return client
}

export async function GET() {
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
  if (!user) return NextResponse.json({ error: 'no_auth' }, { status: 401 })

  const { data: tokenRow } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!tokenRow) return NextResponse.json({ error: 'no_google_token' }, { status: 403 })

  const auth = getOAuth2Client(tokenRow)
  const calendar = google.calendar({ version: 'v3', auth })

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 20,
  })

  const events = (res.data.items ?? []).map(e => ({
    id: e.id,
    titulo: e.summary ?? '(sin título)',
    inicio: e.start?.dateTime ?? e.start?.date,
    fin: e.end?.dateTime ?? e.end?.date,
    allDay: !e.start?.dateTime,
    descripcion: e.description ?? '',
    lugar: e.location ?? '',
    meet: e.hangoutLink ?? null,
    attendees: (e.attendees ?? []).map(a => ({ email: a.email, nombre: a.displayName })),
  }))

  return NextResponse.json({ events })
}

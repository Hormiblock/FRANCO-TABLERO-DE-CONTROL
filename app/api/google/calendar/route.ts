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

async function getSupabaseAndUser() {
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
  return { supabase, user }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const year  = parseInt(searchParams.get('year')  ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth()))

  const { supabase, user } = await getSupabaseAndUser()
  if (!user) return NextResponse.json({ error: 'no_auth' }, { status: 401 })

  const { data: tokenRow } = await supabase
    .from('google_tokens').select('*').eq('user_id', user.id).single()
  if (!tokenRow) return NextResponse.json({ error: 'no_google_token' }, { status: 403 })

  const auth = getOAuth2Client(tokenRow)
  const calendar = google.calendar({ version: 'v3', auth })

  const timeMin = new Date(year, month, 1, 0, 0, 0).toISOString()
  const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 100,
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

export async function POST(request: Request) {
  const { supabase, user } = await getSupabaseAndUser()
  if (!user) return NextResponse.json({ error: 'no_auth' }, { status: 401 })

  const { data: tokenRow } = await supabase
    .from('google_tokens').select('*').eq('user_id', user.id).single()
  if (!tokenRow) return NextResponse.json({ error: 'no_google_token' }, { status: 403 })

  const body = await request.json()
  const { titulo, fecha, horaInicio, horaFin, descripcion, lugar, conMeet, allDay } = body

  const auth = getOAuth2Client(tokenRow)
  const calendar = google.calendar({ version: 'v3', auth })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event: Record<string, any> = {
    summary: titulo,
    description: descripcion ?? '',
    location: lugar ?? '',
  }

  if (allDay) {
    event.start = { date: fecha }
    event.end   = { date: fecha }
  } else {
    event.start = { dateTime: `${fecha}T${horaInicio}:00`, timeZone: 'America/Argentina/Buenos_Aires' }
    event.end   = { dateTime: `${fecha}T${horaFin}:00`,   timeZone: 'America/Argentina/Buenos_Aires' }
  }

  if (conMeet) {
    event.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    }
  }

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    conferenceDataVersion: conMeet ? 1 : 0,
  })

  return NextResponse.json({
    id: res.data.id,
    titulo: res.data.summary,
    inicio: res.data.start?.dateTime ?? res.data.start?.date,
    fin: res.data.end?.dateTime ?? res.data.end?.date,
    meet: res.data.hangoutLink ?? null,
  })
}

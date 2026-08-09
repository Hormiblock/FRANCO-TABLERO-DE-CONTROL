import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { getGoogleAuthAndUser } from '@/lib/google-auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const year  = parseInt(searchParams.get('year')  ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth()))

  const result = await getGoogleAuthAndUser()
  if ('error' in result) {
    const status = result.error === 'no_auth' ? 401 : 403
    return NextResponse.json({ error: result.error }, { status })
  }

  const { auth } = result
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
  const result = await getGoogleAuthAndUser()
  if ('error' in result) {
    const status = result.error === 'no_auth' ? 401 : 403
    return NextResponse.json({ error: result.error }, { status })
  }

  const { auth } = result
  const calendar = google.calendar({ version: 'v3', auth })

  const body = await request.json()
  const { titulo, fecha, horaInicio, horaFin, descripcion, lugar, conMeet, allDay } = body

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

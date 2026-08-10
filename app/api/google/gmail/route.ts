import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { getGoogleAuthAndUser } from '@/lib/google-auth'

export async function GET() {
  const result = await getGoogleAuthAndUser()

  if ('error' in result) {
    const status = result.error === 'no_auth' ? 401 : 403
    return NextResponse.json({ error: result.error }, { status })
  }

  const { auth } = result
  const gmail = google.gmail({ version: 'v1', auth })

  const res = await gmail.users.threads.list({
    userId: 'me',
    q: 'is:unread in:inbox -category:promotions -category:social newer_than:7d',
    maxResults: 15,
  })

  const threads = res.data.threads ?? []
  const details = await Promise.all(
    threads.map(async (t) => {
      const thread = await gmail.users.threads.get({
        userId: 'me',
        id: t.id!,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      })
      const msg = thread.data.messages?.[0]
      const headers = msg?.payload?.headers ?? []
      const subject = headers.find(h => h.name === 'Subject')?.value ?? '(sin asunto)'
      const from    = headers.find(h => h.name === 'From')?.value ?? ''
      const dateRaw = headers.find(h => h.name === 'Date')?.value ?? ''
      const snippet = msg?.snippet ?? ''

      let date = ''
      if (dateRaw) {
        try {
          const d = new Date(dateRaw)
          const hoy  = new Date()
          const ayer = new Date(); ayer.setDate(ayer.getDate() - 1)
          if (d.toDateString() === hoy.toDateString()) {
            date = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
          } else if (d.toDateString() === ayer.toDateString()) {
            date = 'Ayer'
          } else {
            date = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
          }
        } catch { date = '' }
      }

      return { id: t.id, subject, from, date, snippet, threadId: t.id }
    })
  )

  return NextResponse.json({ emails: details })
}

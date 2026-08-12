import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAuthAndUser, getGoogleAuthForCron } from '@/lib/google-auth'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  // Verificar si es llamada de cron o de usuario
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  const esCron = cronSecret === process.env.CRON_SECRET

  let auth
  if (esCron) {
    const result = await getGoogleAuthForCron()
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 403 })
    auth = result.auth
  } else {
    const result = await getGoogleAuthAndUser()
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 403 })
    auth = result.auth
  }

  const gmail = google.gmail({ version: 'v1', auth })

  const queries = [
    'is:unread category:promotions',
    'is:unread category:social',
    'is:unread (from:noreply OR from:no-reply OR subject:newsletter OR subject:unsubscribe)',
  ]

  let totalMarcados = 0

  for (const q of queries) {
    try {
      const res = await gmail.users.messages.list({ userId: 'me', q, maxResults: 50 })
      const messages = res.data.messages ?? []
      if (messages.length === 0) continue
      const ids = messages.map(m => m.id!).filter(Boolean)
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: { ids, removeLabelIds: ['UNREAD'] },
      })
      totalMarcados += ids.length
    } catch (err) {
      console.error(`Error procesando query "${q}":`, err)
    }
  }

  return NextResponse.json({ ok: true, marcados: totalMarcados })
}

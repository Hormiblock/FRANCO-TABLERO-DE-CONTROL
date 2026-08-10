import { NextResponse } from 'next/server'
import { getGoogleAuthAndUser } from '@/lib/google-auth'
import { google } from 'googleapis'

export async function GET() {
  const result = await getGoogleAuthAndUser()
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 403 })
  }

  const { auth } = result
  const gmail = google.gmail({ version: 'v1', auth })

  // Buscar emails no leídos de promociones, newsletters y notificaciones automáticas
  const queries = [
    'is:unread category:promotions',
    'is:unread category:social',
    'is:unread (subject:newsletter OR subject:unsubscribe OR subject:"no reply" OR from:noreply OR from:no-reply)',
    'is:unread (subject:"confirmación de" OR subject:"tu pedido" OR subject:"tu reserva" OR subject:"factura" OR subject:"recibo")',
  ]

  let totalMarcados = 0

  for (const q of queries) {
    try {
      const res = await gmail.users.messages.list({
        userId: 'me',
        q,
        maxResults: 50,
      })

      const messages = res.data.messages ?? []
      if (messages.length === 0) continue

      const ids = messages.map(m => m.id!).filter(Boolean)

      // Marcar como leídos en batch
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids,
          removeLabelIds: ['UNREAD'],
        },
      })

      totalMarcados += ids.length
    } catch (err) {
      console.error(`Error procesando query "${q}":`, err)
    }
  }

  return NextResponse.json({ ok: true, marcados: totalMarcados })
}

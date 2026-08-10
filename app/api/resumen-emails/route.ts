import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getGoogleAuthAndUser } from '@/lib/google-auth'
import { google } from 'googleapis'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET() {
  const result = await getGoogleAuthAndUser()
  if ('error' in result) {
    const status = result.error === 'no_auth' ? 401 : 403
    return NextResponse.json({ error: result.error }, { status })
  }

  const { auth } = result
  const gmail = google.gmail({ version: 'v1', auth })

  // Traer emails sin leer de las últimas 48h
  let threadsRes
  try {
    threadsRes = await gmail.users.threads.list({
      userId: 'me',
      q: 'is:unread in:inbox -category:promotions -category:social newer_than:2d',
      maxResults: 20,
    })
  } catch (err) {
    console.error('Gmail error:', err)
    return NextResponse.json({ error: 'gmail_error', message: String(err) }, { status: 403 })
  }

  const threads = threadsRes.data.threads ?? []
  if (threads.length === 0) {
    return NextResponse.json({
      resumen: 'Sin emails importantes sin leer. 🎉',
      emails: [],
      urgentes: [],
    })
  }

  const details = await Promise.all(
    threads.map(async (t) => {
      const thread = await gmail.users.threads.get({
        userId: 'me',
        id: t.id!,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      })
      const msg     = thread.data.messages?.[0]
      const headers = msg?.payload?.headers ?? []
      return {
        id:      t.id,
        subject: headers.find(h => h.name === 'Subject')?.value ?? '(sin asunto)',
        from:    headers.find(h => h.name === 'From')?.value ?? '',
        snippet: msg?.snippet ?? '',
      }
    })
  )

  // Pedir análisis a Claude
  const emailsTexto = details.map((e, i) =>
    `${i + 1}. De: ${e.from}\n   Asunto: ${e.subject}\n   Preview: ${e.snippet}`
  ).join('\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Sos el asistente de Franco Manzone, gerente de 4 empresas argentinas: Ostara (marketing/eventos), Hormiblock (hormigón), Blockera (construcción) y Granny (agro).

Analizá estos emails sin leer y hacé un resumen ejecutivo breve en español argentino:

${emailsTexto}

Respondé en este formato JSON exacto:
{
  "resumen": "2-3 oraciones resumiendo el panorama general de los emails",
  "urgentes": ["email id o asunto que requiere respuesta hoy", ...],
  "puede_esperar": ["email que puede esperar", ...],
  "accion_recomendada": "Una acción concreta que Franco debería hacer primero"
}

Solo respondé con el JSON, sin texto adicional.`,
    }],
  })

  const texto = message.content[0].type === 'text' ? message.content[0].text : '{}'

  let analisis = { resumen: '', urgentes: [] as string[], puede_esperar: [] as string[], accion_recomendada: '' }
  try {
    analisis = JSON.parse(texto)
  } catch {
    analisis.resumen = texto
  }

  return NextResponse.json({ ...analisis, emails: details })
}

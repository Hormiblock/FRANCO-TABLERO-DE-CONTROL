import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getGoogleAuthAndUser } from '@/lib/google-auth'
import { google } from 'googleapis'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET() {
  // Verificar cron secret para llamadas automáticas
  const authResult = await getGoogleAuthAndUser()
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 403 })
  }

  const { auth, user } = authResult

  const gmail    = google.gmail({ version: 'v1', auth })
  const calendar = google.calendar({ version: 'v3', auth })

  // Emails sin leer
  const emailsRes = await gmail.users.threads.list({
    userId: 'me',
    q: 'is:unread in:inbox -category:promotions -category:social newer_than:1d',
    maxResults: 15,
  })

  const threads = emailsRes.data.threads ?? []
  const emails = await Promise.all(
    threads.map(async (t) => {
      const thread = await gmail.users.threads.get({
        userId: 'me', id: t.id!, format: 'metadata',
        metadataHeaders: ['Subject', 'From'],
      })
      const msg     = thread.data.messages?.[0]
      const headers = msg?.payload?.headers ?? []
      return {
        subject: headers.find(h => h.name === 'Subject')?.value ?? '(sin asunto)',
        from:    headers.find(h => h.name === 'From')?.value ?? '',
        snippet: msg?.snippet ?? '',
      }
    })
  )

  // Eventos de hoy
  const hoy   = new Date()
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0)
  const fin    = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)

  const calRes = await calendar.events.list({
    calendarId: 'primary',
    timeMin: inicio.toISOString(),
    timeMax: fin.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 10,
  })

  const eventos = (calRes.data.items ?? []).map(e => ({
    titulo: e.summary ?? '(sin título)',
    hora:   e.start?.dateTime
      ? new Date(e.start.dateTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      : 'Todo el día',
    meet: e.hangoutLink ?? null,
  }))

  // Tareas urgentes de Supabase
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: tareas } = await supabase
    .from('tareas')
    .select('titulo, empresa, prioridad, fecha_limite')
    .neq('estado', 'completado')
    .or('prioridad.eq.alta,fecha_limite.lte.' + new Date().toISOString())
    .limit(5)

  // Generar reporte con Claude
  const fechaStr = hoy.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  const prompt = `Sos el asistente de Franco Manzone. Generá un reporte matutino ejecutivo para el ${fechaStr}.

EMAILS SIN LEER HOY (${emails.length}):
${emails.map((e, i) => `${i+1}. De: ${e.from} | ${e.subject} | ${e.snippet}`).join('\n')}

REUNIONES DE HOY (${eventos.length}):
${eventos.map(e => `- ${e.hora}: ${e.titulo}`).join('\n') || 'Sin reuniones'}

TAREAS URGENTES:
${(tareas ?? []).map(t => `- [${t.empresa}] ${t.titulo} (${t.prioridad})`).join('\n') || 'Sin tareas urgentes'}

Escribí un reporte breve en español argentino, tono directo y ejecutivo. Máximo 200 palabras. Incluí:
1. Resumen del día
2. Lo más urgente de los emails
3. Reuniones clave
4. Una recomendación de por dónde empezar

Formato: texto limpio, sin markdown, listo para recibir por email.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  const reporte = message.content[0].type === 'text' ? message.content[0].text : ''

  // Usar el email del usuario de auth directamente
  const emailDestino = user.email ?? ''
  const nombre       = user.user_metadata?.nombre?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'Franco'

  if (emailDestino) {
    const asunto  = `Reporte del dia - ${fechaStr}`
    const cuerpo  = `Buenas ${nombre},\n\n${reporte}\n\n---\nEnviado automáticamente por tu Tablero de Control.`
    const raw = Buffer.from(
      `To: ${emailDestino}\r\nSubject: ${asunto}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${cuerpo}`
    ).toString('base64url')

    await gmail.users.messages.send({ userId: 'me', requestBody: { raw } })
  }

  return NextResponse.json({ ok: true, reporte, emails: emails.length, eventos: eventos.length })
}

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getGoogleAuthAndUser } from '@/lib/google-auth'
import { google } from 'googleapis'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET() {
  const authResult = await getGoogleAuthAndUser()
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 403 })
  }

  const { auth, user } = authResult

  const gmail    = google.gmail({ version: 'v1', auth })
  const calendar = google.calendar({ version: 'v3', auth })

  // Emails sin leer de los últimos 7 días
  let emailsSinLeer: { subject: string; from: string }[] = []
  try {
    const emailsRes = await gmail.users.threads.list({
      userId: 'me',
      q: 'is:unread in:inbox -category:promotions -category:social newer_than:7d',
      maxResults: 20,
    })
    const threads = emailsRes.data.threads ?? []
    emailsSinLeer = await Promise.all(
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
        }
      })
    )
  } catch {}

  // Reuniones de mañana
  const hoy    = new Date()
  const manana = new Date(hoy)
  manana.setDate(hoy.getDate() + 1)
  const inicioManana = new Date(manana.getFullYear(), manana.getMonth(), manana.getDate(), 0, 0, 0)
  const finManana    = new Date(manana.getFullYear(), manana.getMonth(), manana.getDate(), 23, 59, 59)

  let reunionesManana: { titulo: string; hora: string }[] = []
  try {
    const calRes = await calendar.events.list({
      calendarId: 'primary',
      timeMin: inicioManana.toISOString(),
      timeMax: finManana.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 10,
    })
    reunionesManana = (calRes.data.items ?? []).map(e => ({
      titulo: e.summary ?? '(sin título)',
      hora: e.start?.dateTime
        ? new Date(e.start.dateTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
        : 'Todo el día',
    }))
  } catch {}

  // Emails pendientes a responder de Supabase
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: pendientes } = await supabase
    .from('emails_pendientes')
    .select('subject, from_email')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Tareas urgentes sin completar
  const { data: tareas } = await supabase
    .from('tareas')
    .select('titulo, empresa, prioridad')
    .neq('estado', 'completado')
    .eq('prioridad', 'alta')
    .limit(5)

  // Generar reporte con Claude
  const fechaStr = hoy.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  const mananaStr = manana.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  const prompt = `Sos el asistente de Franco Manzone. Generá un reporte de cierre del día para el ${fechaStr}.

EMAILS SIN LEER (${emailsSinLeer.length}):
${emailsSinLeer.map((e, i) => `${i+1}. De: ${e.from} | ${e.subject}`).join('\n') || 'Ninguno'}

EMAILS PENDIENTES A RESPONDER (${(pendientes ?? []).length}):
${(pendientes ?? []).map((p, i) => `${i+1}. De: ${p.from_email} | ${p.subject}`).join('\n') || 'Ninguno'}

REUNIONES DE MAÑANA ${mananaStr} (${reunionesManana.length}):
${reunionesManana.map(e => `- ${e.hora}: ${e.titulo}`).join('\n') || 'Sin reuniones'}

TAREAS URGENTES PENDIENTES:
${(tareas ?? []).map(t => `- [${t.empresa}] ${t.titulo}`).join('\n') || 'Sin tareas urgentes'}

Escribí un reporte de cierre breve en español argentino, tono directo. Máximo 200 palabras. Incluí:
1. Resumen de lo que queda pendiente hoy
2. Emails que hay que responder sí o sí
3. Reuniones de mañana para prepararse
4. Una sola recomendación para cerrar el día

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

  console.log('Email destino (auth):', emailDestino)

  if (emailDestino) {
    const asunto = `Cierre del dia - ${fechaStr}`
    const cuerpo = `Buenas ${nombre},\n\n${reporte}\n\n---\nEnviado automáticamente por tu Tablero de Control.`
    const raw = Buffer.from(
      `To: ${emailDestino}\r\nSubject: ${asunto}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${cuerpo}`
    ).toString('base64url')

    try {
      await gmail.users.messages.send({ userId: 'me', requestBody: { raw } })
      console.log('Mail enviado a:', emailDestino)
    } catch (sendErr) {
      console.error('Error enviando mail:', sendErr)
      return NextResponse.json({ ok: false, error: 'send_failed', detail: String(sendErr), emailDestino })
    }
  } else {
    console.error('Sin email destino — user.email:', user.email)
    return NextResponse.json({ ok: false, error: 'no_email_destino', userId: user.id })
  }

  return NextResponse.json({ ok: true, reporte, emailsSinLeer: emailsSinLeer.length, reunionesManana: reunionesManana.length })
}

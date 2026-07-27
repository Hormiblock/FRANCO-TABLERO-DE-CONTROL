import { NextResponse } from 'next/server'

// Este endpoint se dispara automáticamente:
//   - Lunes 8:00am (Argentina = UTC-3, por eso se configura 11:00 UTC)
//   - Miércoles 8:00am

// Una vez conectado Supabase, reemplazar los datos demo por consultas reales
const TAREAS_DEMO = [
  { titulo: 'Enviar propuesta TOYOTA',        empresa: 'Ostara',     prioridad: 'alta',  gerente: null },
  { titulo: 'Pedido de cemento urgente',       empresa: 'Hormiblock', prioridad: 'alta',  gerente: 'Jose Sparks' },
  { titulo: 'Licitación calle San Martín',     empresa: 'Blockera',   prioridad: 'alta',  gerente: 'Jose Sparks' },
  { titulo: 'Renovar contrato arrendamiento',  empresa: 'Granny',     prioridad: 'alta',  gerente: 'Santiago Dans' },
  { titulo: 'Cotizar catering Banco Central',  empresa: 'Ostara',     prioridad: 'media', gerente: null },
  { titulo: 'Análisis suelo lote norte',       empresa: 'Granny',     prioridad: 'baja',  gerente: 'Santiago Dans' },
]

function generarMensajeResumen(tareas: typeof TAREAS_DEMO, dia: string): string {
  const urgentes = tareas.filter(t => t.prioridad === 'alta')
  const medias   = tareas.filter(t => t.prioridad === 'media')
  const bajas    = tareas.filter(t => t.prioridad === 'baja')

  let msg = `📋 *Recordatorio ${dia} — Franco Hub*\n`
  msg += `Total pendientes: *${tareas.length} tareas*\n\n`

  if (urgentes.length > 0) {
    msg += `🔴 *URGENTES (${urgentes.length})*\n`
    urgentes.forEach(t => {
      msg += `• ${t.empresa}: ${t.titulo}`
      if (t.gerente) msg += ` _(${t.gerente})_`
      msg += '\n'
    })
    msg += '\n'
  }

  if (medias.length > 0) {
    msg += `🟡 *MEDIAS (${medias.length})*\n`
    medias.forEach(t => {
      msg += `• ${t.empresa}: ${t.titulo}`
      if (t.gerente) msg += ` _(${t.gerente})_`
      msg += '\n'
    })
    msg += '\n'
  }

  if (bajas.length > 0) {
    msg += `⚪ *BAJAS (${bajas.length})*\n`
    bajas.forEach(t => {
      msg += `• ${t.empresa}: ${t.titulo}\n`
    })
    msg += '\n'
  }

  msg += `_Franco Hub · ${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}_`
  return msg
}

export async function GET(req: Request) {
  // Verificar que la llamada viene de Vercel Cron (seguridad)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const hoy = new Date()
  const diaSemana = hoy.getDay() // 1 = lunes, 3 = miércoles
  const diaLabel = diaSemana === 1 ? 'Lunes' : 'Miércoles'

  // TODO: cuando Supabase esté conectado, reemplazar con:
  // const { data: tareas } = await supabase
  //   .from('tareas')
  //   .select('*')
  //   .neq('estado', 'completado')
  //   .order('prioridad')
  const tareas = TAREAS_DEMO

  const mensaje = generarMensajeResumen(tareas, diaLabel)

  // Enviar por WhatsApp vía Twilio (activar cuando esté configurado)
  const twilioSid    = process.env.TWILIO_ACCOUNT_SID
  const twilioToken  = process.env.TWILIO_AUTH_TOKEN
  const twilioFrom   = process.env.TWILIO_WHATSAPP_FROM   // 'whatsapp:+14155238886'
  const francoNumber = process.env.FRANCO_WHATSAPP         // 'whatsapp:+549XXXXXXXXX'

  if (twilioSid && twilioToken && twilioFrom && francoNumber) {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioFrom,
        To: francoNumber,
        Body: mensaje,
      }).toString(),
    })
  }

  return NextResponse.json({
    ok: true,
    dia: diaLabel,
    tareasPendientes: tareas.length,
    mensaje,
  })
}

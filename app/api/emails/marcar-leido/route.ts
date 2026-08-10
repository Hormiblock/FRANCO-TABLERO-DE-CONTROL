import { NextResponse } from 'next/server'
import { getGoogleAuthAndUser } from '@/lib/google-auth'
import { google } from 'googleapis'

export async function POST(request: Request) {
  const result = await getGoogleAuthAndUser()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 403 })

  const { auth, user, supabase } = result
  const { threadId } = await request.json()
  if (!threadId) return NextResponse.json({ error: 'missing threadId' }, { status: 400 })

  const gmail = google.gmail({ version: 'v1', auth })

  // Marcar como leído en Gmail
  await gmail.users.threads.modify({
    userId: 'me',
    id: threadId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  })

  // Si estaba en pendientes, sacarlo
  await supabase
    .from('emails_pendientes')
    .delete()
    .eq('user_id', user.id)
    .eq('gmail_thread_id', threadId)

  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { getGoogleAuthAndUser } from '@/lib/google-auth'

export async function POST(request: Request) {
  const result = await getGoogleAuthAndUser()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 403 })

  const { user, supabase } = result
  const body = await request.json()
  const { threadId, subject, from, snippet } = body
  if (!threadId) return NextResponse.json({ error: 'missing threadId' }, { status: 400 })

  await supabase.from('emails_pendientes').upsert({
    user_id: user.id,
    gmail_thread_id: threadId,
    subject,
    from_email: from,
    snippet,
  }, { onConflict: 'user_id,gmail_thread_id' })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const result = await getGoogleAuthAndUser()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 403 })

  const { user, supabase } = result
  const { threadId } = await request.json()

  await supabase
    .from('emails_pendientes')
    .delete()
    .eq('user_id', user.id)
    .eq('gmail_thread_id', threadId)

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const result = await getGoogleAuthAndUser()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 403 })

  const { user, supabase } = result

  const { data } = await supabase
    .from('emails_pendientes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ pendientes: data ?? [] })
}

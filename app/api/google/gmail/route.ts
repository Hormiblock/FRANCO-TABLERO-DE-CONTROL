import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getOAuth2Client(tokens: { access_token: string; refresh_token?: string; expiry_date?: number }) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  )
  client.setCredentials(tokens)
  return client
}

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'no_auth' }, { status: 401 })

  const { data: tokenRow } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!tokenRow) return NextResponse.json({ error: 'no_google_token' }, { status: 403 })

  const auth = getOAuth2Client(tokenRow)
  const gmail = google.gmail({ version: 'v1', auth })

  // Buscar emails importantes no leídos (últimas 48h, excluyendo promociones)
  const res = await gmail.users.threads.list({
    userId: 'me',
    q: 'is:unread in:inbox -category:promotions -category:social newer_than:2d',
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
      const from = headers.find(h => h.name === 'From')?.value ?? ''
      const date = headers.find(h => h.name === 'Date')?.value ?? ''
      const snippet = msg?.snippet ?? ''
      return { id: t.id, subject, from, date, snippet, threadId: t.id }
    })
  )

  return NextResponse.json({ emails: details })
}

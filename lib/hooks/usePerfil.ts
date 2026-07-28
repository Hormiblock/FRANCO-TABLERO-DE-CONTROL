'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/lib/types'

export function usePerfil() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setPerfil(data)
          setLoading(false)
        })
    })
  }, [])

  return { perfil, loading }
}

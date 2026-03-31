'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGenerationStore } from '@/stores/useGenerationStore'
import { getMe, type User } from '@/lib/api/auth'
import AuthModal from '@/components/siana/AuthModal'

interface GeneratingGuardProps {
  children: React.ReactNode
}

export default function GeneratingGuard({ children }: GeneratingGuardProps) {
  const router = useRouter()
  const { designId, selectedTemplate, partner1Name, _hasHydrated } = useGenerationStore()
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>(
    'checking'
  )

  useEffect(() => {
    if (!_hasHydrated) return
    if (!designId) {
      router.replace('/generate/upload')
      return
    }
    if (!selectedTemplate) {
      router.replace('/generate/template')
      return
    }
    if (!partner1Name) {
      router.replace('/generate/configure')
      return
    }
    let cancelled = false
    getMe()
      .then((result) => {
        if (!cancelled) setAuthState(result.success ? 'authenticated' : 'unauthenticated')
      })
      .catch(() => {
        if (!cancelled) setAuthState('unauthenticated')
      })
    return () => { cancelled = true }
  }, [_hasHydrated, designId, selectedTemplate, partner1Name, router])

  if (!_hasHydrated || !designId || !selectedTemplate || !partner1Name) return null
  if (authState === 'checking') return null

  if (authState === 'unauthenticated') {
    return (
      <AuthModal
        isOpen={true}
        onClose={() => router.replace('/generate/configure')}
        onAuthSuccess={(_user: User) => setAuthState('authenticated')}
        returnTo="/generate/generating"
        description="Connectez-vous pour générer votre design"
      />
    )
  }

  return <>{children}</>
}

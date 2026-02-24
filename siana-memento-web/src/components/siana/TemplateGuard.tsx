'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGenerationStore } from '@/stores/useGenerationStore'

interface TemplateGuardProps {
  children: React.ReactNode
}

export default function TemplateGuard({ children }: TemplateGuardProps) {
  const router = useRouter()
  const { designId, _hasHydrated } = useGenerationStore()

  useEffect(() => {
    if (_hasHydrated && !designId) {
      router.replace('/generate/upload')
    }
  }, [_hasHydrated, designId, router])

  if (!_hasHydrated || !designId) return null

  return <>{children}</>
}

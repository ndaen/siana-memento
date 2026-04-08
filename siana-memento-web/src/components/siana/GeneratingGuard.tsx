'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGenerationStore } from '@/stores/useGenerationStore'

interface GeneratingGuardProps {
  children: React.ReactNode
}

export default function GeneratingGuard({ children }: GeneratingGuardProps) {
  const router = useRouter()
  const { designId, selectedTemplate, partner1Name, _hasHydrated } = useGenerationStore()

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
  }, [_hasHydrated, designId, selectedTemplate, partner1Name, router])

  if (!_hasHydrated || !designId || !selectedTemplate || !partner1Name) return null

  return <>{children}</>
}

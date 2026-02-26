'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGenerationStore } from '@/stores/useGenerationStore'

interface ConfigureGuardProps {
  children: React.ReactNode
}

export default function ConfigureGuard({ children }: ConfigureGuardProps) {
  const router = useRouter()
  const { designId, selectedTemplate, _hasHydrated } = useGenerationStore()

  useEffect(() => {
    if (!_hasHydrated) return
    if (!designId) {
      router.replace('/generate/upload')
    } else if (!selectedTemplate) {
      router.replace('/generate/template')
    }
  }, [_hasHydrated, designId, selectedTemplate, router])

  if (!_hasHydrated || !designId || !selectedTemplate) return null

  return <>{children}</>
}

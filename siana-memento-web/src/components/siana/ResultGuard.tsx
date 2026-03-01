'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGenerationStore } from '@/stores/useGenerationStore'

interface ResultGuardProps {
  children: React.ReactNode
}

export default function ResultGuard({ children }: ResultGuardProps) {
  const router = useRouter()
  const { designId, generatedImageUrl, _hasHydrated } = useGenerationStore()

  useEffect(() => {
    if (!_hasHydrated) return
    if (!designId || !generatedImageUrl) {
      router.replace('/generate/generating')
    }
  }, [_hasHydrated, designId, generatedImageUrl, router])

  if (!_hasHydrated || !designId || !generatedImageUrl) return null

  return <>{children}</>
}

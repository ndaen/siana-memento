'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGenerationStore } from '@/stores/useGenerationStore'

interface ResultGuardProps {
  children: React.ReactNode
}

export default function ResultGuard({ children }: ResultGuardProps) {
  const router = useRouter()
  const { designId, generatedImageUrl, isPaid, orderId, _hasHydrated } = useGenerationStore()

  const hasResult = !!(designId && generatedImageUrl)
  const hasPaidOrder = !!(isPaid && orderId)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!hasResult && !hasPaidOrder) {
      router.replace('/generate/generating')
    }
  }, [_hasHydrated, hasResult, hasPaidOrder, router])

  if (!_hasHydrated || (!hasResult && !hasPaidOrder)) return null

  return <>{children}</>
}

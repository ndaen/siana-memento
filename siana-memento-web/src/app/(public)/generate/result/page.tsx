'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useGenerationStore } from '@/stores/useGenerationStore'

/**
 * Page résultat temporaire — Story 3.4
 * ─────────────────────────────────────
 * Affiche l'image générée stockée dans le Zustand store.
 * Cette page sera remplacée par la version complète lors de la Story 3.5
 * (effet "révélation" + confetti + partage + options d'itération).
 *
 * TODO Story 3.5 : Remplacer par ResultView avec l'effet "wow" complet.
 */
export default function ResultPage() {
  const router = useRouter()
  const { generatedImageUrl, partner1Name, partner2Name, _hasHydrated, designId } =
    useGenerationStore()
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!designId || !generatedImageUrl) {
      router.replace('/generate/generating')
    }
  }, [_hasHydrated, designId, generatedImageUrl, router])

  if (!_hasHydrated || !generatedImageUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Chargement du résultat…</p>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg flex flex-col items-center gap-6">
        {/* En-tête */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Votre Save the Date est prêt ! 🎉</h1>
          {partner1Name && partner2Name && (
            <p className="mt-2 text-muted-foreground">
              {partner1Name} &amp; {partner2Name}
            </p>
          )}
        </div>

        {/* Image générée */}
        {!imageError ? (
          <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={generatedImageUrl}
              alt={`Illustration Save the Date pour ${partner1Name ?? ''} et ${partner2Name ?? ''}`}
              className="w-full h-auto object-contain"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="flex w-full h-64 items-center justify-center rounded-2xl bg-muted">
            <p className="text-sm text-muted-foreground">
              Impossible d&apos;afficher l&apos;image générée.
            </p>
          </div>
        )}

        {/* Note temporaire */}
        <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/40 px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            ✨ Page de résultat temporaire — La version finale (Story 3.5) inclura un effet de
            révélation, des confettis et des options d&apos;itération.
          </p>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3">
          <Button asChild size="lg" className="w-full font-semibold">
            <Link href="/generate/generating">Générer une nouvelle version</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { useGenerationStore } from '@/stores/useGenerationStore'
import confetti from 'canvas-confetti'

const MAX_ITERATIONS = 3

export default function ResultView() {
  const { generatedImageUrl, partner1Name, partner2Name, iterationsUsed } = useGenerationStore()
  const [isRevealed, setIsRevealed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const confettiFiredRef = useRef(false)

  // Fade-in de l'image + lancement des confettis
  useEffect(() => {
    // Petite pause pour laisser le DOM se stabiliser au montage
    const revealTimer = setTimeout(() => {
      setIsRevealed(true)

      // Lancer les confettis une seule fois (protection React Strict Mode double mount)
      if (!confettiFiredRef.current) {
        confettiFiredRef.current = true
        const end = Date.now() + 3000 // 3 secondes de confettis

        const launchConfetti = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#2D4A3E', '#C17A6F', '#D4AF37'],
          })
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#2D4A3E', '#C17A6F', '#D4AF37'],
          })
          if (Date.now() < end) {
            requestAnimationFrame(launchConfetti)
          }
        }

        // Démarrer les confettis après 300ms (image à ~15% du fade-in)
        setTimeout(launchConfetti, 300)
      }
    }, 100)

    return () => clearTimeout(revealTimer)
  }, [])

  const remainingIterations = MAX_ITERATIONS - iterationsUsed
  const iterationLabel =
    remainingIterations > 0
      ? `Itération ${iterationsUsed}/${MAX_ITERATIONS} — ${remainingIterations} itération${remainingIterations > 1 ? 's' : ''} restante${remainingIterations > 1 ? 's' : ''} incluse${remainingIterations > 1 ? 's' : ''}`
      : `Itération ${iterationsUsed}/${MAX_ITERATIONS} — Aucune itération restante`

  const altText = `Illustration Save the Date pour ${partner1Name ?? ''} et ${partner2Name ?? ''}`

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Mascotte + message de félicitations */}
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/mascotte/siana-success.svg"
          alt=""
          aria-hidden="true"
          width={72}
          height={72}
        />
        <div className="text-center">
          <h1 className="text-2xl font-bold">Votre Save the Date est prêt !</h1>
          {partner1Name && partner2Name && (
            <p className="mt-1 text-sm text-muted-foreground">
              {partner1Name} &amp; {partner2Name}
            </p>
          )}
        </div>
      </div>

      {/* Illustration avec fade-in et comportement zoom */}
      <div
        className={[
          'w-full overflow-hidden rounded-2xl shadow-2xl cursor-zoom-in',
          'transition-opacity duration-[2000ms] ease-in-out',
          isRevealed ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        style={{ touchAction: 'pinch-zoom' }}
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Voir l'illustration en plein écran"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={generatedImageUrl!}
          alt={altText}
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Compteur d'itérations */}
      <p className="text-sm text-muted-foreground text-center" aria-live="polite">
        {iterationLabel}
      </p>

      {/* Actions */}
      <div className="flex w-full flex-col gap-3">
        {remainingIterations > 0 ? (
          <Button
            size="lg"
            variant="outline"
            className="w-full font-semibold"
            disabled
            title="Disponible en Story 3.6"
          >
            Ajuster mon illustration
          </Button>
        ) : (
          <Button size="lg" variant="outline" className="w-full" disabled>
            Limite de 3 itérations atteinte
          </Button>
        )}
        <Button
          size="lg"
          className="w-full font-semibold"
          disabled
          title="Disponible en Story 4.1"
        >
          Commander mon poster — 19,90 €
        </Button>
      </div>

      {/* Dialog plein écran pour zoom */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] p-2 overflow-auto"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">
            Illustration Save the Date — Vue plein écran
          </DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={generatedImageUrl!}
            alt={altText}
            className="w-full h-auto object-contain"
            style={{ touchAction: 'pinch-zoom' }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

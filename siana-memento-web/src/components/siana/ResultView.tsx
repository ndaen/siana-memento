'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { useGenerationStore } from '@/stores/useGenerationStore'
import confetti from 'canvas-confetti'

const MAX_ITERATIONS = 3

const FEEDBACK_OPTIONS = [
  { id: 'texte-petit', label: 'Les textes sont trop petits', reformulation: 'agrandir les textes' },
  { id: 'texte-grand', label: 'Les textes sont trop grands', reformulation: 'réduire les textes' },
  { id: 'photos-visibles', label: 'Les photos ne sont pas assez visibles', reformulation: 'mettre les photos plus en avant' },
  { id: 'couleurs', label: 'Les couleurs ne me conviennent pas', reformulation: 'ajuster la palette de couleurs' },
  { id: 'style', label: "Le style n'est pas assez marqué", reformulation: 'renforcer le style' },
] as const

// Paires mutuellement exclusives — cocher l'un décoche l'autre
const EXCLUSIVE_PAIRS: Record<string, string> = {
  'texte-petit': 'texte-grand',
  'texte-grand': 'texte-petit',
}

function buildReformulation(options: string[], freeText: string): string {
  const selected = FEEDBACK_OPTIONS.filter((o) => options.includes(o.id))
  const parts: string[] = selected.map((o) => o.reformulation)
  if (freeText.trim()) parts.push(freeText.trim())
  if (parts.length === 0) return 'améliorer votre illustration'
  return parts.join(', ')
}

export default function ResultView() {
  const { generatedImageUrl, partner1Name, partner2Name, iterationsUsed, resetForPhotoChange } =
    useGenerationStore()
  const router = useRouter()
  const [isRevealed, setIsRevealed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [adjustStep, setAdjustStep] = useState<'form' | 'confirm'>('form')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  const confettiFiredRef = useRef(false)
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        confettiTimerRef.current = setTimeout(launchConfetti, 300)
      }
    }, 100)

    return () => {
      clearTimeout(revealTimer)
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current)
    }
  }, [])

  function handleRegenerate() {
    setIsAdjustOpen(false)
    setAdjustStep('form')
    setSelectedOptions([])
    setFreeText('')
    router.push('/generate/generating')
  }

  function handleChangePhotos() {
    setIsAdjustOpen(false)
    resetForPhotoChange()
    router.push('/generate/upload')
  }

  function toggleOption(id: string) {
    setSelectedOptions((prev) => {
      if (prev.includes(id)) return prev.filter((o) => o !== id)
      const exclusive = EXCLUSIVE_PAIRS[id]
      const without = exclusive ? prev.filter((o) => o !== exclusive) : prev
      return [...without, id]
    })
  }

  const remainingIterations = MAX_ITERATIONS - iterationsUsed
  const iterationLabel =
    remainingIterations > 0
      ? `Itération ${iterationsUsed}/${MAX_ITERATIONS} — ${remainingIterations} itération${remainingIterations > 1 ? 's' : ''} restante${remainingIterations > 1 ? 's' : ''} incluse${remainingIterations > 1 ? 's' : ''}`
      : `Itération ${iterationsUsed}/${MAX_ITERATIONS} — Aucune itération restante`

  const altText = `Illustration Save the Date pour ${partner1Name ?? ''} et ${partner2Name ?? ''}`

  if (!generatedImageUrl) return null

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
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsModalOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Voir l'illustration en plein écran"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={generatedImageUrl}
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
            onClick={() => { setAdjustStep('form'); setIsAdjustOpen(true) }}
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
            src={generatedImageUrl}
            alt={altText}
            className="w-full h-auto object-contain"
            style={{ touchAction: 'pinch-zoom' }}
          />
          <DialogClose asChild>
            <Button variant="outline" className="mt-2 w-full" aria-label="Fermer la vue plein écran">
              Fermer
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Dialog de feedback / ajustement */}
      <Dialog
        open={isAdjustOpen}
        onOpenChange={(open) => {
          setIsAdjustOpen(open)
          if (!open) setAdjustStep('form')
        }}
      >
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          {adjustStep === 'form' ? (
            <>
              <DialogTitle className="text-lg font-semibold">Ajuster mon illustration</DialogTitle>
              {/* Mascotte */}
              <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3">
                <Image src="/mascotte/siana-neutral.svg" alt="" aria-hidden="true" width={40} height={40} />
                <p className="text-sm font-medium text-primary">Qu&apos;est-ce que je peux améliorer ?</p>
              </div>
              {/* Checkboxes */}
              <div className="flex flex-col gap-3 mt-2" role="group" aria-label="Options d'ajustement">
                {FEEDBACK_OPTIONS.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-3">
                    <Checkbox
                      id={opt.id}
                      checked={selectedOptions.includes(opt.id)}
                      onCheckedChange={() => toggleOption(opt.id)}
                    />
                    <Label htmlFor={opt.id} className="cursor-pointer text-sm">{opt.label}</Label>
                  </div>
                ))}
              </div>
              {/* Champ libre */}
              <Textarea
                placeholder="Autre chose à préciser… (optionnel)"
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                className="resize-none mt-2"
                rows={2}
                aria-label="Feedback libre optionnel"
              />
              {/* Actions */}
              <div className="flex flex-col gap-2 mt-2">
                <Button
                  size="lg"
                  className="w-full font-semibold"
                  onClick={() => setAdjustStep('confirm')}
                  disabled={selectedOptions.length === 0 && !freeText.trim()}
                >
                  Voir la reformulation
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={handleChangePhotos}
                >
                  Changer mes photos
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogTitle className="text-lg font-semibold">Prêt pour la prochaine version ?</DialogTitle>
              {/* Reformulation mascotte */}
              <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3">
                <Image src="/mascotte/siana-neutral.svg" alt="" aria-hidden="true" width={40} height={40} />
                <p className="text-sm font-medium text-primary">
                  D&apos;accord, je vais {buildReformulation(selectedOptions, freeText)}. Prêt pour la prochaine version ?
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Il vous restera {remainingIterations - 1} itération{remainingIterations - 1 !== 1 ? 's' : ''} après celle-ci.
              </p>
              {/* Actions */}
              <div className="flex flex-col gap-2 mt-2">
                <Button size="lg" className="w-full font-semibold" onClick={handleRegenerate}>
                  Regénérer mon illustration
                </Button>
                <Button size="lg" variant="ghost" className="w-full" onClick={() => setAdjustStep('form')}>
                  Modifier mes ajustements
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

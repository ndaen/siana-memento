'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useGenerationStore } from '@/stores/useGenerationStore'
import { triggerGeneration } from '@/lib/api/designs'

const MASCOT_MESSAGES = [
  'Analyse de vos photos…',
  'Je prépare votre composition unique…',
  'Création de votre illustration…',
  'Ajout des détails artistiques…',
  'Application de la palette de couleurs…',
  'Peaufinage de votre style…',
  'Finalisation des derniers détails…',
  'Presque prêt… la magie opère ✨',
]

// Durée estimée de génération Gemini en ms (~28s)
const ESTIMATED_DURATION_MS = 28000

export default function GeneratingView() {
  const router = useRouter()
  const { designId, sessionToken, pendingFeedback, setGenerationResult, setStep } = useGenerationStore()
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isRetrying, setIsRetrying] = useState(false)
  // triggerCount permet de relancer la génération depuis handleRetry sans useCallback
  const [triggerCount, setTriggerCount] = useState(0)

  // Ref pour éviter le double appel API en React Strict Mode (dev : mount/unmount/remount)
  const hasStarted = useRef(false)
  const designIdRef = useRef(designId)
  const sessionTokenRef = useRef(sessionToken)
  const pendingFeedbackRef = useRef(pendingFeedback)
  // Ref partagée : le résultat de triggerGeneration, accessible par les deux effets
  const generationPromiseRef = useRef<Promise<Awaited<ReturnType<typeof triggerGeneration>>> | null>(null)

  // Synchroniser les refs avec les valeurs courantes
  useEffect(() => {
    designIdRef.current = designId
    sessionTokenRef.current = sessionToken
    pendingFeedbackRef.current = pendingFeedback
  })

  // Effet 1 — Déclencher l'appel API (une seule fois, protégé par hasStarted)
  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    const currentDesignId = designIdRef.current
    const currentSessionToken = sessionTokenRef.current
    const currentFeedback = pendingFeedbackRef.current

    if (!currentDesignId) return

    generationPromiseRef.current = triggerGeneration(currentDesignId, currentSessionToken, currentFeedback)
    // triggerCount dans les deps permet de relancer quand l'utilisateur clique "Réessayer"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerCount])

  // Effet 2 — Animation de la progress bar + attente du résultat
  // Cet effet n'est pas gardé par hasStarted et relance les timers à chaque mount,
  // ce qui corrige le problème en React Strict Mode (dev) où le premier mount
  // est nettoyé et seul le second mount reste actif.
  useEffect(() => {
    const currentDesignId = designIdRef.current
    if (!currentDesignId) return

    setHasError(false)
    setProgress(0)
    setIsRetrying(false)

    let cancelled = false
    const startTime = Date.now()

    // Animation fictive 0→90% sur la durée estimée.
    // La génération est synchrone côté Gemini : pas de progression réelle disponible.
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const simulatedProgress = Math.min(90, (elapsed / ESTIMATED_DURATION_MS) * 90)
      setProgress(simulatedProgress)
    }, 200)

    // Rotation des messages mascotte toutes les 5s
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MASCOT_MESSAGES.length)
    }, 5000)

    // Attendre le résultat de l'appel API (peut déjà être en cours depuis l'effet 1)
    const waitForResult = async () => {
      // Attendre que la promise soit disponible (effet 1 peut s'exécuter en parallèle)
      while (!generationPromiseRef.current && !cancelled) {
        await new Promise((r) => setTimeout(r, 50))
      }
      if (cancelled) return

      try {
        const result = await generationPromiseRef.current!
        if (cancelled) return

        clearInterval(progressInterval)
        clearInterval(messageInterval)

        if (!result.success) {
          setHasError(true)
          setErrorMessage(result.message)
          setProgress(0)
          return
        }

        // Succès : compléter la progress bar avant la navigation
        setProgress(100)
        // Stocker la preview watermarquée (URL Cloudinary) et le compteur d'itérations dans le store
        setGenerationResult(result.iterationsUsed, result.previewUrl ?? '')
        setStep('result')

        // Laisser 500ms pour voir 100% avant la navigation
        setTimeout(() => {
          if (!cancelled) router.push('/generate/result')
        }, 500)
      } catch {
        if (cancelled) return
        clearInterval(progressInterval)
        clearInterval(messageInterval)
        setHasError(true)
        setErrorMessage('Une erreur inattendue est survenue. Veuillez réessayer.')
        setProgress(0)
      }
    }
    waitForResult()

    return () => {
      cancelled = true
      clearInterval(progressInterval)
      clearInterval(messageInterval)
    }
    // triggerCount dans les deps permet de relancer quand l'utilisateur clique "Réessayer"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerCount])

  const handleRetry = () => {
    setIsRetrying(true)
    hasStarted.current = false
    generationPromiseRef.current = null
    setTriggerCount((c) => c + 1)
  }

  // Calcul du temps restant estimé affiché à l'utilisateur
  const estimatedSecondsLeft =
    progress < 90
      ? Math.max(1, Math.round(((90 - progress) / 90) * (ESTIMATED_DURATION_MS / 1000)))
      : 0

  if (hasError) {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <Image
          src="/mascotte/siana-error.svg"
          alt=""
          aria-hidden="true"
          width={80}
          height={80}
        />
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Oups, quelque chose s&apos;est passé…</h2>
          <p className="max-w-sm text-sm text-muted-foreground">{errorMessage}</p>
        </div>
        <Button
          id="retry-generation-btn"
          onClick={handleRetry}
          disabled={isRetrying}
          size="lg"
          className="font-semibold"
          aria-busy={isRetrying}
        >
          {isRetrying ? 'Réessai en cours…' : 'Réessayer la génération'}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8 py-10">
      {/* Mascotte animée */}
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/mascotte/siana-working.svg"
          alt=""
          aria-hidden="true"
          width={80}
          height={80}
          className="animate-pulse"
        />

        {/* Message rotatif — annoncé aux lecteurs d'écran via aria-live */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="flex max-w-sm items-start gap-3 rounded-xl bg-primary/10 px-5 py-3"
        >
          <p className="text-sm font-medium text-primary">{MASCOT_MESSAGES[messageIndex]}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full flex flex-col gap-3">
        <Progress value={progress} className="h-3" aria-label="Progression de la génération" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(progress)}%</span>
          <span>{progress < 90 ? `Environ ${estimatedSecondsLeft}s restantes` : 'Finalisation…'}</span>
        </div>
      </div>

      {/* Message rassurant */}
      <p className="max-w-xs text-center text-xs text-muted-foreground">
        Votre illustration unique est en cours de création. Cela prend généralement 20 à 30
        secondes.
      </p>

      {/* Annonce sr-only pour progression accessible */}
      <p className="sr-only" aria-live="polite">
        {progress < 100
          ? `Génération en cours : ${Math.round(progress)}%`
          : 'Génération terminée, redirection en cours.'}
      </p>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
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
import AuthModal from '@/components/siana/AuthModal'
import { getMe, type User } from '@/lib/api/auth'
import { createOrder, getOrder, getOrderBySession, type OrderData } from '@/lib/api/orders'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'

const MAX_ITERATIONS = 3

const FEEDBACK_OPTIONS = [
  { id: 'texte-petit', label: 'Les textes sont trop petits', reformulation: 'make the text (names, date, location) larger and more prominent' },
  { id: 'texte-grand', label: 'Les textes sont trop grands', reformulation: 'make the text (names, date, location) smaller and more subtle' },
  { id: 'photos-visibles', label: 'Les photos ne sont pas assez visibles', reformulation: 'make the couple more visible and central in the illustration' },
  { id: 'couleurs', label: 'Les couleurs ne me conviennent pas', reformulation: 'adjust the color palette for better harmony' },
  { id: 'style', label: "Le style n'est pas assez marqué", reformulation: 'make the artistic style more pronounced and distinctive' },
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
  const { generatedImageUrl, partner1Name, partner2Name, iterationsUsed, designId, sessionToken, isPaid, orderId, setPaid, resetForPhotoChange, setPendingFeedback } =
    useGenerationStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isRevealed, setIsRevealed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [adjustStep, setAdjustStep] = useState<'form' | 'confirm'>('form')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  const [isOrdering, setIsOrdering] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const confettiFiredRef = useRef(false)
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stripeVerifiedRef = useRef(false)

  // Check auth status on mount
  useEffect(() => {
    getMe().then((result) => setIsLoggedIn(result.success))
  }, [])

  // Reload order data on mount if isPaid but orderData is missing (e.g. page refresh)
  useEffect(() => {
    if (isPaid && orderId && !orderData && !searchParams.get('session_id')) {
      getOrder(orderId).then((result) => {
        if (result.success) setOrderData(result.order)
      })
    }
  }, [isPaid, orderId, orderData, searchParams])

  // Handle Stripe return — verify payment via API instead of trusting query param
  useEffect(() => {
    if (stripeVerifiedRef.current) return
    const sessionId = searchParams.get('session_id')
    const canceled = searchParams.get('canceled')

    if (sessionId) {
      stripeVerifiedRef.current = true
      getOrderBySession(sessionId).then((result) => {
        if (result.success && result.order.status === 'paid') {
          setPaid(result.order.id)
          setOrderData(result.order)
          toast.success('Paiement confirmé ! Votre design est en route.')
        } else if (result.success && result.order.status === 'pending') {
          // Race condition: webhook not yet processed — retry once after 3s
          setTimeout(() => {
            getOrderBySession(sessionId).then((retry) => {
              if (retry.success && retry.order.status === 'paid') {
                setPaid(retry.order.id)
                setOrderData(retry.order)
                toast.success('Paiement confirmé ! Votre design est en route.')
              } else {
                toast.info('Paiement en cours de confirmation. Vérifiez votre email dans quelques instants.')
              }
            })
          }, 3000)
        } else {
          toast.error('Impossible de vérifier le paiement. Contactez le support si le problème persiste.')
        }
      })
    } else if (canceled === 'true') {
      stripeVerifiedRef.current = true
      toast.info('Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.')
    }
  }, [searchParams, setPaid])

  async function handleOrder() {
    if (!designId || isPaid) return

    if (!isLoggedIn) {
      setIsAuthOpen(true)
      return
    }

    setIsOrdering(true)
    const result = await createOrder(designId, sessionToken)
    if (result.success) {
      window.location.href = result.checkoutUrl
    } else {
      toast.error(result.message)
      setIsOrdering(false)
    }
  }

  async function handleAuthSuccess(_user: User) {
    setIsAuthOpen(false)
    setIsLoggedIn(true)
    router.refresh()
    if (!designId || isPaid) return
    setIsOrdering(true)
    const result = await createOrder(designId, sessionToken)
    if (result.success) {
      window.location.href = result.checkoutUrl
    } else {
      toast.error(result.message)
      setIsOrdering(false)
    }
  }

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
    // Store feedback in the generation store so GeneratingView can send it to the API
    const reformulation = buildReformulation(selectedOptions, freeText)
    setPendingFeedback(reformulation)
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

  const displayImageUrl = generatedImageUrl ?? orderData?.design?.previewUrl ?? null
  const altText = `Illustration Save the Date pour ${partner1Name ?? orderData?.design?.partner1Name ?? ''} et ${partner2Name ?? orderData?.design?.partner2Name ?? ''}`

  if (!displayImageUrl && !isPaid) return null

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
      {displayImageUrl && (
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
            src={displayImageUrl}
            alt={altText}
            className="w-full h-auto object-contain"
          />
        </div>
      )}

      {/* Compteur d'itérations — masqué si paiement confirmé */}
      {!isPaid && (
        <p className="text-sm text-muted-foreground text-center" aria-live="polite">
          {iterationLabel}
        </p>
      )}

      {/* Actions / Confirmation */}
      {isPaid ? (
        <div className="flex w-full flex-col gap-4">
          {/* Confirmation block */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center gap-3 mb-3">
              <Image src="/mascotte/siana-success.svg" alt="" aria-hidden="true" width={48} height={48} />
              <div>
                <p className="text-lg font-bold text-primary">Votre Save the Date est en route !</p>
                <p className="text-sm text-muted-foreground">
                  Vérifiez votre boîte email{partner1Name && partner2Name ? ` — ${partner1Name} & ${partner2Name}` : ''}
                </p>
              </div>
            </div>

            {/* Order recap */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-3 border-t border-primary/10 pt-3">
              <dt className="text-muted-foreground">Montant</dt>
              <dd className="font-medium text-right">19,90 €</dd>
              {orderData?.createdAt && (
                <>
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="font-medium text-right">
                    {new Date(orderData.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </dd>
                </>
              )}
              {orderData?.design?.template && (
                <>
                  <dt className="text-muted-foreground">Template</dt>
                  <dd className="font-medium text-right capitalize">{orderData.design.template}</dd>
                </>
              )}
            </dl>
          </div>

          {/* Support message */}
          <p className="text-center text-sm text-muted-foreground">
            Une question ? Répondez simplement à l'email reçu ou contactez{' '}
            <a href="mailto:support@siana-memento.fr" className="text-primary underline underline-offset-2">
              support@siana-memento.fr
            </a>
          </p>
        </div>
      ) : (
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
            onClick={handleOrder}
            disabled={isOrdering}
          >
            {isOrdering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirection vers le paiement…
              </>
            ) : (
              'Commander mon poster — 19,90 €'
            )}
          </Button>
        </div>
      )}

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
          {displayImageUrl && (
            <img
              src={displayImageUrl}
              alt={altText}
              className="w-full h-auto object-contain"
              style={{ touchAction: 'pinch-zoom' }}
            />
          )}
          <DialogClose asChild>
            <Button variant="outline" className="mt-2 w-full" aria-label="Fermer la vue plein écran">
              Fermer
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Auth modal pour utilisateurs non connectés */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        returnTo="/generate/result"
        description="Connectez-vous pour finaliser votre commande."
      />

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

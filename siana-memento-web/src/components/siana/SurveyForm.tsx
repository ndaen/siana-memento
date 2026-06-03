'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getSurvey, submitSurvey } from '@/lib/api/survey'
import { Button } from '@/components/ui/button'

const SAGE = '#2D4A3E'
const RATINGS = [1, 2, 3, 4, 5] as const

type Status = 'loading' | 'invalid' | 'already' | 'form' | 'done'

function RatingQuestion({
  legend,
  name,
  value,
  onChange,
  error,
}: {
  legend: string
  name: string
  value: number | null
  onChange: (v: number) => void
  error?: string
}) {
  const errorId = `${name}-error`
  return (
    <fieldset aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined}>
      <legend className="font-display text-base font-semibold text-foreground">{legend}</legend>
      <div className="mt-3 flex gap-2" role="radiogroup" aria-label={legend}>
        {RATINGS.map((n) => {
          const selected = value === n
          return (
            <label
              key={n}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border text-lg font-semibold transition-colors focus-within:ring-2 focus-within:ring-offset-2"
              style={
                selected
                  ? { backgroundColor: SAGE, color: '#ffffff', borderColor: SAGE }
                  : { borderColor: '#d1d5db', color: SAGE }
              }
            >
              <input
                type="radio"
                name={name}
                value={n}
                checked={selected}
                onChange={() => onChange(n)}
                className="sr-only"
              />
              {n}
            </label>
          )
        })}
      </div>
      {error ? (
        <p id={errorId} className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}

export default function SurveyForm({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>('loading')
  const [overall, setOverall] = useState<number | null>(null)
  const [quality, setQuality] = useState<number | null>(null)
  const [recommend, setRecommend] = useState<boolean | null>(null)
  const [errors, setErrors] = useState<{ overall?: string; quality?: string; recommend?: string }>(
    {}
  )
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getSurvey(token).then((result) => {
      if (!result.success) {
        setStatus('invalid')
        return
      }
      setStatus(result.alreadySubmitted ? 'already' : 'form')
    })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: typeof errors = {}
    if (overall === null) nextErrors.overall = 'Merci de noter votre satisfaction globale.'
    if (quality === null) nextErrors.quality = 'Merci de noter la qualité de votre design.'
    if (recommend === null) nextErrors.recommend = 'Merci d’indiquer si vous nous recommanderiez.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    const result = await submitSurvey(token, {
      overallSatisfaction: overall!,
      designQuality: quality!,
      wouldRecommend: recommend!,
    })
    setSubmitting(false)

    if (result.success) {
      setStatus('done')
      return
    }
    if (result.errorCode === 'ALREADY_SUBMITTED') {
      setStatus('already')
      return
    }
    toast.error(result.message)
  }

  if (status === 'loading') {
    return (
      <div className="mt-8 space-y-4" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="mt-12 text-center">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Lien invalide ou expiré
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ce lien de survey n’est plus valide. Si vous pensez qu’il s’agit d’une erreur, répondez
          simplement à l’email reçu.
        </p>
      </div>
    )
  }

  if (status === 'already') {
    return (
      <div className="mt-12 text-center">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Merci, c’est déjà fait !
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Vous avez déjà partagé votre avis pour cette commande. Merci pour votre retour.
        </p>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="mt-12 text-center">
        <h2 className="font-display text-xl font-semibold text-foreground">Merci infiniment !</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre avis a bien été enregistré. Il nous aide à améliorer Siana Memento.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-8" noValidate>
      <RatingQuestion
        legend="Quelle est votre satisfaction globale ?"
        name="overall"
        value={overall}
        onChange={(v) => setOverall(v)}
        error={errors.overall}
      />
      <RatingQuestion
        legend="Comment évaluez-vous la qualité de votre design ?"
        name="quality"
        value={quality}
        onChange={(v) => setQuality(v)}
        error={errors.quality}
      />

      <fieldset
        aria-invalid={errors.recommend ? true : undefined}
        aria-describedby={errors.recommend ? 'recommend-error' : undefined}
      >
        <legend className="font-display text-base font-semibold text-foreground">
          Nous recommanderiez-vous à un proche ?
        </legend>
        <div className="mt-3 flex gap-3" role="radiogroup" aria-label="Recommandation">
          {[
            { label: 'Oui', val: true },
            { label: 'Non', val: false },
          ].map(({ label, val }) => {
            const selected = recommend === val
            return (
              <label
                key={label}
                className="flex h-11 min-w-20 cursor-pointer items-center justify-center rounded-lg border px-4 text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-offset-2"
                style={
                  selected
                    ? { backgroundColor: SAGE, color: '#ffffff', borderColor: SAGE }
                    : { borderColor: '#d1d5db', color: SAGE }
                }
              >
                <input
                  type="radio"
                  name="recommend"
                  checked={selected}
                  onChange={() => setRecommend(val)}
                  className="sr-only"
                />
                {label}
              </label>
            )
          })}
        </div>
        {errors.recommend ? (
          <p id="recommend-error" className="mt-2 text-sm text-destructive">
            {errors.recommend}
          </p>
        ) : null}
      </fieldset>

      <Button type="submit" disabled={submitting} style={{ backgroundColor: SAGE }}>
        {submitting ? 'Envoi…' : 'Envoyer mon avis'}
      </Button>
    </form>
  )
}

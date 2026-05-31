'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGenerationStore } from '@/stores/useGenerationStore'
import { updateDesignConfigure } from '@/lib/api/designs'

const configSchema = z.object({
  partner1Name: z.string().trim().min(1, 'Ce champ est requis').max(100, 'Maximum 100 caractères'),
  partner2Name: z.string().trim().min(1, 'Ce champ est requis').max(100, 'Maximum 100 caractères'),
  weddingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide')
    .refine(
      (value) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const parsed = new Date(value + 'T12:00:00')
        return parsed.getTime() >= today.getTime()
      },
      { message: 'La date du mariage doit être à venir' }
    ),
  weddingLocation: z
    .string()
    .trim()
    .min(1, 'Ce champ est requis')
    .max(255, 'Maximum 255 caractères'),
})

type ConfigFormValues = z.infer<typeof configSchema>

function capitalizeWords(value: string): string {
  return value
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function buildPreviewText(
  partner1: string,
  partner2: string,
  dateIso: string,
  location: string
): string {
  if (!partner1 || !partner2 || !dateIso || !location) return ''
  // T12:00:00 évite le décalage UTC/fuseau horaire (Paris = UTC+1/+2)
  const date = new Date(dateIso + 'T12:00:00')
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
  return `${partner1} & ${partner2} — ${formattedDate} — ${location}`
}

export default function ConfigForm() {
  const router = useRouter()
  const {
    designId,
    sessionToken,
    setWeddingData,
    setStep,
    reset,
    partner1Name: storedPartner1Name,
    partner2Name: storedPartner2Name,
    weddingDate: storedWeddingDate,
    weddingLocation: storedWeddingLocation,
  } = useGenerationStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isValid },
  } = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    mode: 'onChange',
    defaultValues: {
      partner1Name: storedPartner1Name ?? '',
      partner2Name: storedPartner2Name ?? '',
      weddingDate: storedWeddingDate ?? '',
      weddingLocation: storedWeddingLocation ?? '',
    },
  })

  // useWatch est compatible React Compiler (contrairement à watch())
  const partner1Name = useWatch({ control, name: 'partner1Name' })
  const partner2Name = useWatch({ control, name: 'partner2Name' })
  const weddingDate = useWatch({ control, name: 'weddingDate' })
  const weddingLocation = useWatch({ control, name: 'weddingLocation' })

  const previewText = buildPreviewText(partner1Name, partner2Name, weddingDate, weddingLocation)

  async function onSubmit(values: ConfigFormValues) {
    if (!designId) return
    setIsSubmitting(true)

    const result = await updateDesignConfigure(designId, values, sessionToken)

    if (!result.success) {
      if (result.errorCode === 'DESIGN_NOT_FOUND' || result.errorCode === 'FORBIDDEN') {
        toast.error('Ce design n\'est plus accessible. Veuillez recommencer.')
        reset()
        router.push('/generate/upload')
        return
      }
      toast.error(result.message)
      setIsSubmitting(false)
      return
    }

    setWeddingData(values)
    setStep('generating')
    router.push('/generate/generating')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      {/* Message d'accueil de la mascotte */}
      <div className="flex items-start gap-3 rounded-xl bg-primary/10 px-4 py-3">
        <Image
          src="/mascotte/siana-neutral.svg"
          alt=""
          aria-hidden="true"
          width={40}
          height={40}
          className="shrink-0"
        />
        <p className="text-sm text-primary">
          Parfait ! Maintenant, dites-moi tout sur votre mariage. Je vais créer quelque chose de
          magique pour vous ✨
        </p>
      </div>

      {/* Prénom 1 */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="partner1Name">
          Comment s&apos;appellent les futurs mariés ?
          <span className="sr-only">(Prénom du premier marié)</span>
        </Label>
        <Input
          id="partner1Name"
          type="text"
          placeholder="Prénom 1"
          autoCapitalize="words"
          autoComplete="given-name"
          aria-describedby={errors.partner1Name ? 'partner1Name-error' : undefined}
          aria-invalid={!!errors.partner1Name}
          {...register('partner1Name', {
            onChange: (e) => {
              const capitalized = capitalizeWords(e.target.value)
              setValue('partner1Name', capitalized, { shouldValidate: true })
            },
          })}
        />
        {errors.partner1Name && (
          <p id="partner1Name-error" role="alert" className="text-sm text-destructive">
            {errors.partner1Name.message}
          </p>
        )}
      </div>

      {/* Prénom 2 */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="partner2Name">Et le prénom du second marié ?</Label>
        <Input
          id="partner2Name"
          type="text"
          placeholder="Prénom 2"
          autoCapitalize="words"
          autoComplete="given-name"
          aria-describedby={errors.partner2Name ? 'partner2Name-error' : undefined}
          aria-invalid={!!errors.partner2Name}
          {...register('partner2Name', {
            onChange: (e) => {
              const capitalized = capitalizeWords(e.target.value)
              setValue('partner2Name', capitalized, { shouldValidate: true })
            },
          })}
        />
        {errors.partner2Name && (
          <p id="partner2Name-error" role="alert" className="text-sm text-destructive">
            {errors.partner2Name.message}
          </p>
        )}
      </div>

      {/* Date du mariage */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="weddingDate">Quelle est la date de votre mariage ?</Label>
        <Input
          id="weddingDate"
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          aria-describedby={errors.weddingDate ? 'weddingDate-error' : undefined}
          aria-invalid={!!errors.weddingDate}
          {...register('weddingDate')}
        />
        {errors.weddingDate && (
          <p id="weddingDate-error" role="alert" className="text-sm text-destructive">
            {errors.weddingDate.message}
          </p>
        )}
      </div>

      {/* Lieu du mariage */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="weddingLocation">Où se célèbre votre mariage ?</Label>
        <Input
          id="weddingLocation"
          type="text"
          placeholder="ex : Château de Lastours"
          autoComplete="off"
          aria-describedby={errors.weddingLocation ? 'weddingLocation-error' : undefined}
          aria-invalid={!!errors.weddingLocation}
          {...register('weddingLocation')}
        />
        {errors.weddingLocation && (
          <p id="weddingLocation-error" role="alert" className="text-sm text-destructive">
            {errors.weddingLocation.message}
          </p>
        )}
      </div>

      {/* Preview du texte final — visible dès que tous les champs sont remplis et valides */}
      {previewText && (
        <div
          role="region"
          aria-label="Aperçu du texte final de votre Save the Date"
          className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 text-center"
        >
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Aperçu de votre Save the Date
          </p>
          <p className="font-display text-base font-semibold text-foreground">{previewText}</p>
        </div>
      )}

      {/* Bouton sticky sur mobile */}
      <div className="sticky bottom-0 -mx-4 bg-background/95 px-4 pb-4 pt-2 backdrop-blur-sm sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <Button
          type="submit"
          size="lg"
          className="w-full font-semibold"
          disabled={!isValid || isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Enregistrement...' : "C'est parfait, générer mon design →"}
        </Button>
      </div>
    </form>
  )
}

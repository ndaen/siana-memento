'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useGenerationStore } from '@/stores/useGenerationStore'
import { updateDesignTemplate } from '@/lib/api/designs'
import { TEMPLATES, getTemplate, type TemplateId } from '@/lib/templates'

export type { TemplateId }

export default function TemplateSelector() {
  const router = useRouter()
  const {
    designId,
    sessionToken,
    selectedTemplate,
    selectedPalette,
    setTemplate,
    setPalette,
    setStep,
    reset,
  } = useGenerationStore()
  const [selected, setSelected] = useState<TemplateId | null>(selectedTemplate as TemplateId | null)
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(() => {
    if (selectedTemplate && selectedPalette) return selectedPalette
    if (selectedTemplate) return getTemplate(selectedTemplate as TemplateId).palettes[0].id
    return null
  })
  const [isLoading, setIsLoading] = useState(false)

  // Reset la palette à la première du template quand le template sélectionné change
  useEffect(() => {
    if (!selected) {
      setSelectedPaletteId(null)
      return
    }
    const palettes = getTemplate(selected).palettes
    if (!selectedPaletteId || !palettes.some((p) => p.id === selectedPaletteId)) {
      setSelectedPaletteId(palettes[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  async function handleContinue() {
    if (!selected || !designId || !selectedPaletteId) return
    setIsLoading(true)

    const result = await updateDesignTemplate(designId, selected, sessionToken, selectedPaletteId)

    if (!result.success) {
      toast.error(result.message)

      // Si le design est expiré ou introuvable en DB (Story 3.7 / RGPD)
      if (result.errorCode === 'DESIGN_NOT_FOUND') {
        reset()
        router.push('/generate/upload')
        return
      }

      setIsLoading(false)
      return
    }

    setTemplate(selected)
    setPalette(selectedPaletteId)
    setStep('configure')
    router.push('/generate/configure')
  }

  function handleBack() {
    setStep('upload')
    router.push('/generate/upload')
  }

  const selectedTemplateConfig = selected ? getTemplate(selected) : null

  return (
    <div className="flex flex-col gap-6">
      <ul
        aria-label="Sélection du style artistique"
        className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2"
      >
        {TEMPLATES.map((tpl) => {
          const isSelected = selected === tpl.id
          const preview = tpl.palettes[0]
          return (
            <li key={tpl.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={`Choisir le style ${tpl.name} — ${tpl.identity}`}
                onClick={() => setSelected(tpl.id)}
                className={[
                  'relative flex w-full flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200',
                  'hover:scale-[1.02] active:scale-[0.99]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D4A3E] focus-visible:ring-offset-2',
                  isSelected
                    ? 'border-[#2D4A3E] bg-[#2D4A3E]/5 shadow-md'
                    : 'border-border bg-card hover:border-[#2D4A3E]/40',
                ].join(' ')}
              >
                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#2D4A3E] text-xs text-white"
                  >
                    ✓
                  </span>
                )}

                <div className="flex gap-1.5" aria-hidden="true">
                  {[preview.primaryColor, preview.secondaryColor, preview.accentColor].map(
                    (color, i) => (
                      <span
                        key={i}
                        className="h-6 w-6 rounded-full border border-black/10 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>

                <div>
                  <p className="font-display text-base font-semibold leading-tight">{tpl.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{tpl.identity}</p>
                </div>

                <p className="text-xs italic text-muted-foreground/70">{tpl.illustration}</p>
              </button>
            </li>
          )
        })}
      </ul>

      {selectedTemplateConfig && (
        <fieldset className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <legend className="px-1 text-sm font-semibold">
            Palette de couleurs — {selectedTemplateConfig.name}
          </legend>
          <div
            role="radiogroup"
            aria-label={`Choisir une palette pour le style ${selectedTemplateConfig.name}`}
            className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          >
            {selectedTemplateConfig.palettes.map((palette) => {
              const isChecked = selectedPaletteId === palette.id
              return (
                <button
                  key={palette.id}
                  type="button"
                  role="radio"
                  aria-checked={isChecked}
                  aria-label={`Palette ${palette.name} : ${palette.primaryColor}, ${palette.secondaryColor}, ${palette.accentColor}`}
                  onClick={() => setSelectedPaletteId(palette.id)}
                  className={[
                    'relative flex items-center gap-3 rounded-lg border-2 p-3 pr-8 text-left transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D4A3E] focus-visible:ring-offset-2',
                    isChecked
                      ? 'border-[#2D4A3E] bg-[#2D4A3E]/10 shadow-sm ring-1 ring-[#2D4A3E] dark:bg-[#2D4A3E]/30'
                      : 'border-border hover:border-[#2D4A3E]/40',
                  ].join(' ')}
                >
                  {isChecked && (
                    <span
                      aria-hidden="true"
                      className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-[#2D4A3E] text-[10px] font-bold text-white"
                    >
                      ✓
                    </span>
                  )}
                  <div className="flex gap-1" aria-hidden="true">
                    {[palette.primaryColor, palette.secondaryColor, palette.accentColor].map(
                      (color, i) => (
                        <span
                          key={i}
                          className="h-5 w-5 rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      )
                    )}
                  </div>
                  <span className="text-xs font-medium">{palette.name}</span>
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 bg-background/95 px-4 pb-4 pt-2 backdrop-blur-sm sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <Button
          size="lg"
          className="w-full font-semibold"
          disabled={!selected || !selectedPaletteId || isLoading}
          onClick={handleContinue}
          aria-busy={isLoading}
        >
          {isLoading ? 'Enregistrement...' : 'Continuer →'}
        </Button>
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleBack}>
          ← Modifier les photos
        </Button>
      </div>
    </div>
  )
}

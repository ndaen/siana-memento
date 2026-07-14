import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

import { Eyebrow } from '@/components/ui/eyebrow'
import CtaButton from '@/components/siana/landing/CtaButton'

/**
 * Hero avant/après (Story 7.2) — server component pour un LCP optimal :
 * texte, pricing et CTA rendus côté serveur, image "après" prioritaire.
 * Aucune animation JS ni WebGL (LCP-first).
 *
 * Le couple "avant" (hero-couple.png) et le "après" (hero-std.png) sont le
 * MÊME couple, générés par Gemini (gemini-2.5-flash-image) : photo text→image
 * puis STD image→image via le vrai prompt produit.
 */
export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative -mt-16 flex min-h-svh flex-col justify-center px-6 pb-20 pt-28 sm:pt-32"
    >
      <div className="mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Texte + CTA — rendu en premier pour que le CTA soit above the fold sur mobile */}
        <div className="text-center lg:text-left">
          <Eyebrow className="mb-4">Faire-part de mariage par IA</Eyebrow>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Votre Save the Date, <span className="text-primary">à votre image</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl lg:mx-0">
            Générez le Save the Date qui vous ressemble avec vos propres photos, en quelques minutes.
          </p>
          <div className="mt-8 flex flex-col items-center gap-5 sm:flex-row sm:justify-center lg:justify-start">
            <CtaButton href="/generate/upload">Créer mon Save the Date</CtaButton>
            <p className="flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-bold text-foreground">19,90&nbsp;€</span>
              <span className="whitespace-nowrap text-sm text-muted-foreground">par design</span>
            </p>
          </div>
        </div>

        {/* Visuel avant/après — même couple, généré par Gemini */}
        <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">
          {/* Après — le Save the Date fini (œuvre principale, élément LCP) */}
          <figure className="overflow-hidden rounded-3xl border bg-card shadow-xl">
            <div className="relative aspect-[3/4]">
              <Image
                src="/home/hero-std-v2.png"
                alt="Save the Date illustré généré par IA dans le style Bohème, à partir d'une photo de couple"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 40vw"
                className="object-cover"
              />
            </div>
            <figcaption className="border-t px-4 py-2 text-center">
              <Eyebrow variant="accent" className="text-xs">
                Votre Save the Date
              </Eyebrow>
            </figcaption>
          </figure>

          {/* Avant — la photo du couple */}
          <div className="absolute -left-3 -top-5 w-24 rotate-[-6deg] sm:w-28 lg:-left-8 lg:-top-8 lg:w-32">
            <figure className="overflow-hidden rounded-2xl border bg-card shadow-md">
              <div className="relative aspect-[3/4]">
                <Image
                  src="/home/hero-couple-v2.png"
                  alt="Votre photo de couple"
                  fill
                  sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px"
                  className="object-cover"
                />
              </div>
              <figcaption className="px-2 py-1 text-center">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Votre photo
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>

      <a
        href="#how-it-works"
        aria-label="Découvrir comment ça marche"
        className="absolute inset-x-0 bottom-6 mx-auto flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      >
        {/* motion-safe: l'animation en boucle est coupée si l'utilisateur a demandé
            moins de mouvement (WCAG 2.2.2 — aucun kill-switch global dans globals.css). */}
        <ChevronDown className="size-6 motion-safe:animate-bounce" aria-hidden />
      </a>
    </section>
  )
}

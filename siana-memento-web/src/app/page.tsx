import { Camera, Palette, Sparkles, Star } from "lucide-react";
import HeroSection from "@/components/siana/landing/HeroSection";
import Gallery from "@/components/siana/landing/Gallery";
import ScrollFloat from "@/components/ScrollFloat";
import ScrollReveal from "@/components/siana/landing/ScrollReveal";
import StarBorder from "@/components/StarBorder";
import { getPublicTestimonials } from "@/lib/api/testimonials";

// Rendu dynamique : la landing fetch les testimonials à chaque requête pour refléter
// immédiatement les changements admin (activer/désactiver/ajouter/supprimer) sans
// redéploiement Vercel (Story 6.7, AC#2/#3).
export const dynamic = "force-dynamic";

const steps = [
  {
    icon: Camera,
    title: "Uploadez vos photos",
    description:
      "Sélectionnez jusqu'à 2 photos de votre couple. Elles serviront de référence pour créer une illustration unique qui vous ressemble.",
  },
  {
    icon: Palette,
    title: "Choisissez votre style",
    description:
      "Parcourez nos 5 univers artistiques — Bohème, Moderne, Classique, Vintage ou Minimaliste — et sélectionnez celui qui correspond à votre mariage.",
  },
  {
    icon: Sparkles,
    title: "Recevez votre illustration en 15 min",
    description:
      "Notre IA génère une illustration personnalisée de votre couple dans le style choisi. Recevez votre Save the Date haute résolution par email, prêt à imprimer ou partager.",
  },
];

export default async function Home() {
  // Témoignages actifs récupérés depuis l'API (dégradation gracieuse : [] si l'API échoue).
  const testimonials = await getPublicTestimonials();

  return (
    <div className="relative min-h-screen bg-background">
      <main className="relative z-10">
        {/* Hero avant/après (Story 7.2) — server-rendered, CtaButton + promesse de temps */}
        <HeroSection />

        {/* Comment ça marche */}
        <section
          id="how-it-works"
          aria-labelledby="how-it-works-heading"
          className="scroll-mt-20 mx-auto max-w-5xl px-6 py-16 sm:py-24"
        >
          <ScrollFloat
            containerClassName="font-display mb-12 text-center font-bold tracking-tight text-foreground sm:mb-16"
            textClassName="text-3xl sm:text-4xl leading-[1.2]"
          >
            Comment ça marche
          </ScrollFloat>

          <ScrollReveal className="grid gap-8 sm:grid-cols-3 sm:gap-12">
            {steps.map((step, i) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <step.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <span
                  className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <h3 className="font-display mb-2 text-lg font-semibold text-foreground">
                  <span className="sr-only">Étape {i + 1} : </span>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </ScrollReveal>
        </section>

        {/* Galerie "même couple × 5 templates" (Story 7.4) */}
        <Gallery />

        {/* Témoignages clients */}
        {testimonials.length > 0 && (
          <section
            id="testimonials"
            aria-labelledby="testimonials-heading"
            className="scroll-mt-20 mx-auto max-w-5xl px-6 py-16 sm:py-24"
          >
            <ScrollFloat
              containerClassName="font-display mb-4 text-center font-bold tracking-tight text-foreground"
              textClassName="text-3xl sm:text-4xl leading-[1.2]"
            >
              Ce que nos couples en pensent
            </ScrollFloat>
            <p className="mx-auto mb-12 max-w-2xl text-center text-base text-muted-foreground sm:mb-16 sm:text-lg">
              Découvrez pourquoi ils ont choisi Siana Memento pour leur
              Save the Date.
            </p>

            <ScrollReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <article
                  key={testimonial.id}
                  className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div role="img" aria-label={`${testimonial.rating} étoile${testimonial.rating > 1 ? 's' : ''} sur 5`} className="mb-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        aria-hidden="true"
                        className={
                          i < testimonial.rating
                            ? 'h-4 w-4 fill-current text-primary'
                            : 'h-4 w-4 text-muted-foreground/40'
                        }
                      />
                    ))}
                  </div>
                  <blockquote className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    &laquo;&nbsp;{testimonial.content}&nbsp;&raquo;
                  </blockquote>
                  <p className="text-sm font-semibold text-foreground">
                    {testimonial.authorName}
                  </p>
                </article>
              ))}
            </ScrollReveal>
          </section>
        )}

        {/* CTA secondaire */}
        <section aria-labelledby="cta-heading" className="px-6 py-16 text-center sm:py-24">
          <ScrollFloat
            containerClassName="font-display mb-4 font-bold text-foreground text-center"
            textClassName="text-2xl sm:text-3xl leading-[1.2]"
          >
            Prêt à créer votre Save the Date ?
          </ScrollFloat>
          <p className="mx-auto mb-8 max-w-md text-base text-muted-foreground">
            Uploadez vos photos, choisissez un style, et recevez votre
            illustration personnalisée en quelques minutes. Un design unique pour
            un jour unique.
          </p>
          <StarBorder as="a" color="#C9A84C" speed="6s" thickness={2} className="text-base cursor-pointer no-underline" href="/generate/upload">
            Commencer maintenant
          </StarBorder>
        </section>
      </main>

    </div>
  );
}

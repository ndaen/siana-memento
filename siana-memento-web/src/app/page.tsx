import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/siana/ThemeToggle";
import UserMenu from "@/components/siana/UserMenu";
import { Camera, Palette, Sparkles } from "lucide-react";

const examples = [
  {
    template: "Bohème",
    couple: "Sophie & Thomas",
    description: "Un mariage champêtre en Provence, style aquarelle douce aux tons terre cuite.",
    bgColor: "bg-[#C17A6F]",
    accentColor: "text-[#F5E6D3]",
  },
  {
    template: "Moderne",
    couple: "Léa & Antoine",
    description: "Un mariage urbain et graphique, lignes géométriques en noir et or.",
    bgColor: "bg-[#1a1a1a]",
    accentColor: "text-[#C9A84C]",
  },
  {
    template: "Classique",
    couple: "Marie & Hugo",
    description: "Un mariage intemporel et raffiné, portrait dessiné aux tons bordeaux et crème.",
    bgColor: "bg-[#800020]",
    accentColor: "text-[#F5E6D3]",
  },
  {
    template: "Vintage",
    couple: "Camille & Julien",
    description: "Un mariage rétro inspiré des années 70, tons ocre et olive chaleureux.",
    bgColor: "bg-[#A67C52]",
    accentColor: "text-[#F5E6D3]",
  },
  {
    template: "Minimaliste",
    couple: "Emma & Lucas",
    description: "Un mariage épuré et zen, dessin one-line sur fond nude tout en sobriété.",
    bgColor: "bg-[#E8DCD4]",
    accentColor: "text-[#8B7355]",
  },
];

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

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Botanical background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full bg-primary/8 blur-3xl dark:bg-primary/20" />
        <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl dark:bg-primary/15" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/40 blur-3xl dark:bg-primary/10" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <ThemeToggle />
        <UserMenu />
      </header>

      <main id="main-content" className="relative z-10">
        {/* Hero section */}
        <section className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 pb-16 text-center">
          <div className="mb-6 sm:mb-8">
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Siana&nbsp;
              <span className="text-primary">Memento</span>
            </h1>
          </div>

          <p className="mx-auto mb-4 max-w-xl text-lg leading-relaxed text-muted-foreground sm:mb-6 sm:text-xl md:text-2xl">
            Générez votre Save the Date unique avec vos photos en{" "}
            <strong className="font-semibold text-foreground">
              15 minutes
            </strong>
          </p>

          <div className="mb-8 flex items-baseline gap-1.5 sm:mb-12">
            <span className="text-4xl font-bold text-foreground sm:text-5xl">
              19,90&nbsp;€
            </span>
            <span className="text-sm text-muted-foreground sm:text-base">
              par design
            </span>
          </div>

          <div className="mb-8 sm:mb-12">
            <Button size="lg" asChild className="w-full sm:w-auto text-base">
              <Link href="/generate/upload">Créer mon Save the Date</Link>
            </Button>
          </div>
        </section>

        {/* Comment ça marche */}
        <section
          aria-labelledby="how-it-works-heading"
          className="mx-auto max-w-5xl px-6 py-16 sm:py-24"
        >
          <h2
            id="how-it-works-heading"
            className="font-display mb-12 text-center text-3xl font-bold tracking-tight text-foreground sm:mb-16 sm:text-4xl"
          >
            Comment ça marche
          </h2>

          <ol className="grid gap-8 sm:grid-cols-3 sm:gap-12">
            {steps.map((step, i) => (
              <li key={step.title} className="flex flex-col items-center text-center">
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
              </li>
            ))}
          </ol>
        </section>

        {/* Galerie d'exemples */}
        <section
          aria-labelledby="gallery-heading"
          className="mx-auto max-w-6xl px-6 py-16 sm:py-24"
        >
          <h2
            id="gallery-heading"
            className="font-display mb-4 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Des styles pour chaque histoire
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-base text-muted-foreground sm:mb-16 sm:text-lg">
            Chaque couple est unique. Découvrez nos cinq univers artistiques,
            conçus pour refléter votre personnalité et le ton de votre mariage.
            Notre IA transforme vos photos en une illustration sur mesure.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {examples.map((example) => (
              <article
                key={example.template}
                aria-label={`${example.couple} — Style ${example.template}`}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Placeholder illustration */}
                <div
                  className={`${example.bgColor} flex aspect-[3/4] items-center justify-center`}
                  aria-hidden="true"
                >
                  <span
                    className={`${example.accentColor} text-lg font-semibold opacity-60`}
                  >
                    {example.template}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {example.couple}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Style {example.template}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {example.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CTA secondaire */}
        <section aria-labelledby="cta-heading" className="px-6 py-16 text-center sm:py-24">
          <h2 id="cta-heading" className="font-display mb-4 text-2xl font-bold text-foreground sm:text-3xl">
            Prêt à créer votre Save the Date ?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-base text-muted-foreground">
            Uploadez vos photos, choisissez un style, et recevez votre
            illustration personnalisée en quelques minutes. Un design unique pour
            un jour unique.
          </p>
          <Button size="lg" asChild className="w-full sm:w-auto text-base">
            <Link href="/generate/upload">Commencer maintenant</Link>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-6 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 Siana Memento · Fait avec soin en France ·{" "}
          <a
            href="mailto:support@siana-memento.com"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Nous contacter
          </a>
        </p>
      </footer>
    </div>
  );
}

import WaitlistForm from "@/components/siana/WaitlistForm";
import { ThemeToggle } from "@/components/siana/ThemeToggle";
import UserMenu from "@/components/siana/UserMenu";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Botanical background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full bg-[#2d4a3e]/8 blur-3xl dark:bg-[#2d4a3e]/20" />
        <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-[#b5c4b1]/20 blur-3xl dark:bg-[#2d4a3e]/15" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5efe6]/40 blur-3xl dark:bg-[#1e2d26]/40" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <ThemeToggle />
        <UserMenu />
      </header>

      {/* Main content */}
      <main
        id="main-content"
        className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 pb-16 text-center"
      >
        {/* Brand + badge */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <span className="inline-block rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-semibold tracking-[0.15em] uppercase text-primary dark:bg-primary/15">
            Bientôt disponible
          </span>

          <h1 className="text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl md:text-7xl">
            Siana&nbsp;
            <span className="text-primary">Memento</span>
          </h1>
        </div>

        {/* Value proposition */}
        <p className="mx-auto mb-6 max-w-xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
          Générez votre Save the Date unique avec vos photos en{" "}
          <strong className="font-semibold text-foreground">15 minutes</strong>
        </p>

        {/* Pricing */}
        <div className="mb-12 flex items-baseline gap-1.5">
          <h2 className="text-5xl font-bold text-foreground">
            19,90&nbsp;€
          </h2>
          <span className="text-base text-muted-foreground">par design</span>
        </div>

        {/* How it works — 3 steps */}
        <ol
          aria-label="Comment ça marche"
          className="mb-12 flex flex-col items-center gap-4 sm:flex-row sm:gap-8"
        >
          {[
            { n: "1", label: "Uploadez vos photos" },
            { n: "2", label: "Choisissez un style" },
            { n: "3", label: "L'IA crée votre design" },
          ].map(({ n, label }) => (
            <li key={n} className="flex items-center gap-3 text-sm text-muted-foreground">
              <h3
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                aria-hidden="true"
              >
                {n}
              </h3>
              {label}
            </li>
          ))}
        </ol>

        {/* Waitlist form */}
        <section
          aria-labelledby="waitlist-heading"
          className="w-full max-w-lg"
        >
          <h2 id="waitlist-heading" className="sr-only">
            Rejoindre la liste d&rsquo;attente
          </h2>
          <WaitlistForm />
          <p className="mt-3 text-xs text-muted-foreground">
            Aucun spam. Notification de lancement uniquement. Données supprimées
            sur demande.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-6 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 Siana Memento · Fait avec soin en France
        </p>
      </footer>
    </div>
  );
}

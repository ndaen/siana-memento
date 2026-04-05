import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 bg-[#2D4A3E] px-6 py-12 text-white sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Logo & tagline */}
          <div>
            <p className="font-display text-xl font-bold tracking-tight">
              Siana <span className="text-white/80">Memento</span>
            </p>
            <p className="mt-2 text-sm text-white/60">
              Save the Date personnalisé par IA
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer">
            <ul className="flex flex-col gap-3 text-sm sm:items-end">
              <li>
                <Link
                  href="/generate/upload"
                  className="text-white/80 underline-offset-2 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D4A3E]"
                >
                  Créer mon Save the Date
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-white/80 underline-offset-2 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D4A3E]"
                >
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@siana-memento.fr"
                  className="text-white/80 underline-offset-2 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D4A3E]"
                >
                  support@siana-memento.fr
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-white/20 pt-6 text-center text-xs text-white/50">
          © 2026 Siana Memento · Fait avec soin en France
        </div>
      </div>
    </footer>
  );
}

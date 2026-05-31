import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-[#b5c4b1] px-6 py-12 text-[#1f3329] sm:py-16 dark:bg-[#1e2d26] dark:text-[#dfe9dc]">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Logo & tagline */}
          <div>
            <p className="font-display text-xl font-bold tracking-tight">
              Siana <span className="opacity-70">Memento</span>
            </p>
            <p className="mt-2 text-sm opacity-70">
              Save the Date personnalisé par IA
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer">
            <ul className="flex flex-col gap-3 text-sm sm:items-end">
              <li>
                <Link
                  href="/generate/upload"
                  className="underline-offset-2 opacity-80 transition-opacity hover:opacity-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-[#b5c4b1] dark:focus-visible:ring-offset-[#1e2d26]"
                >
                  Créer mon Save the Date
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="underline-offset-2 opacity-80 transition-opacity hover:opacity-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-[#b5c4b1] dark:focus-visible:ring-offset-[#1e2d26]"
                >
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@siana-memento.fr"
                  className="underline-offset-2 opacity-80 transition-opacity hover:opacity-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-[#b5c4b1] dark:focus-visible:ring-offset-[#1e2d26]"
                >
                  support@siana-memento.fr
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-current/20 pt-6 text-center text-xs opacity-60">
          © {year} Siana Memento · Fait avec soin en France
        </div>
      </div>
    </footer>
  );
}

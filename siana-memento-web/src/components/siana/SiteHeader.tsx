'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import UserMenu from '@/components/siana/UserMenu'
import { getMe } from '@/lib/api/auth'
import { Sun, Moon, Settings } from 'lucide-react'

const navLinks = [
  { href: '#how-it-works', id: 'how-it-works', label: 'Comment ça marche' },
  { href: '#gallery', id: 'gallery', label: 'Galerie' },
  { href: '#testimonials', id: 'testimonials', label: 'Témoignages' },
]

export default function SiteHeader() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const { theme, setTheme } = useTheme()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    getMe().then((result) => {
      setIsLoggedIn(result.success)
      setLoading(false)
    })
  }, [])

  // Track active section for scroll spy
  useEffect(() => {
    if (!isHome) return

    const sectionIds = navLinks.map((l) => l.id)
    const observers: IntersectionObserver[] = []

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (!el) continue

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { rootMargin: '-20% 0px -60% 0px' }
      )
      observer.observe(el)
      observers.push(observer)
    }

    return () => observers.forEach((o) => o.disconnect())
  }, [isHome])

  // Forme "pill" flottante dès que le header n'est plus transparent
  // (au scroll, et partout hors home). Largeur et hauteur constantes : seuls
  // fond/bordure/ombre transitionnent → aucun saut de layout au seuil de scroll.
  const pill = scrolled || !isHome

  return (
    <header className="sticky top-0 z-40 px-4 sm:px-6">
      <div
        className={`mx-auto mt-2 grid h-16 max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-full border px-4 transition-colors duration-300 sm:px-6 ${
          pill
            ? 'border-border/40 bg-background/80 shadow-sm backdrop-blur-md'
            : 'border-transparent bg-transparent'
        }`}
      >
        {/* Logo + nom — colonne 1. Placement explicite des colonnes : la nav
            passe en display:none sous lg, il ne faut pas que la zone droite
            remonte dans la colonne centrale. */}
        <Link href="/" className="col-start-1 flex shrink-0 items-center gap-2 justify-self-start">
          <Image src="/logo.svg" width={32} height={32} alt="" />
          <span className="font-display whitespace-nowrap text-sm font-semibold text-foreground">
            Siana Memento
          </span>
        </Link>

        {/* Nav ancres — colonne 2 (home, ≥lg pour laisser la place aux boutons) */}
        {isHome && (
          <nav
            className="col-start-2 hidden items-center gap-6 justify-self-center lg:flex"
            aria-label="Sections de la page"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap text-sm transition-colors hover:text-foreground ${
                  activeSection === link.id
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {/* Zone droite — colonne 3 */}
        <div className="col-start-3 flex items-center gap-2 justify-self-end">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted/40" aria-hidden="true" />
          ) : isLoggedIn ? (
            <UserMenu />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Connexion</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/register">Inscription</Link>
              </Button>
              {(!isHome || scrolled) && (
                <Button size="sm" asChild className="hidden lg:inline-flex">
                  <Link href="/generate/upload">Créer mon Save the Date</Link>
                </Button>
              )}
              {/* Settings dropdown pour visiteurs */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label="Paramètres">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" />
                    )}
                    {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

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

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-border/40 bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      {/* Logo + nom — gauche */}
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" width={32} height={32} alt="" />
        <span className="font-display text-sm font-semibold text-foreground">
          Siana Memento
        </span>
      </Link>

      {/* Nav ancres — centré en absolu */}
      {isHome && (
        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 sm:flex"
          aria-label="Sections de la page"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors hover:text-foreground ${
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

      {/* Zone droite */}
      <div className="ml-auto flex items-center gap-2">
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
            <Button size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/generate/upload">Créer mon Save the Date</Link>
            </Button>
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
    </header>
  )
}

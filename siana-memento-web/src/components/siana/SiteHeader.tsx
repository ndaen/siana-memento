'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/siana/ThemeToggle'
import UserMenu from '@/components/siana/UserMenu'
import { getMe, type User } from '@/lib/api/auth'

const navLinks = [
  { href: '#how-it-works', label: 'Comment ça marche' },
  { href: '#gallery', label: 'Galerie' },
  { href: '#testimonials', label: 'Témoignages' },
]

export default function SiteHeader() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe().then((result) => {
      if (result.success) setUser(result.user)
      setLoading(false)
    })
  }, [])

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      {/* Logo + nom */}
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" width={32} height={32} alt="" />
        <span className="font-display text-sm font-semibold text-foreground">
          Siana Memento
        </span>
      </Link>

      {/* Nav ancres — landing uniquement, desktop uniquement */}
      {isHome && (
        <nav className="hidden items-center gap-6 sm:flex" aria-label="Sections de la page">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}

      {/* Zone droite : auth + theme */}
      <div className="flex items-center gap-2">
        {loading ? (
          <div className="h-9 w-24 animate-pulse rounded-md bg-muted/40" aria-hidden="true" />
        ) : user ? (
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
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}

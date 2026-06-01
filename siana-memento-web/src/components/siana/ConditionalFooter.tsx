'use client'

import { usePathname } from 'next/navigation'
import Footer from '@/components/siana/Footer'

/**
 * Masque le footer sur l'espace admin (/admin/*) — interface interne sans chrome marketing.
 * Le Footer global reste rendu sur toutes les autres routes.
 */
export default function ConditionalFooter() {
  const pathname = usePathname()
  // Frontière de segment : masquer sur /admin et /admin/* sans matcher un futur /admin-help.
  if (pathname === '/admin' || pathname?.startsWith('/admin/')) return null
  return <Footer />
}

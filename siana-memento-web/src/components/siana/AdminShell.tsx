'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getMe } from '@/lib/api/auth'
import { Button } from '@/components/ui/button'
import { AdminSidebar, AdminMobileNav } from '@/components/siana/AdminSidebar'

/**
 * Coquille partagée de l'espace admin : protège toutes les routes /admin et
 * fournit la navigation (sidebar desktop + drawer mobile) ainsi que le <main>
 * unique de la page. Le garde est UX uniquement — la vraie barrière reste le
 * middleware API `admin` (NFR-S10). Centralise la garde auparavant dupliquée
 * dans AdminDashboard (Story 6.2).
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authChecked, setAuthChecked] = useState(false)
  const [authError, setAuthError] = useState(false)
  // Empêche les appels /auth/me concurrents (montage, retry, changement de route).
  const checking = useRef(false)

  const runAuthCheck = useCallback(() => {
    if (checking.current) return
    checking.current = true
    getMe().then((result) => {
      checking.current = false
      if (!result.success) {
        // Panne réseau ≠ « non authentifié » : ne pas rediriger vers /login (faux logout
        // perçu) ; afficher un état d'erreur réessayable.
        if (result.errorCode === 'NETWORK_ERROR') {
          toast.error('Service indisponible. Vérifiez votre connexion et réessayez.')
          setAuthError(true)
          return
        }
        router.replace(`/login?redirect=${encodeURIComponent(pathname ?? '/admin/dashboard')}`)
        return
      }
      if (!result.user.isAdmin) {
        router.replace('/orders')
        return
      }
      setAuthChecked(true)
    })
  }, [router, pathname])

  // Vérifie l'accès une seule fois (au montage du layout partagé). Le garde `authChecked`
  // évite tout re-fetch lors des navigations entre sous-routes admin.
  useEffect(() => {
    if (authChecked) return
    runAuthCheck()
  }, [authChecked, runAuthCheck])

  if (authError) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <div className="flex flex-col items-center py-16 text-center">
          <h2 className="font-display text-lg font-semibold">Connexion impossible</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Vérifiez votre connexion, puis réessayez.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              setAuthError(false)
              runAuthCheck()
            }}
          >
            Réessayer
          </Button>
        </div>
      </main>
    )
  }

  if (!authChecked) {
    // Skeleton neutre (le shell enveloppe toutes les sous-routes admin, pas seulement
    // le dashboard) — ne pas suggérer une forme de page spécifique. Sidebar volontairement
    // absente tant que l'accès admin n'est pas confirmé (évite de flasher la nav à un non-admin).
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-16" aria-busy="true">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="mt-6 space-y-3">
          <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
        </div>
        <div className="mt-10 h-40 w-full rounded-xl bg-muted animate-pulse" />
      </main>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminMobileNav />
        <main className="mx-auto max-w-4xl px-4 py-10 sm:py-16">{children}</main>
      </div>
    </div>
  )
}

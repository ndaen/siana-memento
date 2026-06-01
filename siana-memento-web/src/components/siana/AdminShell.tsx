'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getMe } from '@/lib/api/auth'
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

  // L'identité ne change pas en circulant entre sous-pages /admin : on ne vérifie
  // l'accès qu'une fois. Un flag ref (écrit dans l'effet) garantit un seul getMe()
  // même si le pathname change pendant la vérification → évite les /auth/me redondants
  // à chaque navigation de sous-route admin.
  const hasChecked = useRef(false)

  useEffect(() => {
    if (hasChecked.current) return
    hasChecked.current = true
    getMe().then((result) => {
      if (!result.success) {
        // Distinguer une panne réseau d'un vrai « non authentifié » : ne pas
        // rediriger vers /login sur un simple souci de connexion (faux logout perçu).
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

  if (authError) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <div className="flex flex-col items-center py-16 text-center">
          <h2 className="font-display text-lg font-semibold">Connexion impossible</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Vérifiez votre connexion et rechargez la page.
          </p>
        </div>
      </main>
    )
  }

  if (!authChecked) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <div className="h-8 w-56 rounded bg-muted animate-pulse" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
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

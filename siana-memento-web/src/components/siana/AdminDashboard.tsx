'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getMe } from '@/lib/api/auth'
import { getAdminMetrics, getExportCsvUrl, type DashboardMetrics } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const SAGE = '#2D4A3E'

function formatEur(value: number | null): string {
  if (value === null) return 'N/A'
  return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function formatPercent(ratio: number | null): string {
  if (ratio === null) return 'N/A'
  return `${(ratio * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display text-2xl font-bold tracking-tight">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Garde admin (UX uniquement — la vraie barrière est l'API, NFR-S10).
  useEffect(() => {
    getMe().then((result) => {
      if (!result.success) {
        // Distinguer une panne réseau d'un vrai « non authentifié » : ne pas rediriger
        // vers /login sur un simple souci de connexion (sinon faux logout perçu).
        if (result.errorCode === 'NETWORK_ERROR') {
          toast.error('Service indisponible. Vérifiez votre connexion et réessayez.')
          setAuthError(true)
          return
        }
        router.replace('/login?redirect=/admin/dashboard')
        return
      }
      if (!result.user.isAdmin) {
        router.replace('/orders')
        return
      }
      setAuthChecked(true)
    })
  }, [router])

  useEffect(() => {
    if (!authChecked) return
    getAdminMetrics().then((result) => {
      if (result.success) {
        setMetrics(result.metrics)
      } else {
        toast.error(result.message)
        setError(true)
      }
      setLoading(false)
    })
  }, [authChecked])

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
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Dashboard admin
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Métriques des 30 derniers jours.
          </p>
        </div>
        <Button asChild style={{ backgroundColor: SAGE }}>
          <a href={getExportCsvUrl()}>Exporter CSV</a>
        </Button>
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : error || !metrics ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <h2 className="font-display text-lg font-semibold">
            Impossible de charger les métriques
          </h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Vérifiez votre connexion et réessayez dans quelques instants.
          </p>
        </div>
      ) : (
        <>
          <section
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Métriques business"
          >
            <MetricCard label="Revenus (30 j)" value={formatEur(metrics.revenue)} />
            <MetricCard label="Commandes payées" value={String(metrics.ordersCount)} />
            <MetricCard
              label="Coût API moyen / commande"
              value={formatEur(metrics.avgApiCost)}
              hint={metrics.apiCostEstimated ? 'Estimation' : undefined}
            />
            <MetricCard
              label="Marge brute estimée"
              value={formatEur(metrics.grossMargin)}
              hint="Revenus − coûts API"
            />
            <MetricCard label="Taux de conversion" value={formatPercent(metrics.conversionRate)} />
          </section>

          <section className="mt-10" aria-label="Coût d'acquisition client par canal">
            <h2 className="font-display text-lg font-semibold">CAC par canal</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {metrics.cac.utmAvailable
                ? 'Coût d’acquisition client par canal marketing.'
                : 'Données UTM non collectées — CAC indisponible.'}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(['organique', 'paid', 'social', 'referral'] as const).map((channel) => (
                <Card key={channel}>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium capitalize text-muted-foreground">
                      {channel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-xl font-bold">
                      {formatEur(metrics.cac.channels[channel])}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

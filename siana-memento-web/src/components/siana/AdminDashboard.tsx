'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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

// L'accès admin est garanti en amont par AdminShell (layout /admin) — ce composant
// suppose un admin authentifié et ne charge que les métriques.
export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getAdminMetrics().then((result) => {
      if (result.success) {
        setMetrics(result.metrics)
      } else {
        toast.error(result.message)
        setError(true)
      }
      setLoading(false)
    })
  }, [])

  return (
    <>
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
    </>
  )
}

'use client'

import { Fragment, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getAdminLogs, type GenerationLog, type GenerationLogsData } from '@/lib/api/admin'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

const PER_PAGE = 20

function formatEur(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('fr-FR')
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—'
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`
}

function StatusBadge({ status }: { status: GenerationLog['status'] }) {
  if (status === 'failed') return <Badge variant="destructive">Échec</Badge>
  if (status === 'completed') return <Badge>Réussi</Badge>
  return <Badge variant="secondary">{status === 'generating' ? 'En cours' : 'En attente'}</Badge>
}

// L'accès admin est garanti par AdminShell (layout /admin) — ce composant suppose un admin
// authentifié et ne fait que charger/afficher les logs de génération.
export default function AdminGenerationLogs() {
  const [data, setData] = useState<GenerationLogsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [failedOnly, setFailedOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  useEffect(() => {
    let active = true
    getAdminLogs({ failedOnly, page, perPage: PER_PAGE }).then((result) => {
      if (!active) return
      if (result.success) {
        setData(result.data)
        setError(false)
      } else {
        toast.error(result.message)
        setError(true)
      }
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [failedOnly, page])

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Logs de génération
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Historique des générations IA et de leurs erreurs.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={failedOnly}
            onCheckedChange={(v) => {
              setLoading(true)
              setFailedOnly(v === true)
              setPage(1)
            }}
          />
          Échecs seulement
        </label>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3" aria-busy="true">
          <div className="h-10 w-full rounded bg-muted animate-pulse" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : error || !data ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <h2 className="font-display text-lg font-semibold">Impossible de charger les logs</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Vérifiez votre connexion et réessayez dans quelques instants.
          </p>
        </div>
      ) : data.items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <h2 className="font-display text-lg font-semibold">
            {failedOnly ? 'Aucun échec' : 'Aucune génération'}
          </h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {failedOnly
              ? 'Aucune génération en échec à afficher.'
              : 'Les générations apparaîtront ici dès la première création.'}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Date/heure</TableHead>
                  <TableHead scope="col">User</TableHead>
                  <TableHead scope="col">Template</TableHead>
                  <TableHead scope="col">Durée</TableHead>
                  <TableHead scope="col">Coût</TableHead>
                  <TableHead scope="col">Statut</TableHead>
                  <TableHead scope="col" className="sr-only">
                    Détail
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((log) => (
                  <Fragment key={log.id}>
                    <TableRow>
                      <TableCell>{formatDate(log.createdAt)}</TableCell>
                      <TableCell>{log.userId ?? '—'}</TableCell>
                      <TableCell className="capitalize">{log.template ?? '—'}</TableCell>
                      <TableCell>{formatDuration(log.durationMs)}</TableCell>
                      <TableCell>
                        {formatEur(log.apiCostCents)}
                        {log.costEstimated ? ' *' : ''}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={log.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {log.status === 'failed' ? (
                          <button
                            type="button"
                            onClick={() => toggle(log.id)}
                            aria-expanded={expanded.has(log.id)}
                            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          >
                            {expanded.has(log.id) ? 'Masquer' : 'Détail'}
                          </button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                    {log.status === 'failed' && expanded.has(log.id) ? (
                      <TableRow>
                        <TableCell colSpan={7} className="whitespace-normal bg-muted/30 text-sm">
                          <p className="font-medium text-destructive">
                            {log.errorMessage ?? 'Erreur inconnue'}
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            Contexte : itération {log.iterationNumber} · {log.attempts} tentative(s) ·{' '}
                            {log.geminiModel ?? 'modèle inconnu'} · {formatDate(log.createdAt)}
                          </p>
                          {log.feedback ? (
                            <p className="mt-1 text-muted-foreground">Feedback : {log.feedback}</p>
                          ) : null}
                          <p className="mt-1 break-words text-muted-foreground">
                            Payload : {log.promptUsed}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">* Coût API estimé par génération.</p>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {data.meta.currentPage} / {data.meta.lastPage} · {data.meta.total} génération(s)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true)
                  setPage((p) => Math.max(1, p - 1))
                }}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.lastPage}
                onClick={() => {
                  setLoading(true)
                  setPage((p) => p + 1)
                }}
              >
                Suivant
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

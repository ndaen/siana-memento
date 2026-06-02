'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  getAdminOrders,
  resendOrderEmail,
  type AdminOrder,
  type AdminOrdersData,
} from '@/lib/api/admin'
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

function StatusBadge({ status }: { status: AdminOrder['status'] }) {
  if (status === 'email_failed') return <Badge variant="destructive">Email échoué</Badge>
  if (status === 'failed') return <Badge variant="destructive">Échec paiement</Badge>
  if (status === 'paid') return <Badge>Payée</Badge>
  return <Badge variant="secondary">En attente</Badge>
}

// L'accès admin est garanti par AdminShell (layout /admin) — ce composant suppose un admin
// authentifié et ne fait que charger/afficher les commandes et déclencher les renvois.
export default function AdminOrders() {
  const [data, setData] = useState<AdminOrdersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [failedOnly, setFailedOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [resendingIds, setResendingIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    let active = true
    getAdminOrders({
      status: failedOnly ? 'email_failed' : undefined,
      page,
      perPage: PER_PAGE,
    }).then((result) => {
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

  async function handleResend(orderId: number) {
    setResendingIds((prev) => new Set(prev).add(orderId))
    const result = await resendOrderEmail(orderId)
    setResendingIds((prev) => {
      const next = new Set(prev)
      next.delete(orderId)
      return next
    })
    if (result.success) {
      toast.success('Email renvoyé avec succès.')
      setData((prev) => {
        if (!prev) return prev
        // Sous le filtre « échecs seulement », la commande réparée quitte la liste ;
        // sinon, mise à jour optimiste du statut en place.
        if (failedOnly) {
          return {
            ...prev,
            items: prev.items.filter((o) => o.id !== orderId),
            meta: { ...prev.meta, total: Math.max(0, prev.meta.total - 1) },
          }
        }
        return {
          ...prev,
          items: prev.items.map((o) => (o.id === orderId ? { ...o, status: result.status } : o)),
        }
      })
    } else {
      toast.error(result.message)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Commandes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivi des commandes et renvoi manuel des livraisons email échouées.
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
          Échecs email seulement
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
          <h2 className="font-display text-lg font-semibold">
            Impossible de charger les commandes
          </h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Vérifiez votre connexion et réessayez dans quelques instants.
          </p>
        </div>
      ) : data.items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <h2 className="font-display text-lg font-semibold">
            {failedOnly ? 'Aucun échec email' : 'Aucune commande'}
          </h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {failedOnly
              ? 'Aucune livraison email en échec à réparer.'
              : 'Les commandes apparaîtront ici dès le premier achat.'}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Date/heure</TableHead>
                  <TableHead scope="col">Client</TableHead>
                  <TableHead scope="col">Template</TableHead>
                  <TableHead scope="col">Montant</TableHead>
                  <TableHead scope="col">Statut</TableHead>
                  <TableHead scope="col" className="text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{order.userEmail ?? `#${order.userId}`}</TableCell>
                    <TableCell className="capitalize">{order.template ?? '—'}</TableCell>
                    <TableCell>{formatEur(order.amountCents)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status === 'email_failed' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={resendingIds.has(order.id)}
                          onClick={() => handleResend(order.id)}
                        >
                          {resendingIds.has(order.id) ? 'Envoi…' : "Renvoyer l'email"}
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {data.meta.currentPage} / {data.meta.lastPage} · {data.meta.total} commande(s)
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

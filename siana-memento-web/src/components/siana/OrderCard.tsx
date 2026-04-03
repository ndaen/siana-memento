'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import type { OrderData } from '@/lib/api/orders'

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatAmount(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

const templateLabels: Record<string, string> = {
  boheme: 'Bohème',
  moderne: 'Moderne',
  classique: 'Classique',
  vintage: 'Vintage',
  minimaliste: 'Minimaliste',
}

export default function OrderCard({ order }: { order: OrderData }) {
  const design = order.design
  const coupleNames = design
    ? [design.partner1Name, design.partner2Name].filter(Boolean).join(' & ')
    : null
  const templateLabel = design?.template ? templateLabels[design.template] ?? design.template : null
  const statusLabel = order.emailSentAt ? 'Livré' : 'En cours'

  return (
    <Card className="flex flex-col sm:flex-row overflow-hidden py-0">
      {/* Miniature design — aspect 3:4 */}
      <div className="relative w-full sm:w-36 shrink-0 aspect-[3/4] sm:aspect-auto sm:h-auto bg-muted">
        {design?.previewUrl ? (
          <img
            src={design.previewUrl}
            alt={coupleNames ? `Design de ${coupleNames}` : 'Aperçu du design'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
            Aperçu indisponible
          </div>
        )}
      </div>

      {/* Infos commande */}
      <CardContent className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
        <div className="space-y-1.5">
          {coupleNames && (
            <p className="font-display text-base font-semibold leading-tight">{coupleNames}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {templateLabel && <span>{templateLabel}</span>}
            <span aria-hidden="true">·</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={order.emailSentAt ? 'default' : 'secondary'}>
              {statusLabel}
            </Badge>
            <span className="text-sm font-medium">{formatAmount(order.amount)}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled
            title="Bientôt disponible"
            aria-label="Re-télécharger le design"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Re-télécharger
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

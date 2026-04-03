'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { downloadDesign } from '@/lib/api/orders'
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

function getRemainingDays(paidAt: string | null): number | null {
  if (!paidAt) return null
  const expiry = new Date(new Date(paidAt).getTime() + 7 * 24 * 60 * 60 * 1000)
  const remaining = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return remaining > 0 ? remaining : 0
}

const templateLabels: Record<string, string> = {
  boheme: 'Bohème',
  moderne: 'Moderne',
  classique: 'Classique',
  vintage: 'Vintage',
  minimaliste: 'Minimaliste',
}

export default function OrderCard({ order }: { order: OrderData }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const design = order.design
  const coupleNames = design
    ? [design.partner1Name, design.partner2Name].filter(Boolean).join(' & ')
    : null
  const templateLabel = design?.template ? templateLabels[design.template] ?? design.template : null
  const statusLabel = order.emailSentAt ? 'Livré' : 'En cours'

  const remainingDays = getRemainingDays(order.paidAt)
  const isExpired = remainingDays === 0
  const isDelivered = !!order.emailSentAt
  const canDownload = isDelivered && !isExpired

  async function handleDownload() {
    setIsDownloading(true)
    const result = await downloadDesign(order.id)
    if (result.success) {
      const link = document.createElement('a')
      link.href = result.downloadUrl
      link.setAttribute('download', 'save-the-date.png')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      toast.error(result.message)
    }
    setIsDownloading(false)
  }

  function getDownloadButtonLabel() {
    if (isDownloading) return 'Téléchargement...'
    if (isExpired) return 'Expiré'
    if (!isDelivered) return 'En cours...'
    return 'Re-télécharger'
  }

  function getDownloadTooltip() {
    if (isExpired) return 'Fichier supprimé après 7 jours (RGPD)'
    if (!isDelivered) return 'Livraison en cours'
    return 'Télécharger le fichier haute résolution'
  }

  function getExpirationLabel() {
    if (remainingDays === null) return null
    if (isExpired) return <span className="text-xs text-destructive">Fichier expiré</span>
    if (remainingDays === 1) return <span className="text-xs text-amber-600">Dernier jour pour télécharger</span>
    return <span className="text-xs text-muted-foreground">Disponible encore {remainingDays} jours</span>
  }

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

          <div className="flex flex-col items-end gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={!canDownload || isDownloading}
              onClick={canDownload ? handleDownload : undefined}
              title={getDownloadTooltip()}
              aria-label="Re-télécharger le design"
            >
              {isDownloading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-3.5 w-3.5" />
              )}
              {getDownloadButtonLabel()}
            </Button>
            {getExpirationLabel()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

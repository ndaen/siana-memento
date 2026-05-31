import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import { writeToString } from '@fast-csv/format'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import Order from '#models/order'
import MetricsService from '#services/metrics_service'

const PERIOD_DAYS = 30
const DEFAULT_GEMINI_COST_EUR = 0.5

/**
 * Neutralise l'injection de formule CSV (OWASP) : une valeur texte d'origine utilisateur
 * commençant par = + - @ TAB CR peut être interprétée comme une formule par Excel/LibreOffice.
 * N'appliquer QU'aux champs texte libres — jamais aux nombres (casserait les négatifs).
 */
function sanitizeCsvText(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

@inject()
export default class AdminController {
  constructor(protected metricsService: MetricsService) {}

  /**
   * GET /api/admin/metrics — métriques business sur 30 jours (AC1/AC2).
   * Protégé par middleware auth + admin (NFR-S10).
   */
  async metrics({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    logger.info({ event: 'admin_metrics_view', userId: user.id }, 'Admin metrics viewed')

    const data = await this.metricsService.getDashboardMetrics()
    return response.ok({ success: true, data })
  }

  /**
   * GET /api/admin/metrics/export-csv — export de TOUTES les commandes de la période (AC3).
   * Colonnes : date, montant, statut, coût API, marge. Génération en mémoire (volume MVP modeste).
   */
  async exportCsv({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    logger.info({ event: 'admin_csv_export', userId: user.id }, 'Admin CSV export')

    const since = DateTime.now().minus({ days: PERIOD_DAYS }).toSQL()!
    const estimateEur = env.get('GEMINI_COST_EUR_ESTIMATE') ?? DEFAULT_GEMINI_COST_EUR

    const orders = await Order.query()
      .where('created_at', '>=', since)
      .preload('design', (designQuery) => designQuery.preload('generations'))
      .orderBy('created_at', 'desc')

    // Colonnes système (date/montant/statut/coût/marge) : aucune surface d'injection de formule.
    // sanitizeCsvText reste disponible si une colonne texte libre est ajoutée plus tard.
    const rows = orders.map((order) => {
      const generationsCount = order.design?.generations?.length ?? 0
      const apiCostEur = generationsCount * estimateEur
      const amountEur = order.amount / 100
      const marginEur = amountEur - apiCostEur
      return [
        order.createdAt.toFormat('yyyy-MM-dd HH:mm'),
        amountEur.toFixed(2),
        sanitizeCsvText(order.status),
        apiCostEur.toFixed(2),
        marginEur.toFixed(2),
      ]
    })

    const csv = await writeToString(rows, {
      headers: ['Date', 'Montant (€)', 'Statut', 'Coût API (€)', 'Marge (€)'],
    })

    // BOM UTF-8 pour qu'Excel FR affiche correctement les accents.
    const body = '﻿' + csv
    const filename = `commandes-${DateTime.now().toFormat('yyyy-MM-dd')}.csv`

    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    return response.send(body)
  }
}

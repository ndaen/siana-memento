import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import { writeToString } from '@fast-csv/format'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import Order from '#models/order'
import MetricsService from '#services/metrics_service'
import LogsService from '#services/logs_service'
import OrdersAdminService, { type OrderStatus } from '#services/orders_admin_service'
import SurveyService from '#services/survey_service'

const ORDER_STATUSES: OrderStatus[] = ['pending', 'paid', 'failed', 'email_failed']

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

/** Convertit des centimes (integer) en chaîne EUR à 2 décimales. */
function centsToEur(cents: number): string {
  return (cents / 100).toFixed(2)
}

@inject()
export default class AdminController {
  constructor(
    protected metricsService: MetricsService,
    protected logsService: LogsService,
    protected ordersService: OrdersAdminService,
    protected surveyService: SurveyService
  ) {}

  /**
   * GET /api/admin/survey — agrégat satisfaction client (Story 6.8, AC#3).
   * Score moyen, qualité, taux de recommandation, distribution 1..5 (N/A jamais 0).
   * Protégé par middleware auth + admin (NFR-S10).
   */
  async survey({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    logger.info({ event: 'admin_survey_view', userId: user.id }, 'Admin survey stats viewed')

    const data = await this.surveyService.getSurveyStats()
    return response.ok({ success: true, data })
  }

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
   * Colonnes : date, montant, statut, coût API, marge réelle, marge prévisionnelle.
   * Génération en mémoire (volume MVP modeste). Tous les calculs d'argent en CENTIMES (integer),
   * conversion en € uniquement à l'écriture (garde-fou « jamais de float pour l'argent »).
   */
  async exportCsv({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    logger.info({ event: 'admin_csv_export', userId: user.id }, 'Admin CSV export')

    // Borne temporelle déterministe : UTC sans offset, pour matcher des colonnes
    // `timestamp without time zone` quel que soit le fuseau du process.
    const since = DateTime.now()
      .minus({ days: PERIOD_DAYS })
      .toUTC()
      .toSQL({ includeOffset: false })!
    const estimateEur = env.get('GEMINI_COST_EUR_ESTIMATE') ?? DEFAULT_GEMINI_COST_EUR
    const estimateCentsPerGeneration = Math.round(estimateEur * 100)

    const orders = await Order.query()
      .where('created_at', '>=', since)
      .preload('design', (designQuery) => designQuery.preload('generations'))
      .orderBy('created_at', 'desc')

    // Colonnes système (date/montant/statut/coûts/marges) : aucune surface d'injection de formule.
    // sanitizeCsvText reste appliqué au statut par prudence (et si un champ texte libre est ajouté).
    const rows = orders.map((order) => {
      const generationsCount = order.design?.generations?.length ?? 0
      const apiCostCents = generationsCount * estimateCentsPerGeneration
      const amountCents = order.amount
      // Marge réelle : ne compte le revenu que si la commande est payée (encaissée).
      const realMarginCents = (order.status === 'paid' ? amountCents : 0) - apiCostCents
      // Marge prévisionnelle : revenu attendu − coût, quel que soit le statut (potentiel).
      const forecastMarginCents = amountCents - apiCostCents
      return [
        order.createdAt.toFormat('yyyy-MM-dd HH:mm'),
        centsToEur(amountCents),
        sanitizeCsvText(order.status),
        centsToEur(apiCostCents),
        centsToEur(realMarginCents),
        centsToEur(forecastMarginCents),
      ]
    })

    const csv = await writeToString(rows, {
      headers: [
        'Date',
        'Montant (€)',
        'Statut',
        'Coût API (€)',
        'Marge réelle (€)',
        'Marge prévisionnelle (€)',
      ],
    })

    // BOM UTF-8 pour qu'Excel FR affiche correctement les accents.
    const body = '﻿' + csv
    const filename = `commandes-${DateTime.now().toFormat('yyyy-MM-dd')}.csv`

    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    return response.send(body)
  }

  /**
   * GET /api/admin/logs — liste paginée des générations + historique des erreurs IA (Story 6.4).
   * Query : page, perPage (≤100), failedOnly=true (filtre « échecs seulement »).
   * Protégé par middleware auth + admin (NFR-S10).
   */
  async logs({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    logger.info({ event: 'admin_logs_view', userId: user.id }, 'Admin generation logs viewed')

    const page = Number(request.input('page', 1))
    const perPage = Number(request.input('perPage', 20))
    const failedOnly = request.input('failedOnly') === 'true'

    const data = await this.logsService.listGenerations({ page, perPage, failedOnly })
    return response.ok({ success: true, data })
  }

  /**
   * GET /api/admin/orders — liste paginée des commandes (Story 6.6).
   * Query : page, perPage (≤100), status (filtre, notamment `email_failed`).
   * Protégé par middleware auth + admin (NFR-S10).
   */
  async orders({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    logger.info({ event: 'admin_orders_view', userId: user.id }, 'Admin orders viewed')

    const page = Number(request.input('page', 1))
    const perPage = Number(request.input('perPage', 20))
    const statusInput = request.input('status')
    const status = ORDER_STATUSES.includes(statusInput) ? (statusInput as OrderStatus) : undefined

    const data = await this.ordersService.listOrders({ page, perPage, status })
    return response.ok({ success: true, data })
  }

  /**
   * POST /api/admin/orders/:id/resend-email — renvoi manuel du design par email (Story 6.6, AC1).
   * Trace l'action (event + adminId + timestamp) en log Pino structuré (AC2, NFR-R8).
   */
  async resendEmail({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const orderId = Number(params.id)

    const result = await this.ordersService.resendDelivery(orderId)

    if (!result.ok) {
      logger.warn(
        {
          event: 'email_resent_manual',
          orderId,
          adminId: user.id,
          outcome: 'failed',
          code: result.code,
          timestamp: DateTime.now().toISO(),
        },
        'Manual design resend failed'
      )
      const httpStatus =
        result.code === 'NOT_FOUND' ? 404 : result.code === 'INVALID_STATUS' ? 409 : 502
      return response
        .status(httpStatus)
        .send({ success: false, error: { code: result.code, message: result.message } })
    }

    logger.info(
      {
        event: 'email_resent_manual',
        orderId,
        adminId: user.id,
        outcome: 'success',
        status: result.status,
        timestamp: DateTime.now().toISO(),
      },
      'Manual design resend succeeded'
    )
    return response.ok({
      success: true,
      data: { id: orderId, status: result.status, emailSentAt: result.emailSentAt },
    })
  }
}

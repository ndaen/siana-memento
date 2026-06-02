import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import env from '#start/env'
import Generation from '#models/generation'
import type { AlertType } from '#models/alert_state'

// --- Constantes nommées (overridables par env) — pas de magic numbers dispersés ---
const DEFAULT_ERROR_RATE_THRESHOLD = 0.05 // 5% (FR36)
const DEFAULT_ERROR_RATE_MIN_SAMPLE = 5 // volume mini avant d'évaluer un taux
const DEFAULT_API_COST_ALERT_EUR = 0.7 // 0,70€/commande (FR37)
const DEFAULT_GEMINI_QUOTA_ALERT_MIN_HITS = 1 // nb mini d'erreurs quota (FR38, proxy D4)
const DEFAULT_GEMINI_COST_EUR = 0.5 // estimation MVP coût/génération (cohérent metrics_service)

const ERROR_RATE_WINDOW_MINUTES = 15 // fenêtre taux d'erreur (AC#1)
const API_COST_WINDOW_HOURS = 24 // fenêtre coût (AC#2)
const RATE_LIMIT_WINDOW_HOURS = 24 // fenêtre proxy rate-limit (AC#3)

// Signaux d'erreur Gemini interprétés comme « quota / rate-limit atteint » (proxy MVP, D4).
const QUOTA_ERROR_PATTERN = '429|RESOURCE_EXHAUSTED|quota|rate limit'

/**
 * Résultat uniforme d'un check de seuil — consommable par l'email + la déduplication.
 */
export type AlertCheckResult = {
  triggered: boolean
  /** Valeur déclenchante humainement lisible (ex. "7.2%", "0,82€", "3 erreurs quota"). */
  value: string
  details?: unknown
}

export type ErrorRateDetail = {
  errorMessage: string | null
  createdAt: string | null
  template: string | null
  iterationNumber: number
}

/**
 * Évaluation des 3 seuils d'alerte admin (Story 6.5).
 *
 * - Argent manipulé en CENTIMES (integer), comme metrics_service.
 * - Fenêtres bornées en UTC sans offset (colonnes `timestamp without time zone`),
 *   même pattern que metrics_service.sinceSql() mais sur des fenêtres courtes (15min / 24h).
 * - Coût API = estimation EUR réutilisée de metrics_service (gemini_cost_usd non persisté, D3).
 * - Rate-limit = proxy par détection d'erreurs 429/quota dans error_message (D4).
 */
export default class AlertsService {
  private errorRateThreshold(): number {
    return env.get('ERROR_RATE_THRESHOLD') ?? DEFAULT_ERROR_RATE_THRESHOLD
  }

  private errorRateMinSample(): number {
    return env.get('ERROR_RATE_MIN_SAMPLE') ?? DEFAULT_ERROR_RATE_MIN_SAMPLE
  }

  private apiCostThresholdCents(): number {
    const eur = env.get('API_COST_ALERT_EUR') ?? DEFAULT_API_COST_ALERT_EUR
    return Math.round(eur * 100)
  }

  private quotaMinHits(): number {
    return env.get('GEMINI_QUOTA_ALERT_MIN_HITS') ?? DEFAULT_GEMINI_QUOTA_ALERT_MIN_HITS
  }

  private estimateCentsPerGeneration(): number {
    const eur = env.get('GEMINI_COST_EUR_ESTIMATE') ?? DEFAULT_GEMINI_COST_EUR
    return Math.round(eur * 100)
  }

  /** Borne déterministe UTC sans offset (cf. metrics_service.sinceSql). */
  private sinceSql(opts: { minutes?: number; hours?: number }): string {
    return DateTime.now().minus(opts).toUTC().toSQL({ includeOffset: false })!
  }

  /**
   * AC#1 — Taux d'erreur des générations IA > seuil sur les 15 dernières minutes.
   * Garde-fou volume (ERROR_RATE_MIN_SAMPLE) pour éviter 1/1 = 100%.
   */
  async checkErrorRate(): Promise<AlertCheckResult> {
    const since = this.sinceSql({ minutes: ERROR_RATE_WINDOW_MINUTES })

    const agg = await db
      .from('generations')
      .where('created_at', '>=', since)
      .select(
        db.raw('COUNT(*)::int as total'),
        db.raw(`COUNT(*) FILTER (WHERE status = 'failed')::int as failed`)
      )
      .first()

    const total: number = agg?.total ?? 0
    const failed: number = agg?.failed ?? 0
    const threshold = this.errorRateThreshold()

    if (total < this.errorRateMinSample()) {
      return { triggered: false, value: `${failed}/${total} (volume insuffisant)` }
    }

    const rate = total > 0 ? failed / total : 0
    const ratePct = (rate * 100).toFixed(1)

    if (rate <= threshold) {
      return { triggered: false, value: `${ratePct}%` }
    }

    // 5 dernières erreurs (template via jointure design).
    const lastErrors = await Generation.query()
      .where('status', 'failed')
      .where('created_at', '>=', since)
      .preload('design')
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(5)

    const details: ErrorRateDetail[] = lastErrors.map((g) => ({
      errorMessage: g.errorMessage,
      createdAt: g.createdAt ? g.createdAt.toISO() : null,
      template: g.design?.template ?? null,
      iterationNumber: g.iterationNumber,
    }))

    return {
      triggered: true,
      value: `${ratePct}% (${failed}/${total})`,
      details: { rate, ratePct, failed, total, threshold, lastErrors: details },
    }
  }

  /**
   * AC#2 — Coût moyen API par commande payée > seuil sur les 24 dernières heures.
   * Coût = estimation EUR × nb générations / nb commandes payées (D3).
   * Pas d'alerte si paidOrders === 0 (division impossible, règle N/A jamais 0).
   */
  async checkApiCost(): Promise<AlertCheckResult> {
    const since = this.sinceSql({ hours: API_COST_WINDOW_HOURS })

    const orderAgg = await db
      .from('orders')
      .where('created_at', '>=', since)
      .select(db.raw(`COUNT(*) FILTER (WHERE status = 'paid')::int as paid_orders`))
      .first()
    const paidOrders: number = orderAgg?.paid_orders ?? 0

    const genAgg = await db
      .from('generations')
      .where('created_at', '>=', since)
      .count('* as count')
      .first()
    const generationsCount: number = Number(genAgg?.count ?? 0)

    const threshold = this.apiCostThresholdCents()
    const thresholdEur = (threshold / 100).toFixed(2)

    if (paidOrders === 0) {
      return { triggered: false, value: 'N/A (aucune commande payée)' }
    }

    const apiCostCents = this.estimateCentsPerGeneration() * generationsCount
    const avgCostCents = apiCostCents / paidOrders
    const avgCostEur = (avgCostCents / 100).toFixed(2)

    if (avgCostCents <= threshold) {
      return { triggered: false, value: `${avgCostEur}€` }
    }

    return {
      triggered: true,
      value: `${avgCostEur}€`,
      details: {
        avgCostCents: Math.round(avgCostCents),
        avgCostEur,
        thresholdCents: threshold,
        thresholdEur,
        paidOrders,
        generationsCount,
      },
    }
  }

  /**
   * AC#3 — Proxy rate-limit : générations `failed` dont error_message matche un signal de quota
   * (429 / RESOURCE_EXHAUSTED / quota / rate limit) sur les 24 dernières heures (D4).
   * Le « quota restant » exact n'est pas mesurable au MVP — dette Growth.
   */
  async checkRateLimit(): Promise<AlertCheckResult> {
    const since = this.sinceSql({ hours: RATE_LIMIT_WINDOW_HOURS })

    const agg = await db
      .from('generations')
      .where('status', 'failed')
      .where('created_at', '>=', since)
      .whereRaw('error_message ~* ?', [QUOTA_ERROR_PATTERN])
      .count('* as count')
      .first()
    const quotaHits: number = Number(agg?.count ?? 0)
    const minHits = this.quotaMinHits()

    if (quotaHits < minHits) {
      return { triggered: false, value: `${quotaHits} erreur(s) quota` }
    }

    return {
      triggered: true,
      value: `${quotaHits} erreur(s) quota`,
      details: { quotaHits, minHits },
    }
  }

  /** Map type → résultat, pour la commande. */
  async checkAll(): Promise<Record<AlertType, AlertCheckResult>> {
    return {
      error_rate: await this.checkErrorRate(),
      api_cost: await this.checkApiCost(),
      rate_limit: await this.checkRateLimit(),
    }
  }
}

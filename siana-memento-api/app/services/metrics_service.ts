import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import env from '#start/env'

const PERIOD_DAYS = 30
// Estimation MVP du coût Gemini par génération en EUR (la Story 6.3 persistera le coût réel).
const DEFAULT_GEMINI_COST_EUR = 0.5

export type Cac = {
  utmAvailable: boolean
  channels: {
    organique: number | null
    paid: number | null
    social: number | null
    referral: number | null
  }
}

export type DashboardMetrics = {
  periodDays: number
  revenue: number // EUR
  ordersCount: number
  avgApiCost: number | null // EUR / commande
  grossMargin: number // EUR
  conversionRate: number | null // ratio 0..1 (commandes payées / designs créés sur la période)
  apiCostEstimated: boolean
  cac: Cac
}

/**
 * Agrège les métriques business du dashboard admin sur une fenêtre glissante de 30 jours.
 *
 * - Argent manipulé en CENTIMES (integer) côté calcul, converti en EUR uniquement à la sortie.
 * - Coût API : estimation MVP = coût unitaire × nombre de générations de la période
 *   (la colonne generations.gemini_cost_usd n'est pas encore renseignée — cf. Story 6.3).
 * - Marge brute = revenus − coûts API (PRD).
 * - Conversion = commandes payées / designs créés (proxy ; pas de tracking visiteurs en base).
 * - CAC : données UTM absentes → N/A par canal (jamais 0).
 */
export default class MetricsService {
  private estimateCentsPerGeneration(): number {
    const eur = env.get('GEMINI_COST_EUR_ESTIMATE') ?? DEFAULT_GEMINI_COST_EUR
    return Math.round(eur * 100)
  }

  private sinceSql(): string {
    // Borne déterministe : UTC sans offset, pour matcher des colonnes `timestamp without time zone`
    // quel que soit le fuseau du process (évite un décalage de fenêtre selon le TZ).
    return DateTime.now().minus({ days: PERIOD_DAYS }).toUTC().toSQL({ includeOffset: false })!
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const since = this.sinceSql()

    // Une seule requête agrégée sur orders avec FILTER (Postgres) — fenêtre par created_at.
    const orderAgg = await db
      .from('orders')
      .where('created_at', '>=', since)
      .select(
        db.raw(`COUNT(*) FILTER (WHERE status = 'paid')::int as orders_count`),
        db.raw(`COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)::int as revenue_cents`)
      )
      .first()

    const ordersCount: number = orderAgg?.orders_count ?? 0
    const revenueCents: number = orderAgg?.revenue_cents ?? 0

    // Nombre de générations de la période → base de l'estimation de coût API.
    const genAgg = await db
      .from('generations')
      .where('created_at', '>=', since)
      .count('* as count')
      .first()
    const generationsCount: number = Number(genAgg?.count ?? 0)

    // Designs créés sur la MÊME fenêtre → dénominateur du taux de conversion (proxy).
    const designAgg = await db
      .from('designs')
      .where('created_at', '>=', since)
      .count('* as count')
      .first()
    const designsCount: number = Number(designAgg?.count ?? 0)

    const totalApiCostCents = this.estimateCentsPerGeneration() * generationsCount
    const grossMarginCents = revenueCents - totalApiCostCents
    const avgApiCostCents = ordersCount > 0 ? totalApiCostCents / ordersCount : null
    const conversionRate = designsCount > 0 ? ordersCount / designsCount : null

    return {
      periodDays: PERIOD_DAYS,
      revenue: revenueCents / 100,
      ordersCount,
      avgApiCost: avgApiCostCents === null ? null : Math.round(avgApiCostCents) / 100,
      grossMargin: grossMarginCents / 100,
      conversionRate,
      apiCostEstimated: true,
      // CAC : aucune donnée UTM captée en base → N/A par canal (jamais 0).
      cac: {
        utmAvailable: false,
        channels: { organique: null, paid: null, social: null, referral: null },
      },
    }
  }
}

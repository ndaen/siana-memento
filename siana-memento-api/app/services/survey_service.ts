import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import env from '#start/env'
import Order from '#models/order'
import SurveyResponse from '#models/survey_response'

// Délai post-paiement avant enquête (AC#1). Overridable par env (SURVEY_DELAY_HOURS).
const DEFAULT_SURVEY_DELAY_HOURS = 24
// Fenêtre haute anti-flood rétroactif au 1er run (D-listOrdersDueForSurvey).
const DEFAULT_SURVEY_RETRO_WINDOW_DAYS = 30
// Bornes des notes (FR48) — distribution agrégée 1..5.
const RATING_MIN = 1
const RATING_MAX = 5

export type SubmitResult =
  | { ok: true; alreadySubmitted: false }
  | { ok: false; code: 'NOT_FOUND' | 'ALREADY_SUBMITTED'; message: string }

export type SurveyState =
  | { ok: true; alreadySubmitted: boolean }
  | { ok: false; code: 'NOT_FOUND'; message: string }

export interface SurveyStats {
  count: number
  avgOverallSatisfaction: number | null
  avgDesignQuality: number | null
  recommendRate: number | null // ratio 0..1 (N/A si 0 réponse)
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
}

/**
 * Survey de satisfaction post-achat (Story 6.8, FR48).
 *
 * - `listOrdersDueForSurvey` : commandes éligibles à l'envoi (status paid + email livré +
 *   pas encore enquêtées + payées entre 24h et 30j) — bornage anti-flood rétroactif.
 * - `markSurveySent` : pose `surveyToken` + `surveySentAt` après envoi RÉUSSI (idempotence D3).
 * - `submitResponse` : enregistre une réponse via le token opaque (page publique sans auth).
 * - `getSurveyStats` : agrégat dashboard (moyennes + distribution + taux de reco), N/A jamais 0.
 */
export default class SurveyService {
  private get delayHours(): number {
    return env.get('SURVEY_DELAY_HOURS') ?? DEFAULT_SURVEY_DELAY_HOURS
  }

  private get retroWindowDays(): number {
    return env.get('SURVEY_RETRO_WINDOW_DAYS') ?? DEFAULT_SURVEY_RETRO_WINDOW_DAYS
  }

  /**
   * Commandes éligibles au survey : payées, email livré, pas encore enquêtées,
   * `paid_at` dans la fenêtre [now - retroWindow ; now - delay].
   */
  async listOrdersDueForSurvey(): Promise<Order[]> {
    const now = DateTime.now()
    // Borne basse de la fenêtre (assez ancien pour enquêter) et borne haute (pas trop vieux).
    const dueBefore = now.minus({ hours: this.delayHours }).toUTC().toSQL({ includeOffset: false })!
    const notOlderThan = now
      .minus({ days: this.retroWindowDays })
      .toUTC()
      .toSQL({ includeOffset: false })!

    return Order.query()
      .where('status', 'paid')
      .whereNotNull('emailSentAt')
      .whereNull('surveySentAt')
      .where('paidAt', '<=', dueBefore)
      .where('paidAt', '>=', notOlderThan)
      .preload('user')
      .preload('design')
      .orderBy('paidAt', 'asc')
  }

  /** Marque la commande comme enquêtée — appelé UNIQUEMENT après un envoi réussi (D3). */
  async markSurveySent(order: Order, token: string): Promise<void> {
    order.surveyToken = token
    order.surveySentAt = DateTime.now()
    await order.save()
  }

  /**
   * État de la page publique pour un token : existence + déjà répondu ou non.
   * Aucune donnée sensible (ni email, ni id séquentiel).
   */
  async getStateByToken(token: string): Promise<SurveyState> {
    const order = await Order.findBy('surveyToken', token)
    if (!order) {
      return { ok: false, code: 'NOT_FOUND', message: 'Lien de survey invalide ou expiré.' }
    }
    const existing = await SurveyResponse.findBy('orderId', order.id)
    return { ok: true, alreadySubmitted: existing !== null }
  }

  /**
   * Enregistre une réponse via le token opaque (page publique).
   * - token inconnu → NOT_FOUND (404) ;
   * - réponse déjà existante pour la commande → ALREADY_SUBMITTED (409, D6) ;
   * - sinon création de la SurveyResponse.
   */
  async submitResponse(payload: {
    surveyToken: string
    overallSatisfaction: number
    designQuality: number
    wouldRecommend: boolean
  }): Promise<SubmitResult> {
    const order = await Order.findBy('surveyToken', payload.surveyToken)
    if (!order) {
      return { ok: false, code: 'NOT_FOUND', message: 'Lien de survey invalide ou expiré.' }
    }

    const existing = await SurveyResponse.findBy('orderId', order.id)
    if (existing) {
      return {
        ok: false,
        code: 'ALREADY_SUBMITTED',
        message: 'Une réponse a déjà été enregistrée pour cette commande.',
      }
    }

    try {
      await SurveyResponse.create({
        orderId: order.id,
        overallSatisfaction: payload.overallSatisfaction,
        designQuality: payload.designQuality,
        wouldRecommend: payload.wouldRecommend,
        submittedAt: DateTime.now(),
      })
    } catch (err) {
      // Filet anti-race : deux POST concurrents peuvent franchir le `findBy` ci-dessus, et
      // la contrainte UNIQUE(order_id) ferait échouer le 2ᵉ INSERT. On traite la violation
      // d'unicité (code Postgres 23505) comme une double-soumission → même résultat que le check.
      if ((err as { code?: string })?.code === '23505') {
        return {
          ok: false,
          code: 'ALREADY_SUBMITTED',
          message: 'Une réponse a déjà été enregistrée pour cette commande.',
        }
      }
      throw err
    }

    return { ok: true, alreadySubmitted: false }
  }

  /**
   * Agrégat pour le dashboard admin (AC#3).
   * Règle N/A jamais 0 (héritée 6.2) : si aucune réponse, moyennes/taux → null.
   *
   * NB : agrégat CUMULÉ À VIE (pas de fenêtre glissante 30j comme les autres cartes du dashboard 6.2).
   * INTENTIONNEL (et non un oubli) : le volume de surveys est faible et le score de satisfaction
   * global est plus pertinent en cumulé qu'en glissant 30j. Cf. décision M3 de la review 6.8.
   */
  async getSurveyStats(): Promise<SurveyStats> {
    const filters = []
    for (let n = RATING_MIN; n <= RATING_MAX; n++) {
      filters.push(
        db.raw(`COUNT(*) FILTER (WHERE overall_satisfaction = ?)::int as dist_${n}`, [n])
      )
    }

    const agg = await db
      .from('survey_responses')
      .select(
        db.raw('COUNT(*)::int as count'),
        db.raw('AVG(overall_satisfaction) as avg_overall'),
        db.raw('AVG(design_quality) as avg_quality'),
        db.raw('AVG(would_recommend::int) as recommend_rate'),
        ...filters
      )
      .first()

    const count: number = agg?.count ?? 0

    if (count === 0) {
      return {
        count: 0,
        avgOverallSatisfaction: null,
        avgDesignQuality: null,
        recommendRate: null,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      }
    }

    return {
      count,
      avgOverallSatisfaction: Number(agg.avg_overall),
      avgDesignQuality: Number(agg.avg_quality),
      recommendRate: Number(agg.recommend_rate),
      distribution: {
        1: agg.dist_1 ?? 0,
        2: agg.dist_2 ?? 0,
        3: agg.dist_3 ?? 0,
        4: agg.dist_4 ?? 0,
        5: agg.dist_5 ?? 0,
      },
    }
  }
}

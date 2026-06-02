import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import AlertState from '#models/alert_state'
import type { AlertType } from '#models/alert_state'
import type { AlertCheckResult, ErrorRateDetail } from '#services/alerts_service'

const DEFAULT_ALERT_COOLDOWN_MINUTES = 60

/**
 * Évalue les 3 seuils d'alerte admin (taux d'erreur IA, coût API, proxy rate-limit)
 * et envoie un email Resend par seuil franchi, avec déduplication temporelle (D5).
 *
 * Planifiée toutes les 5 min par un cron EXTERNE (Railway / GitHub Actions) — pas de
 * scheduler in-process committé, comme cleanup:rgpd. Pour satisfaire NFR-R4 (détection→email <5 min),
 * planifier la cadence cron "toutes les 5 minutes" sur : node build/ace alerts:check
 */
export default class CheckAlerts extends BaseCommand {
  static commandName = 'alerts:check'
  static description = "Évalue les seuils critiques et envoie des emails d'alerte admin (NFR-R4)"
  static options: CommandOptions = { startApp: true }

  async run() {
    const { default: AlertsService } = await import('#services/alerts_service')
    const { sendAdminAlert, buildAlertHtml } = await import('#services/email_service')

    const startTime = Date.now()
    const service = await this.app.container.make(AlertsService)
    const cooldownMinutes = env.get('ALERT_COOLDOWN_MINUTES') ?? DEFAULT_ALERT_COOLDOWN_MINUTES

    let sent = 0
    let throttled = 0

    const results = await service.checkAll()

    // Métadonnées de présentation par type d'alerte.
    const emailFor: Record<AlertType, (r: AlertCheckResult) => { subject: string; html: string }> =
      {
        error_rate: (r) => {
          const detail = r.details as { lastErrors?: ErrorRateDetail[] } | undefined
          const errorLines = (detail?.lastErrors ?? []).map((e) => {
            const when = e.createdAt ?? '—'
            const tpl = e.template ?? '—'
            const msg = e.errorMessage ?? '(message vide)'
            return `[${when}] template <strong>${tpl}</strong> (itération ${e.iterationNumber}) : ${msg}`
          })
          return {
            subject: `Taux d'erreur IA élevé (${r.value})`,
            html: buildAlertHtml(`Taux d'erreur des générations IA : ${r.value}`, [
              `Le taux d'erreur dépasse le seuil sur les 15 dernières minutes.`,
              `5 dernières erreurs :`,
              ...(errorLines.length > 0 ? errorLines : ['(aucune erreur détaillée disponible)']),
            ]),
          }
        },
        api_cost: (r) => {
          const detail = r.details as { thresholdEur?: string } | undefined
          return {
            subject: `Coût API par commande élevé (${r.value})`,
            html: buildAlertHtml(`Coût moyen API par commande : ${r.value}`, [
              `Coût moyen actuel : <strong>${r.value}</strong> par commande (24h).`,
              `Seuil d'alerte : ${detail?.thresholdEur ?? '0.70'}€.`,
            ]),
          }
        },
        rate_limit: (r) => ({
          subject: `Rate-limit Gemini proche (${r.value})`,
          html: buildAlertHtml(`Quota / rate-limit Gemini : ${r.value}`, [
            `${r.value} détectée(s) sur les 24 dernières heures (signaux 429 / RESOURCE_EXHAUSTED / quota).`,
            `Quota restant exact non mesurable au MVP — voir logs Gemini.`,
          ]),
        }),
      }

    for (const type of Object.keys(results) as AlertType[]) {
      const result = results[type]
      if (!result.triggered) {
        continue
      }

      try {
        // Déduplication (D5) : skip si une alerte du même type a été émise dans le cooldown.
        const state = await AlertState.findBy('alertType', type)
        const now = DateTime.now()

        if (state && now.diff(state.lastTriggeredAt, 'minutes').minutes < cooldownMinutes) {
          throttled++
          logger.info(
            {
              event: 'admin_alert_throttled',
              type,
              lastTriggeredAt: state.lastTriggeredAt.toISO(),
            },
            'Alerte ignorée (cooldown anti-spam actif)'
          )
          continue
        }

        const { subject, html } = emailFor[type](result)
        await sendAdminAlert(type, subject, html)
        sent++

        // Upsert de l'état (ré-arme le cooldown), que l'envoi réseau ait abouti ou non :
        // un seuil franchi = un déclenchement, indépendamment de l'état de Resend.
        await AlertState.updateOrCreate(
          { alertType: type },
          { lastTriggeredAt: now, lastValue: result.value }
        )
      } catch (err) {
        // Défensif : un échec sur un type ne doit pas bloquer les autres alertes.
        logger.error(
          { event: 'admin_alert_error', type, error: String(err) },
          "Échec du traitement d'une alerte — poursuite des autres types"
        )
      }
    }

    const durationMs = Date.now() - startTime
    logger.info(
      {
        event: 'alerts_check_summary',
        errorRate: results.error_rate.triggered,
        apiCost: results.api_cost.triggered,
        rateLimit: results.rate_limit.triggered,
        sent,
        throttled,
        durationMs,
      },
      'Vérification des alertes terminée'
    )

    this.logger.success(
      `Alertes vérifiées : ${sent} envoyée(s), ${throttled} throttlée(s) (${durationMs}ms)`
    )
  }
}

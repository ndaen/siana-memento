import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { randomBytes } from 'node:crypto'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

/**
 * Envoie l'email de survey de satisfaction aux commandes éligibles
 * (payées, email livré, pas encore enquêtées, payées entre 24h et 30j) — FR48.
 *
 * Idempotente : survey_sent_at n'est posé qu'après envoi réussi (réessai au run suivant sinon).
 * Planifiée par un cron EXTERNE Railway (cadence horaire), comme alerts:check et cleanup:rgpd.
 * Cadence cron à planifier : node build/ace survey:send (horaire, format cron standard à 5 champs).
 */
export default class SendSurvey extends BaseCommand {
  static commandName = 'survey:send'
  static description = "Envoie le survey de satisfaction 24h après l'achat (FR48)"
  static options: CommandOptions = { startApp: true }

  async run() {
    const { default: SurveyService } = await import('#services/survey_service')
    const { sendSurveyInvite } = await import('#services/email_service')

    const startTime = Date.now()
    const service = await this.app.container.make(SurveyService)
    const frontendUrl = env.get('FRONTEND_URL').replace(/\/+$/, '')

    const candidates = await service.listOrdersDueForSurvey()

    let sent = 0
    let failed = 0

    for (const order of candidates) {
      try {
        const user = order.user
        const design = order.design
        if (!user || !design) {
          failed++
          logger.warn(
            { event: 'survey_send_skip', orderId: order.id, reason: 'missing_relation' },
            'Commande sans user/design — survey non envoyé'
          )
          continue
        }

        const token = randomBytes(32).toString('hex')
        const surveyUrl = `${frontendUrl}/survey/${token}`

        const result = await sendSurveyInvite(order, user, design, surveyUrl)
        if (result.success) {
          // Idempotence (D3) : on ne marque qu'après un envoi réussi.
          await service.markSurveySent(order, token)
          sent++
        } else {
          // Échec d'envoi → on laisse survey_sent_at NULL : réessai au prochain run (récupérable).
          failed++
        }
      } catch (err) {
        // Défensif : un échec sur une commande ne doit pas bloquer les autres.
        failed++
        logger.error(
          { event: 'survey_send_error', orderId: order.id, error: String(err) },
          "Échec du traitement d'un survey — poursuite des autres commandes"
        )
      }
    }

    const durationMs = Date.now() - startTime
    logger.info(
      { event: 'survey_send_summary', candidates: candidates.length, sent, failed, durationMs },
      'Envoi des surveys de satisfaction terminé'
    )

    this.logger.success(
      `Surveys : ${sent} envoyé(s), ${failed} en échec sur ${candidates.length} candidate(s) (${durationMs}ms)`
    )
  }
}

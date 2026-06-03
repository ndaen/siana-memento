import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import SurveyService from '#services/survey_service'
import { submitSurveyValidator } from '#validators/survey_validator'

// Le token est un hex de 64 caractères (randomBytes(32).toString('hex')).
// On valide le format AVANT toute requête DB : un token malformé ne peut pas exister,
// on renvoie 404 (même réponse que « token inconnu ») pour ne pas révéler la logique.
const SURVEY_TOKEN_PATTERN = /^[a-f0-9]{64}$/

/**
 * Endpoints PUBLICS du survey de satisfaction (Story 6.8, AC#2).
 *
 * Aucune auth : l'accès se fait par token opaque (`orders.survey_token`).
 * `show` renvoie juste l'état (formulaire à afficher ou « déjà répondu »).
 * `submit` enregistre la réponse (404 token inconnu, 409 déjà répondu, 422 payload invalide).
 */
@inject()
export default class SurveyController {
  constructor(protected surveyService: SurveyService) {}

  /** GET /api/survey/:token — contexte minimal pour rendre la page (sans donnée sensible). */
  async show({ params, response }: HttpContext) {
    const token = String(params.token)

    if (!SURVEY_TOKEN_PATTERN.test(token)) {
      return response.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lien de survey invalide ou expiré.' },
      })
    }

    const state = await this.surveyService.getStateByToken(token)

    if (!state.ok) {
      return response
        .status(404)
        .send({ success: false, error: { code: state.code, message: state.message } })
    }

    return response.ok({ success: true, data: { alreadySubmitted: state.alreadySubmitted } })
  }

  /** POST /api/survey/:token — enregistre les 3 réponses (FR48). */
  async submit({ params, request, response }: HttpContext) {
    const token = String(params.token)

    if (!SURVEY_TOKEN_PATTERN.test(token)) {
      return response.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lien de survey invalide ou expiré.' },
      })
    }

    const payload = await request.validateUsing(submitSurveyValidator)

    const result = await this.surveyService.submitResponse({
      surveyToken: token,
      overallSatisfaction: payload.overallSatisfaction,
      designQuality: payload.designQuality,
      wouldRecommend: payload.wouldRecommend,
    })

    if (!result.ok) {
      const httpStatus = result.code === 'NOT_FOUND' ? 404 : 409
      return response
        .status(httpStatus)
        .send({ success: false, error: { code: result.code, message: result.message } })
    }

    logger.info({ event: 'survey_response_submitted' }, 'Survey response submitted')
    return response.created({ success: true })
  }
}

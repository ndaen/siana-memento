import vine from '@vinejs/vine'

/**
 * Validation de la soumission du survey de satisfaction (FR48, Story 6.8).
 * Le `surveyToken` provient du paramètre de route ; le body porte les 3 réponses.
 * Notes entières strictes 1..5, recommandation booléenne.
 */
export const submitSurveyValidator = vine.compile(
  vine.object({
    overallSatisfaction: vine.number().withoutDecimals().min(1).max(5),
    designQuality: vine.number().withoutDecimals().min(1).max(5),
    wouldRecommend: vine.boolean(),
  })
)

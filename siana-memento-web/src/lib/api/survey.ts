const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface SurveyPayload {
  overallSatisfaction: number
  designQuality: number
  wouldRecommend: boolean
}

type GetSurveyResult =
  | { success: true; alreadySubmitted: boolean }
  | { success: false; errorCode: string; message: string }

type SubmitSurveyResult =
  | { success: true }
  | { success: false; errorCode: string; message: string }

/**
 * Récupère l'état de la page de survey via le token opaque (endpoint PUBLIC, sans auth).
 * 404 → lien invalide ; sinon { alreadySubmitted } pour décider du rendu.
 */
export async function getSurvey(token: string): Promise<GetSurveyResult> {
  try {
    const res = await fetch(`${API_URL}/api/survey/${token}`, { method: 'GET' })
    const json = await res.json()
    if (json.success) {
      return { success: true, alreadySubmitted: Boolean(json.data?.alreadySubmitted) }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'SURVEY_FAILED',
      message: json.error?.message ?? 'Lien de survey invalide ou expiré.',
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
    }
  }
}

/** Soumet les 3 réponses du survey via le token opaque (endpoint PUBLIC). */
export async function submitSurvey(
  token: string,
  payload: SurveyPayload
): Promise<SubmitSurveyResult> {
  try {
    const res = await fetch(`${API_URL}/api/survey/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.success) {
      return { success: true }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'SUBMIT_FAILED',
      message: json.error?.message ?? "L'envoi de votre réponse a échoué.",
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
    }
  }
}

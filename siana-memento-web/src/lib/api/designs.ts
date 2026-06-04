const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

type UpdateTemplateResult =
  | { success: true; designId: number; template: string; palette: string | null }
  | { success: false; errorCode: string; message: string }

export async function updateDesignTemplate(
  designId: number,
  template: string,
  sessionToken?: string | null,
  palette?: string | null
): Promise<UpdateTemplateResult> {
  try {
    const res = await fetch(`${API_URL}/api/designs/${designId}/template`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        template,
        ...(sessionToken ? { sessionToken } : {}),
        ...(palette ? { palette } : {}),
      }),
    })
    const json = await res.json()
    if (json.success) {
      return {
        success: true,
        designId: json.data.designId,
        template: json.data.template,
        palette: json.data.palette ?? null,
      }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'UPDATE_FAILED',
      message: json.error?.message ?? 'Erreur lors de la sélection du template.',
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
    }
  }
}

type UpdateConfigureResult =
  | { success: true; designId: number }
  | { success: false; errorCode: string; message: string }

export async function updateDesignConfigure(
  designId: number,
  data: {
    partner1Name: string
    partner2Name: string
    weddingDate: string
    weddingLocation: string
  },
  sessionToken?: string | null
): Promise<UpdateConfigureResult> {
  try {
    const res = await fetch(`${API_URL}/api/designs/${designId}/configure`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...data, ...(sessionToken ? { sessionToken } : {}) }),
    })
    const json = await res.json()
    if (json.success) return { success: true, designId: json.data.designId }
    return {
      success: false,
      errorCode: json.error?.code ?? 'UPDATE_FAILED',
      message: json.error?.message ?? 'Erreur lors de la configuration.',
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
    }
  }
}

type TriggerGenerationResult =
  | { success: true; designId: number; status: string; iterationsUsed: number; previewUrl: string | null }
  | { success: false; errorCode: string; message: string }

export async function triggerGeneration(
  designId: number,
  sessionToken?: string | null,
  feedback?: string | null
): Promise<TriggerGenerationResult> {
  try {
    const body: Record<string, string> = {}
    if (sessionToken) body.sessionToken = sessionToken
    if (feedback) body.feedback = feedback
    const res = await fetch(`${API_URL}/api/designs/${designId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (json.success) {
      return {
        success: true,
        designId: json.data.designId,
        status: json.data.status,
        iterationsUsed: json.data.iterationsUsed,
        previewUrl: json.data.previewUrl ?? null,
      }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'GENERATION_FAILED',
      message: json.error?.message ?? 'La génération a échoué.',
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
    }
  }
}

type PollStatusResult =
  | { success: true; status: string; iterationsUsed: number }
  | { success: false; errorCode: string; message: string }

export async function pollDesignStatus(
  designId: number,
  sessionToken?: string | null
): Promise<PollStatusResult> {
  try {
    const res = await fetch(`${API_URL}/api/designs/${designId}/status`, {
      headers: sessionToken ? { 'X-Session-Token': sessionToken } : {},
      credentials: 'include',
    })
    const json = await res.json()
    if (json.success) {
      return {
        success: true,
        status: json.data.status,
        iterationsUsed: json.data.iterationsUsed,
      }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'STATUS_FAILED',
      message: json.error?.message ?? 'Impossible de vérifier le statut.',
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible.',
    }
  }
}

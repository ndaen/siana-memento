const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

type UpdateTemplateResult =
  | { success: true; designId: number; template: string }
  | { success: false; errorCode: string; message: string }

export async function updateDesignTemplate(
  designId: number,
  template: string,
  sessionToken?: string | null
): Promise<UpdateTemplateResult> {
  try {
    const res = await fetch(`${API_URL}/api/designs/${designId}/template`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ template, ...(sessionToken ? { sessionToken } : {}) }),
    })
    const json = await res.json()
    if (json.success) {
      return { success: true, designId: json.data.designId, template: json.data.template }
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

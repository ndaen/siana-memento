const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

interface RegisterPayload {
  email: string
  password: string
  fullName?: string
}

type RegisterResult =
  | { success: true }
  | { success: false; errorCode: string; message: string }

export async function registerUser(payload: RegisterPayload): Promise<RegisterResult> {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    const json = await res.json()

    if (json.success) {
      return { success: true }
    }

    return {
      success: false,
      errorCode: json.error?.code ?? 'UNKNOWN',
      message: json.error?.message ?? 'Une erreur est survenue.',
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
    }
  }
}

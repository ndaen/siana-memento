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

export interface User {
  id: number
  email: string
  fullName: string | null
}

interface LoginPayload {
  email: string
  password: string
}

type LoginResult =
  | { success: true; user: User }
  | { success: false; errorCode: string; message: string }

type MeResult = { success: true; user: User } | { success: false; errorCode: string }

export async function getMe(): Promise<MeResult> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      credentials: 'include',
    })
    const json = await res.json()
    if (json.success) return { success: true, user: json.data.user }
    return { success: false, errorCode: json.error?.code ?? 'UNAUTHORIZED' }
  } catch {
    return { success: false, errorCode: 'NETWORK_ERROR' }
  }
}

type LogoutResult = { success: true } | { success: false; errorCode: string }

export async function logoutUser(): Promise<LogoutResult> {
  try {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    const json = await res.json()
    if (json.success) return { success: true }
    return { success: false, errorCode: json.error?.code ?? 'LOGOUT_FAILED' }
  } catch {
    return { success: false, errorCode: 'NETWORK_ERROR' }
  }
}

export async function loginUser(payload: LoginPayload): Promise<LoginResult> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    const json = await res.json()

    if (json.success) {
      return { success: true, user: json.data.user }
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

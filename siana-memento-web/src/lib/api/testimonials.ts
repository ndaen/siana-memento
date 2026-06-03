const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

/** Testimonial complet (vue admin — inclut isActive). */
export interface Testimonial {
  id: number
  authorName: string
  content: string
  isActive: boolean
  displayOrder: number
}

/** Testimonial public (landing) — pas d'exposition de isActive/timestamps. */
export type PublicTestimonial = Pick<Testimonial, 'id' | 'authorName' | 'content'>

export interface TestimonialPayload {
  authorName?: string
  content?: string
  isActive?: boolean
  displayOrder?: number
}

type ListResult =
  | { success: true; data: Testimonial[] }
  | { success: false; errorCode: string; message: string }

type MutationResult =
  | { success: true; data?: Testimonial }
  | { success: false; errorCode: string; message: string }

function networkError() {
  return {
    success: false as const,
    errorCode: 'NETWORK_ERROR',
    message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
  }
}

export async function getAdminTestimonials(): Promise<ListResult> {
  try {
    const res = await fetch(`${API_URL}/api/admin/testimonials`, {
      method: 'GET',
      credentials: 'include',
    })
    const json = await res.json()
    if (json.success) {
      return { success: true, data: json.data }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'TESTIMONIALS_FAILED',
      message: json.error?.message ?? 'Impossible de charger les témoignages.',
    }
  } catch {
    return networkError()
  }
}

export async function createTestimonial(payload: TestimonialPayload): Promise<MutationResult> {
  try {
    const res = await fetch(`${API_URL}/api/admin/testimonials`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.success) {
      return { success: true, data: json.data }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'TESTIMONIAL_CREATE_FAILED',
      message: json.error?.message ?? 'Impossible de créer le témoignage.',
    }
  } catch {
    return networkError()
  }
}

export async function updateTestimonial(
  id: number,
  payload: TestimonialPayload
): Promise<MutationResult> {
  try {
    const res = await fetch(`${API_URL}/api/admin/testimonials/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.success) {
      return { success: true, data: json.data }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'TESTIMONIAL_UPDATE_FAILED',
      message: json.error?.message ?? 'Impossible de modifier le témoignage.',
    }
  } catch {
    return networkError()
  }
}

export async function deleteTestimonial(id: number): Promise<MutationResult> {
  try {
    const res = await fetch(`${API_URL}/api/admin/testimonials/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const json = await res.json()
    if (json.success) {
      return { success: true }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'TESTIMONIAL_DELETE_FAILED',
      message: json.error?.message ?? 'Impossible de supprimer le témoignage.',
    }
  } catch {
    return networkError()
  }
}

/**
 * Lecture publique des testimonials actifs — appelée côté serveur (landing).
 * `cache: 'no-store'` pour refléter immédiatement l'état admin sans rebuild Vercel (AC#3).
 * En cas d'échec réseau/API : retourne [] (dégradation gracieuse, section masquée).
 */
export async function getPublicTestimonials(): Promise<PublicTestimonial[]> {
  try {
    const res = await fetch(`${API_URL}/api/testimonials`, {
      method: 'GET',
      cache: 'no-store',
    })
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) {
      return json.data as PublicTestimonial[]
    }
    return []
  } catch {
    return []
  }
}

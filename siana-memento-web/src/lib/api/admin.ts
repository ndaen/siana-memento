const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface CacChannels {
  organique: number | null
  paid: number | null
  social: number | null
  referral: number | null
}

export interface DashboardMetrics {
  periodDays: number
  revenue: number
  ordersCount: number
  avgApiCost: number | null
  grossMargin: number
  conversionRate: number | null
  apiCostEstimated: boolean
  cac: { utmAvailable: boolean; channels: CacChannels }
}

type MetricsResult =
  | { success: true; metrics: DashboardMetrics }
  | { success: false; errorCode: string; message: string }

export async function getAdminMetrics(): Promise<MetricsResult> {
  try {
    const res = await fetch(`${API_URL}/api/admin/metrics`, {
      method: 'GET',
      credentials: 'include',
    })
    const json = await res.json()
    if (json.success) {
      return { success: true, metrics: json.data }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'METRICS_FAILED',
      message: json.error?.message ?? 'Impossible de charger les métriques.',
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
    }
  }
}

/**
 * URL directe de l'export CSV. Le téléchargement passe par une navigation <a> :
 * le cookie de session est envoyé automatiquement vers l'API, et le navigateur
 * enregistre le fichier via l'en-tête Content-Disposition renvoyé par le serveur.
 */
export function getExportCsvUrl(): string {
  return `${API_URL}/api/admin/metrics/export-csv`
}

export type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed'

export interface GenerationLog {
  id: number
  createdAt: string // ISO — formatée fr-FR à l'affichage
  status: GenerationStatus
  iterationNumber: number
  attempts: number
  durationMs: number | null
  geminiModel: string | null
  apiCostCents: number // centimes → /100 pour formatEur
  costEstimated: boolean
  errorMessage: string | null
  template: string | null
  userId: number | null
  promptUsed: string // contexte/payload (tronqué côté API)
  feedback: string | null
}

export interface GenerationLogsData {
  meta: { total: number; perPage: number; currentPage: number; lastPage: number }
  items: GenerationLog[]
}

type LogsResult =
  | { success: true; data: GenerationLogsData }
  | { success: false; errorCode: string; message: string }

export async function getAdminLogs(params: {
  failedOnly?: boolean
  page?: number
  perPage?: number
}): Promise<LogsResult> {
  const qs = new URLSearchParams()
  if (params.failedOnly) qs.set('failedOnly', 'true')
  if (params.page) qs.set('page', String(params.page))
  if (params.perPage) qs.set('perPage', String(params.perPage))

  try {
    const res = await fetch(`${API_URL}/api/admin/logs?${qs.toString()}`, {
      method: 'GET',
      credentials: 'include',
    })
    const json = await res.json()
    if (json.success) {
      return { success: true, data: json.data }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'LOGS_FAILED',
      message: json.error?.message ?? 'Impossible de charger les logs.',
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
    }
  }
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'email_failed'

export interface AdminOrder {
  id: number
  createdAt: string // ISO — formatée fr-FR à l'affichage
  status: OrderStatus
  amountCents: number // centimes → /100 pour formatEur
  userId: number
  userEmail: string | null
  template: string | null
  emailSentAt: string | null
}

export interface AdminOrdersData {
  meta: { total: number; perPage: number; currentPage: number; lastPage: number }
  items: AdminOrder[]
}

type OrdersResult =
  | { success: true; data: AdminOrdersData }
  | { success: false; errorCode: string; message: string }

export async function getAdminOrders(params: {
  status?: OrderStatus
  page?: number
  perPage?: number
}): Promise<OrdersResult> {
  const qs = new URLSearchParams()
  if (params.status) qs.set('status', params.status)
  if (params.page) qs.set('page', String(params.page))
  if (params.perPage) qs.set('perPage', String(params.perPage))

  try {
    const res = await fetch(`${API_URL}/api/admin/orders?${qs.toString()}`, {
      method: 'GET',
      credentials: 'include',
    })
    const json = await res.json()
    if (json.success) {
      return { success: true, data: json.data }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'ORDERS_FAILED',
      message: json.error?.message ?? 'Impossible de charger les commandes.',
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
    }
  }
}

export interface SurveyStats {
  count: number
  avgOverallSatisfaction: number | null
  avgDesignQuality: number | null
  recommendRate: number | null // ratio 0..1 (N/A si 0 réponse)
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>
}

type SurveyResult =
  | { success: true; data: SurveyStats }
  | { success: false; errorCode: string; message: string }

/** Agrégat satisfaction client pour le dashboard admin (Story 6.8, AC#3). */
export async function getAdminSurvey(): Promise<SurveyResult> {
  try {
    const res = await fetch(`${API_URL}/api/admin/survey`, {
      method: 'GET',
      credentials: 'include',
    })
    const json = await res.json()
    if (json.success) {
      return { success: true, data: json.data }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'SURVEY_FAILED',
      message: json.error?.message ?? 'Impossible de charger la satisfaction client.',
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
    }
  }
}

type ResendResult =
  | { success: true; status: OrderStatus }
  | { success: false; errorCode: string; message: string }

/** Renvoi manuel du design par email pour une commande (Story 6.6, AC1). */
export async function resendOrderEmail(orderId: number): Promise<ResendResult> {
  try {
    const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/resend-email`, {
      method: 'POST',
      credentials: 'include',
    })
    const json = await res.json()
    if (json.success) {
      return { success: true, status: json.data.status }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'RESEND_FAILED',
      message: json.error?.message ?? "Le renvoi de l'email a échoué.",
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
    }
  }
}

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

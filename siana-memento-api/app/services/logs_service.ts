import env from '#start/env'
import Generation from '#models/generation'

const DEFAULT_GEMINI_COST_EUR = 0.5
const MAX_PER_PAGE = 100

/** Entier borné, avec repli sur `fallback` si la valeur n'est pas finie (NaN/Infinity). */
function sanitizeInt(
  value: number | undefined,
  fallback: number,
  min: number,
  max?: number
): number {
  const n = Number.isFinite(value) ? Math.trunc(value as number) : fallback
  const lower = Math.max(min, n)
  return max === undefined ? lower : Math.min(max, lower)
}

export interface GenerationLogItem {
  id: number
  createdAt: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  iterationNumber: number
  attempts: number
  durationMs: number | null
  geminiModel: string | null
  apiCostCents: number
  costEstimated: boolean
  errorMessage: string | null
  template: string | null
  userId: number | null
  promptUsed: string
  feedback: string | null
}

export interface GenerationLogsPage {
  meta: { total: number; perPage: number; currentPage: number; lastPage: number }
  items: GenerationLogItem[]
}

/**
 * Liste paginée des générations pour l'espace admin (Story 6.4 — logs & erreurs IA).
 *
 * - Coût API : la colonne `generations.gemini_cost_usd` n'est pas renseignée (coût réel
 *   réservé) → on expose une ESTIMATION EUR par génération, cohérente avec MetricsService,
 *   avec le flag `costEstimated: true`. Argent en CENTIMES (integer).
 * - `template`/`userId` vivent sur `designs` → preload('design').
 * - Tri récent d'abord ; filtre « échecs seulement » via `failedOnly`.
 */
export default class LogsService {
  private estimateCentsPerGeneration(): number {
    const eur = env.get('GEMINI_COST_EUR_ESTIMATE') ?? DEFAULT_GEMINI_COST_EUR
    return Math.round(eur * 100)
  }

  async listGenerations(options: {
    page?: number
    perPage?: number
    failedOnly?: boolean
  }): Promise<GenerationLogsPage> {
    // Coerce vers le défaut quand non fini (ex. ?page=abc → Number()=NaN) — sinon
    // Math.trunc(NaN)=NaN remonte jusqu'à LIMIT/OFFSET NaN dans paginate().
    const page = sanitizeInt(options.page, 1, 1)
    const perPage = sanitizeInt(options.perPage, 20, 1, MAX_PER_PAGE)
    const estimateCents = this.estimateCentsPerGeneration()

    // Tri récent d'abord, départagé par id pour une pagination déterministe :
    // deux lignes au même created_at ne peuvent ni réapparaître ni être sautées.
    const query = Generation.query()
      .preload('design')
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
    if (options.failedOnly) {
      query.where('status', 'failed')
    }

    const result = await query.paginate(page, perPage)
    const meta = result.getMeta()

    const items: GenerationLogItem[] = result.all().map((gen) => ({
      id: gen.id,
      createdAt: gen.createdAt.toISO() ?? '',
      status: gen.status,
      iterationNumber: gen.iterationNumber,
      attempts: gen.attempts,
      durationMs: gen.generationDurationMs,
      geminiModel: gen.geminiModel,
      // Coût réel non persisté → estimation EUR par génération (flag costEstimated).
      apiCostCents: estimateCents,
      costEstimated: true,
      errorMessage: gen.errorMessage,
      template: gen.design?.template ?? null,
      userId: gen.design?.userId ?? null,
      // Contexte (payload) pour le diagnostic des échecs — tronqué pour limiter le volume.
      promptUsed: gen.promptUsed.slice(0, 2000),
      feedback: gen.feedback,
    }))

    return {
      meta: {
        total: meta.total,
        perPage: meta.perPage,
        currentPage: meta.currentPage,
        lastPage: meta.lastPage,
      },
      items,
    }
  }
}

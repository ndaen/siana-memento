import db from '@adonisjs/lucid/services/db'
import { v2 as cloudinary } from 'cloudinary'
import { Resend } from 'resend'
import env from '#start/env'

export type ComponentStatus = {
  status: 'ok' | 'down'
  responseTime?: number
  message?: string
}

export type HealthReport = {
  healthy: boolean
  components: {
    database: ComponentStatus
    cloudinary: ComponentStatus
    resend: ComponentStatus
  }
}

/** Pinger = sonde booléenne d'un tiers (true = joignable). Injectable pour les tests. */
export type Pinger = () => Promise<boolean>

const CHECK_TIMEOUT_MS = 3000
// TTL du cache des checks de tiers externes : évite de marteler Cloudinary/Resend
// si plusieurs monitors (ou un healthcheck plateforme) frappent le readiness.
const CACHE_TTL_MS = 60_000

// Config Cloudinary (singleton global du SDK) — idempotent avec cloudinary_service.ts,
// répété ici pour que HealthService soit autonome quel que soit l'ordre d'import.
cloudinary.config({
  cloud_name: env.get('CLOUDINARY_CLOUD_NAME'),
  api_key: env.get('CLOUDINARY_API_KEY'),
  api_secret: env.get('CLOUDINARY_API_SECRET'),
})

const resend = new Resend(env.get('RESEND_API_KEY'))

/**
 * Course une promesse contre un timeout court : aucune sonde ne doit bloquer
 * (NFR-I7 : 30s max sur les intégrations — ici on reste très en-deçà).
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer!)
  }
}

/** Ping réel Cloudinary : endpoint /ping (lecture, hors quota d'upload). */
async function defaultPingCloudinary(): Promise<boolean> {
  const res = (await withTimeout(cloudinary.api.ping(), CHECK_TIMEOUT_MS)) as { status?: string }
  return res?.status === 'ok'
}

/**
 * Ping réel Resend : Resend n'expose pas de /ping ; `domains.list()` valide la clé
 * et la joignabilité de l'API sans consommer le quota d'envoi.
 * ⚠️ Requiert une clé Resend **full-access** ; une clé « sending-only » renverrait une
 * erreur de permission et ferait basculer Resend en `down` (faux négatif). Le projet
 * utilise une clé full-access unique (cf. .env).
 */
async function defaultPingResend(): Promise<boolean> {
  const { error } = await withTimeout(resend.domains.list(), CHECK_TIMEOUT_MS)
  return !error
}

type CacheEntry = { value: ComponentStatus; expiresAt: number }

/**
 * Sonde de santé des composants critiques pour le readiness endpoint (/api/health).
 *
 * - **DB (PostgreSQL)** : check réel `SELECT 1`, toujours live (dépendance dure).
 * - **Cloudinary / Resend** : ping réel léger (timeout 3s) mis en cache 60s. Un échec
 *   réel (API down, clé invalide) fait passer le composant à `down` → 503 (NFR-R5).
 *
 * Aucun appel à Gemini ni Stripe (coût réel par appel + fausses pannes).
 */
export default class HealthService {
  // Cache mémoire process-global (succès uniquement) — un `down` n'est pas caché pour
  // permettre une détection rapide du rétablissement. `resetCache()` pour l'isolation des tests.
  private static cache = new Map<string, CacheEntry>()

  static resetCache() {
    HealthService.cache.clear()
  }

  constructor(
    private pingCloudinary: Pinger = defaultPingCloudinary,
    private pingResend: Pinger = defaultPingResend
  ) {}

  async check(): Promise<HealthReport> {
    const [database, cloudinaryStatus, resendStatus] = await Promise.all([
      this.checkDatabase(),
      this.cached('cloudinary', () => this.checkExternal(this.pingCloudinary, 'cloudinary')),
      this.cached('resend', () => this.checkExternal(this.pingResend, 'resend')),
    ])

    const components = { database, cloudinary: cloudinaryStatus, resend: resendStatus }
    const healthy = Object.values(components).every((c) => c.status === 'ok')
    return { healthy, components }
  }

  /** Mémoïse les succès des checks de tiers pendant CACHE_TTL_MS (pas la DB). */
  private async cached(key: string, fn: () => Promise<ComponentStatus>): Promise<ComponentStatus> {
    const now = Date.now()
    const hit = HealthService.cache.get(key)
    if (hit && hit.expiresAt > now) return hit.value

    const value = await fn()
    if (value.status === 'ok') {
      HealthService.cache.set(key, { value, expiresAt: now + CACHE_TTL_MS })
    }
    return value
  }

  private async checkDatabase(): Promise<ComponentStatus> {
    const start = Date.now()
    try {
      await withTimeout(db.connection().rawQuery('SELECT 1'), CHECK_TIMEOUT_MS)
      return { status: 'ok', responseTime: Date.now() - start }
    } catch {
      // Message générique volontaire : pas de fuite d'info sensible (host, nom DB, stack).
      return { status: 'down', message: 'database unreachable' }
    }
  }

  private async checkExternal(ping: Pinger, name: string): Promise<ComponentStatus> {
    const start = Date.now()
    try {
      const ok = await ping()
      return ok
        ? { status: 'ok', responseTime: Date.now() - start }
        : { status: 'down', message: `${name} unreachable` }
    } catch {
      return { status: 'down', message: `${name} unreachable` }
    }
  }
}

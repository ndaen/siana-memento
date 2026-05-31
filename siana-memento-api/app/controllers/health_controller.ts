import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { timingSafeEqual } from 'node:crypto'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import HealthService from '#services/health_service'

@inject()
export default class HealthController {
  constructor(protected healthService: HealthService) {}

  /**
   * Liveness publique ultra-légère : le process répond-il ?
   * Aucune vérif DB/tiers, aucun secret. Corps minimal volontaire (aucune info sensible).
   * Cible : healthcheck de déploiement Railway (`railway.toml`) + healthcheck Docker compose.
   *
   * Réponse « plate » `{ status, timestamp }` conservée (contrat hérité de la Story 1.2 +
   * keyword-matching UptimeRobot) — volontairement PAS enveloppée en `{ success, data }`.
   */
  async live({ response }: HttpContext) {
    return response.ok({ status: 'ok', timestamp: new Date().toISOString() })
  }

  /**
   * Readiness détaillée + protégée par secret : l'app peut-elle servir du trafic ?
   * Vérifie DB + Cloudinary + Resend. 200 si tout ok, 503 si un composant est down (NFR-R5).
   * Protégée par `MONITORING_SECRET` (NFR-S10) car le rapport expose l'état interne des composants.
   *
   * Le secret est transmis **uniquement** via le header `x-monitoring-secret` : passer le secret
   * en query string l'exposerait dans les access logs (proxy/CDN/Railway). Comparaison en
   * temps constant pour éviter tout canal temporel.
   * Cible : UptimeRobot (ping 5 min).
   */
  async index({ request, response }: HttpContext) {
    const provided = request.header('x-monitoring-secret')
    if (!provided || !this.matchesSecret(provided)) {
      return response.unauthorized({ status: 'error', message: 'unauthorized' })
    }

    const report = await this.healthService.check()
    const body = {
      status: report.healthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      components: report.components,
    }

    if (!report.healthy) {
      const down = Object.entries(report.components)
        .filter(([, component]) => component.status !== 'ok')
        .map(([name]) => name)
      logger.warn({ event: 'health_check_degraded', components: down }, 'Healthcheck degraded')
      return response.serviceUnavailable(body)
    }

    return response.ok(body)
  }

  /** Comparaison du secret en temps constant (anti canal temporel). */
  private matchesSecret(provided: string): boolean {
    const expected = env.get('MONITORING_SECRET')
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  }
}

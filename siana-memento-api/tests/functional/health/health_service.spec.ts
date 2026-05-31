import { test } from '@japa/runner'
import HealthService from '#services/health_service'

/**
 * Teste la logique réelle de HealthService (DB live + pings de tiers injectés).
 * Le check DB exécute un vrai `SELECT 1` contre la base de test.
 */
test.group('HealthService.check()', (group) => {
  group.each.setup(() => HealthService.resetCache())

  test('all components up → healthy', async ({ assert }) => {
    const service = new HealthService(
      async () => true,
      async () => true
    )

    const report = await service.check()

    assert.isTrue(report.healthy)
    assert.equal(report.components.database.status, 'ok')
    assert.equal(report.components.cloudinary.status, 'ok')
    assert.equal(report.components.resend.status, 'ok')
  })

  test('cloudinary down → unhealthy with detail', async ({ assert }) => {
    const service = new HealthService(
      async () => false,
      async () => true
    )

    const report = await service.check()

    assert.isFalse(report.healthy)
    assert.equal(report.components.cloudinary.status, 'down')
    assert.equal(report.components.cloudinary.message, 'cloudinary unreachable')
    assert.equal(report.components.resend.status, 'ok')
  })

  test('resend throwing → down without crashing the check', async ({ assert }) => {
    const service = new HealthService(
      async () => true,
      async () => {
        throw new Error('network error')
      }
    )

    const report = await service.check()

    assert.isFalse(report.healthy)
    assert.equal(report.components.resend.status, 'down')
    assert.equal(report.components.resend.message, 'resend unreachable')
  })
})

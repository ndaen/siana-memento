import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import env from '#start/env'
import HealthService from '#services/health_service'

const SECRET = env.get('MONITORING_SECRET')

function swapHealth(report: Awaited<ReturnType<HealthService['check']>>) {
  app.container.swap(HealthService, () => {
    return {
      async check() {
        return report
      },
    } as unknown as HealthService
  })
}

const ALL_OK = {
  healthy: true,
  components: {
    database: { status: 'ok' as const, responseTime: 2 },
    cloudinary: { status: 'ok' as const, responseTime: 5 },
    resend: { status: 'ok' as const, responseTime: 6 },
  },
}

test.group('GET /api/health/live (liveness)', () => {
  test('returns 200 with a minimal ok body and requires no secret', async ({ client, assert }) => {
    const response = await client.get('/api/health/live')

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.status, 'ok')
    assert.exists(body.timestamp)
    // Route publique : aucune info sensible (pas de détail des composants)
    assert.notProperty(body, 'components')
  })
})

test.group('GET /api/health (readiness)', (group) => {
  group.each.teardown(() => app.container.restore(HealthService))

  test('returns 401 without secret', async ({ client }) => {
    const response = await client.get('/api/health')
    response.assertStatus(401)
  })

  test('returns 401 with a wrong secret', async ({ client }) => {
    const response = await client.get('/api/health').header('x-monitoring-secret', 'wrong-secret')
    response.assertStatus(401)
  })

  test('returns 401 when the secret is passed via query string (header-only)', async ({
    client,
  }) => {
    // Le secret en query string n'est PAS accepté (risque de fuite dans les access logs).
    const response = await client.get('/api/health').qs({ token: SECRET })
    response.assertStatus(401)
  })

  test('returns 200 with valid secret (header) when all components are up', async ({
    client,
    assert,
  }) => {
    swapHealth(ALL_OK)

    const response = await client.get('/api/health').header('x-monitoring-secret', SECRET)

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.status, 'ok')
    assert.equal(body.components.database.status, 'ok')
    assert.equal(body.components.cloudinary.status, 'ok')
    assert.equal(body.components.resend.status, 'ok')
    assert.isFalse(Number.isNaN(Date.parse(body.timestamp)))
  })

  test('returns 503 with the failing component detail when a component is down', async ({
    client,
    assert,
  }) => {
    swapHealth({
      healthy: false,
      components: {
        database: { status: 'ok', responseTime: 2 },
        cloudinary: { status: 'down', message: 'cloudinary unreachable' },
        resend: { status: 'ok', responseTime: 6 },
      },
    })

    const response = await client.get('/api/health').header('x-monitoring-secret', SECRET)

    response.assertStatus(503)
    const body = response.body()
    assert.equal(body.status, 'error')
    assert.equal(body.components.cloudinary.status, 'down')
  })

  test('GET /api/health is not rate limited (no 429 on rapid consecutive calls)', async ({
    client,
    assert,
  }) => {
    swapHealth(ALL_OK)

    let lastStatus = 0
    for (let i = 0; i < 15; i++) {
      const response = await client.get('/api/health').header('x-monitoring-secret', SECRET)
      lastStatus = response.status()
    }
    assert.notEqual(lastStatus, 429)
  })
})

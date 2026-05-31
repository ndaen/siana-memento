import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { loginAs } from '#tests/helpers/auth'
import { createPaidOrderWithDesign } from '#tests/helpers/factories'

async function fetchMetrics(client: any, cookie: string) {
  const response = await client.get('/api/admin/metrics').header('Cookie', cookie)
  return response
}

test.group('GET /api/admin/metrics', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/admin/metrics')
    response.assertStatus(401)
  })

  test('returns 403 for a non-admin user (NFR-S10)', async ({ client, assert }) => {
    const { cookie } = await loginAs(client, { isAdmin: false })
    const response = await fetchMetrics(client, cookie)

    response.assertStatus(403)
    assert.isFalse(response.body().success)
  })

  test('returns 200 with the metrics structure for an admin', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client, { isAdmin: true })
    await createPaidOrderWithDesign(user.id)

    const response = await fetchMetrics(client, cookie)

    response.assertStatus(200)
    const { data } = response.body()
    assert.equal(data.periodDays, 30)
    assert.isNumber(data.revenue)
    assert.isNumber(data.ordersCount)
    assert.isNumber(data.grossMargin)
    assert.property(data, 'avgApiCost')
    assert.property(data, 'conversionRate')
    assert.isTrue(data.apiCostEstimated)
    // CAC : données UTM absentes → N/A par canal (jamais 0)
    assert.isFalse(data.cac.utmAvailable)
    assert.isNull(data.cac.channels.organique)
  })

  // Delta-based : la base de dev partagée peut contenir des données committées résiduelles ;
  // on mesure donc la variation due à NOS insertions, pas un total absolu.
  test('counts only paid orders in the revenue/ordersCount deltas', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client, { isAdmin: true })

    const beforeRes = await fetchMetrics(client, cookie)
    const before = beforeRes.body().data
    await createPaidOrderWithDesign(user.id, { status: 'paid' })
    await createPaidOrderWithDesign(user.id, { status: 'pending' })
    const afterRes = await fetchMetrics(client, cookie)
    const after = afterRes.body().data

    assert.equal(after.ordersCount - before.ordersCount, 1)
    assert.closeTo(after.revenue - before.revenue, 19.9, 0.001)
  })
})

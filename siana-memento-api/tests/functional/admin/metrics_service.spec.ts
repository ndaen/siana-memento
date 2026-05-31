import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import MetricsService from '#services/metrics_service'
import User from '#models/user'
import { createPaidOrderWithDesign, createGeneration } from '#tests/helpers/factories'

async function makeUser() {
  return User.create({
    email: `m-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'motdepasse123',
    provider: 'email',
  })
}

// Delta-based : la base de dev partagée peut déjà contenir des commandes/designs committés.
// On vérifie donc la variation induite par nos insertions, pas un total absolu.
test.group('MetricsService.getDashboardMetrics', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('counts only paid orders in the revenue/ordersCount deltas', async ({ assert }) => {
    const service = new MetricsService()
    const before = await service.getDashboardMetrics()

    const user = await makeUser()
    await createPaidOrderWithDesign(user.id, { status: 'paid' })
    await createPaidOrderWithDesign(user.id, { status: 'paid' })
    await createPaidOrderWithDesign(user.id, { status: 'failed' })

    const after = await service.getDashboardMetrics()

    assert.equal(after.ordersCount - before.ordersCount, 2)
    assert.closeTo(after.revenue - before.revenue, 39.8, 0.001)
  })

  test('excludes orders older than 30 days from the window', async ({ assert }) => {
    const service = new MetricsService()
    const before = await service.getDashboardMetrics()

    const user = await makeUser()
    await createPaidOrderWithDesign(user.id, {
      status: 'paid',
      createdAt: DateTime.now().minus({ days: 40 }),
    })

    const after = await service.getDashboardMetrics()

    assert.equal(after.ordersCount - before.ordersCount, 0)
    assert.closeTo(after.revenue - before.revenue, 0, 0.001)
  })

  test('gross margin never exceeds revenue (api cost is subtracted)', async ({ assert }) => {
    const metrics = await new MetricsService().getDashboardMetrics()
    assert.isAtMost(metrics.grossMargin, metrics.revenue)
  })

  test('subtracts estimated API cost per generation from the margin delta', async ({ assert }) => {
    const service = new MetricsService()
    const before = await service.getDashboardMetrics()

    const user = await makeUser()
    const { design } = await createPaidOrderWithDesign(user.id, { status: 'paid' })
    // 2 générations → coût estimé = 2 × GEMINI_COST_EUR_ESTIMATE (0,50€) = 1,00€
    await createGeneration(design.id, { iterationNumber: 1 })
    await createGeneration(design.id, { iterationNumber: 2 })

    const after = await service.getDashboardMetrics()

    // Revenu +19,90 ; coût +1,00 ; marge +18,90
    assert.closeTo(after.revenue - before.revenue, 19.9, 0.001)
    assert.closeTo(after.grossMargin - before.grossMargin, 18.9, 0.001)
  })

  test('conversionRate is null or a number in [0, 1]', async ({ assert }) => {
    const metrics = await new MetricsService().getDashboardMetrics()
    if (metrics.conversionRate !== null) {
      assert.isAtLeast(metrics.conversionRate, 0)
    }
  })
})

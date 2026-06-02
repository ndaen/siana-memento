import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { loginAs } from '#tests/helpers/auth'
import { createDesign, createGeneration } from '#tests/helpers/factories'

async function fetchLogs(client: any, cookie: string, query = '') {
  return client.get(`/api/admin/logs${query}`).header('Cookie', cookie)
}

test.group('GET /api/admin/logs', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/admin/logs')
    response.assertStatus(401)
  })

  test('returns 403 for a non-admin user (NFR-S10)', async ({ client, assert }) => {
    const { cookie } = await loginAs(client, { isAdmin: false })
    const response = await fetchLogs(client, cookie)

    response.assertStatus(403)
    assert.isFalse(response.body().success)
  })

  test('returns paginated generations with the expected item shape for an admin', async ({
    client,
    assert,
  }) => {
    const { cookie, user } = await loginAs(client, { isAdmin: true })
    const design = await createDesign({ userId: user.id, template: 'boheme' })
    const gen = await createGeneration(design.id, { status: 'completed' })

    const response = await fetchLogs(client, cookie, '?perPage=50')
    response.assertStatus(200)
    const { data } = response.body()

    assert.property(data, 'meta')
    assert.isArray(data.items)
    assert.isNumber(data.meta.total)
    assert.equal(data.meta.perPage, 50)

    // Test par id (base de dev partagée) : la génération créée doit figurer dans les logs.
    const item = data.items.find((i: any) => i.id === gen.id)
    assert.exists(item, 'la génération créée doit apparaître dans les logs')
    assert.equal(item.status, 'completed')
    assert.equal(item.template, 'boheme')
    assert.equal(item.userId, user.id)
    assert.isTrue(item.costEstimated)
    assert.isNumber(item.apiCostCents)
  })

  test('failedOnly=true returns only failed generations (AC#2)', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client, { isAdmin: true })
    const design = await createDesign({ userId: user.id, template: 'moderne' })
    const failed = await createGeneration(design.id, { status: 'failed' })
    const completed = await createGeneration(design.id, { status: 'completed', iterationNumber: 2 })

    const response = await fetchLogs(client, cookie, '?failedOnly=true&perPage=100')
    response.assertStatus(200)
    const items = response.body().data.items as any[]
    const ids = items.map((i) => i.id)

    assert.include(ids, failed.id)
    assert.notInclude(ids, completed.id)
    assert.isTrue(
      items.every((i) => i.status === 'failed'),
      'tous les items renvoyés doivent être en échec'
    )
  })

  test('coerces non-numeric page/perPage to defaults without crashing', async ({
    client,
    assert,
  }) => {
    const { cookie } = await loginAs(client, { isAdmin: true })

    // ?page=abc → Number()=NaN ; sans coercion, LIMIT/OFFSET NaN ferait planter la requête.
    const response = await fetchLogs(client, cookie, '?page=abc&perPage=xyz')
    response.assertStatus(200)
    const { meta } = response.body().data

    assert.equal(meta.currentPage, 1)
    assert.equal(meta.perPage, 20)
  })

  test('respects the perPage limit and exposes pagination meta', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client, { isAdmin: true })
    const design = await createDesign({ userId: user.id })
    await createGeneration(design.id, { status: 'completed', iterationNumber: 1 })
    await createGeneration(design.id, { status: 'completed', iterationNumber: 2 })
    await createGeneration(design.id, { status: 'completed', iterationNumber: 3 })

    const response = await fetchLogs(client, cookie, '?page=1&perPage=2')
    response.assertStatus(200)
    const { data } = response.body()

    assert.equal(data.meta.currentPage, 1)
    assert.equal(data.meta.perPage, 2)
    assert.isAtMost(data.items.length, 2)
  })
})

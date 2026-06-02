import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Order from '#models/order'
import { loginAs } from '#tests/helpers/auth'
import { createPaidOrderWithDesign } from '#tests/helpers/factories'

async function fetchOrders(client: any, cookie: string, query = '') {
  return client.get(`/api/admin/orders${query}`).header('Cookie', cookie)
}

test.group('GET /api/admin/orders', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/admin/orders')
    response.assertStatus(401)
  })

  test('returns 403 for a non-admin user (NFR-S10)', async ({ client, assert }) => {
    const { cookie } = await loginAs(client, { isAdmin: false })
    const response = await fetchOrders(client, cookie)

    response.assertStatus(403)
    assert.isFalse(response.body().success)
  })

  test('returns paginated orders with the expected item shape (AC#1)', async ({
    client,
    assert,
  }) => {
    const { cookie, user } = await loginAs(client, { isAdmin: true })
    const { order } = await createPaidOrderWithDesign(user.id, { template: 'boheme' })

    const response = await fetchOrders(client, cookie, '?perPage=50')
    response.assertStatus(200)
    const { data } = response.body()

    assert.property(data, 'meta')
    assert.isArray(data.items)
    assert.isNumber(data.meta.total)
    assert.equal(data.meta.perPage, 50)

    const item = data.items.find((o: any) => o.id === order.id)
    assert.exists(item, 'la commande créée doit apparaître dans la liste')
    assert.equal(item.status, 'paid')
    assert.equal(item.template, 'boheme')
    assert.equal(item.userId, user.id)
    assert.equal(item.userEmail, user.email)
    assert.isNumber(item.amountCents)
  })

  test('status=email_failed returns only failed-delivery orders (AC#1)', async ({
    client,
    assert,
  }) => {
    const { cookie, user } = await loginAs(client, { isAdmin: true })
    const { order: failed } = await createPaidOrderWithDesign(user.id, {
      status: 'email_failed',
      emailSentAt: null,
    })
    const { order: paid } = await createPaidOrderWithDesign(user.id, { status: 'paid' })

    const response = await fetchOrders(client, cookie, '?status=email_failed&perPage=100')
    response.assertStatus(200)
    const items = response.body().data.items as any[]
    const ids = items.map((o) => o.id)

    assert.include(ids, failed.id)
    assert.notInclude(ids, paid.id)
    assert.isTrue(
      items.every((o) => o.status === 'email_failed'),
      'tous les items renvoyés doivent être en échec de livraison'
    )
  })

  test('coerces non-numeric page/perPage to defaults without crashing', async ({
    client,
    assert,
  }) => {
    const { cookie } = await loginAs(client, { isAdmin: true })

    const response = await fetchOrders(client, cookie, '?page=abc&perPage=xyz')
    response.assertStatus(200)
    const { meta } = response.body().data

    assert.equal(meta.currentPage, 1)
    assert.equal(meta.perPage, 20)
  })
})

test.group('POST /api/admin/orders/:id/resend-email', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.post('/api/admin/orders/1/resend-email')
    response.assertStatus(401)
  })

  test('returns 403 for a non-admin user (NFR-S10)', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client, { isAdmin: false })
    const { order } = await createPaidOrderWithDesign(user.id, { status: 'email_failed' })

    const response = await client
      .post(`/api/admin/orders/${order.id}/resend-email`)
      .header('Cookie', cookie)

    response.assertStatus(403)
    assert.isFalse(response.body().success)
  })

  test('returns 404 for an unknown order', async ({ client, assert }) => {
    const { cookie } = await loginAs(client, { isAdmin: true })

    const response = await client
      .post('/api/admin/orders/99999999/resend-email')
      .header('Cookie', cookie)

    response.assertStatus(404)
    assert.isFalse(response.body().success)
    assert.equal(response.body().error.code, 'NOT_FOUND')
  })

  test('returns 409 when the order is not in email_failed (status guard, AC#1)', async ({
    client,
    assert,
  }) => {
    const { cookie, user } = await loginAs(client, { isAdmin: true })
    // Commande déjà payée : le renvoi ne doit PAS la « re-livrer » ni la re-forcer à paid.
    const { order } = await createPaidOrderWithDesign(user.id, { status: 'paid' })

    const response = await client
      .post(`/api/admin/orders/${order.id}/resend-email`)
      .header('Cookie', cookie)

    response.assertStatus(409)
    assert.isFalse(response.body().success)
    assert.equal(response.body().error.code, 'INVALID_STATUS')

    // Le statut reste inchangé.
    const reloaded = await Order.findOrFail(order.id)
    assert.equal(reloaded.status, 'paid')
  })

  test('failed delivery keeps the order in email_failed (recoverable, AC#4)', async ({
    client,
    assert,
  }) => {
    const { cookie, user } = await loginAs(client, { isAdmin: true })
    // cloudinaryPublicId: null → sendDesignDelivery échoue immédiatement (sans réseau).
    const { order } = await createPaidOrderWithDesign(user.id, {
      status: 'email_failed',
      emailSentAt: null,
      cloudinaryPublicId: null,
    })

    const response = await client
      .post(`/api/admin/orders/${order.id}/resend-email`)
      .header('Cookie', cookie)

    response.assertStatus(502)
    assert.isFalse(response.body().success)
    assert.equal(response.body().error.code, 'SEND_FAILED')

    // La commande reste récupérable : aucune perte de données (AC#4).
    const reloaded = await Order.findOrFail(order.id)
    assert.equal(reloaded.status, 'email_failed')
    assert.isNull(reloaded.emailSentAt)
  })
})

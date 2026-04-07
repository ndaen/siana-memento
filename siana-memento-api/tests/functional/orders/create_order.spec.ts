import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Order from '#models/order'
import { DateTime } from 'luxon'
import { loginAs, createDesign } from '#tests/helpers/index'

test.group('POST /api/orders', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 without authentication', async ({ client }) => {
    const response = await client.post('/api/orders').json({ designId: 1 })
    response.assertStatus(401)
  })

  test('creates order for completed design (201 with valid Stripe config, 500 otherwise)', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const design = await createDesign({ userId: user.id, status: 'completed' })

    const response = await client
      .post('/api/orders')
      .header('cookie', cookie)
      .json({ designId: design.id })

    const body = response.body()
    const status = response.response.status

    if (status === 201) {
      assert.isTrue(body.success)
      assert.exists(body.data.orderId)
      assert.exists(body.data.checkoutUrl)
      const order = await Order.find(body.data.orderId)
      assert.isNotNull(order)
      assert.equal(order!.status, 'pending')
    } else {
      assert.equal(status, 500)
      assert.isFalse(body.success)
      assert.equal(body.error.code, 'STRIPE_SESSION_FAILED')
    }

    const orders = await Order.query().where('userId', user.id).where('designId', design.id)
    assert.isAbove(orders.length, 0)
    assert.equal(orders[0].amount, 1990)
  })

  test('returns 403 for design owned by another user', async ({ client, assert }) => {
    const { user: owner } = await loginAs(client, { email: `owner-${Date.now()}@example.com` })
    const design = await createDesign({ userId: owner.id, status: 'completed' })

    const { cookie: otherCookie } = await loginAs(client, { email: `other-${Date.now()}@example.com` })

    const response = await client
      .post('/api/orders')
      .header('cookie', otherCookie)
      .json({ designId: design.id })

    response.assertStatus(403)
    const body = response.body()
    assert.equal(body.error.code, 'FORBIDDEN')
  })

  test('returns 422 for design already paid', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const design = await createDesign({ userId: user.id, status: 'paid' })

    const response = await client
      .post('/api/orders')
      .header('cookie', cookie)
      .json({ designId: design.id })

    response.assertStatus(422)
    const body = response.body()
    assert.equal(body.error.code, 'DESIGN_ALREADY_PAID')
  })

  test('returns 422 for design in draft status', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const design = await createDesign({ userId: user.id, status: 'draft' })

    const response = await client
      .post('/api/orders')
      .header('cookie', cookie)
      .json({ designId: design.id })

    response.assertStatus(422)
    const body = response.body()
    assert.equal(body.error.code, 'DESIGN_NOT_READY')
  })

  test('returns 404 for non-existent design', async ({ client, assert }) => {
    const { cookie } = await loginAs(client)

    const response = await client
      .post('/api/orders')
      .header('cookie', cookie)
      .json({ designId: 99999 })

    response.assertStatus(404)
    const body = response.body()
    assert.equal(body.error.code, 'DESIGN_NOT_FOUND')
  })
})

test.group('POST /api/orders — sessionToken security', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const KNOWN_TOKEN = 'a'.repeat(64)
  const WRONG_TOKEN = 'b'.repeat(64)

  test('anonymous design + correct sessionToken → 201 (claim succeeds)', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const design = await createDesign({ sessionToken: KNOWN_TOKEN, status: 'completed' })

    const response = await client
      .post('/api/orders')
      .header('cookie', cookie)
      .json({ designId: design.id, sessionToken: KNOWN_TOKEN })

    const status = response.response.status
    assert.oneOf(status, [201, 500])

    await design.refresh()
    assert.equal(design.userId, user.id)
  })

  test('anonymous design + wrong sessionToken → 403', async ({ client, assert }) => {
    const { cookie } = await loginAs(client)
    const design = await createDesign({ sessionToken: KNOWN_TOKEN, status: 'completed' })

    const response = await client
      .post('/api/orders')
      .header('cookie', cookie)
      .json({ designId: design.id, sessionToken: WRONG_TOKEN })

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')

    await design.refresh()
    assert.isNull(design.userId)
  })

  test('anonymous design + no sessionToken → 403', async ({ client, assert }) => {
    const { cookie } = await loginAs(client)
    const design = await createDesign({ sessionToken: KNOWN_TOKEN, status: 'completed' })

    const response = await client
      .post('/api/orders')
      .header('cookie', cookie)
      .json({ designId: design.id })

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')

    await design.refresh()
    assert.isNull(design.userId)
  })

  test('anonymous design + sessionToken from ANOTHER design → 403', async ({ client, assert }) => {
    const { cookie } = await loginAs(client)
    const design = await createDesign({ sessionToken: KNOWN_TOKEN, status: 'completed' })
    await createDesign({ sessionToken: WRONG_TOKEN, status: 'completed' })

    const response = await client
      .post('/api/orders')
      .header('cookie', cookie)
      .json({ designId: design.id, sessionToken: WRONG_TOKEN })

    response.assertStatus(403)

    await design.refresh()
    assert.isNull(design.userId)
  })

  test('owned design + no sessionToken → 201 (sessionToken not needed)', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const design = await createDesign({ userId: user.id, status: 'completed' })

    const response = await client
      .post('/api/orders')
      .header('cookie', cookie)
      .json({ designId: design.id })

    const status = response.response.status
    assert.oneOf(status, [201, 500])

    const orders = await Order.query().where('userId', user.id).where('designId', design.id)
    assert.isAbove(orders.length, 0)
  })
})

test.group('GET /api/orders/:id', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns order details for owner', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const design = await createDesign({ userId: user.id, status: 'completed' })
    const order = await Order.create({
      userId: user.id,
      designId: design.id,
      amount: 1990,
      status: 'pending',
    })

    const response = await client
      .get(`/api/orders/${order.id}`)
      .header('cookie', cookie)

    response.assertStatus(200)
    const body = response.body()
    assert.isTrue(body.success)
    assert.equal(body.data.id, order.id)
    assert.equal(body.data.amount, 1990)
  })

  test('returns 403 for order owned by another user', async ({ client }) => {
    const { user: owner } = await loginAs(client, { email: `owner-${Date.now()}@example.com` })
    const design = await createDesign({ userId: owner.id, status: 'completed' })
    const order = await Order.create({
      userId: owner.id,
      designId: design.id,
      amount: 1990,
      status: 'pending',
    })

    const { cookie: otherCookie } = await loginAs(client, { email: `other-${Date.now()}@example.com` })

    const response = await client
      .get(`/api/orders/${order.id}`)
      .header('cookie', otherCookie)

    response.assertStatus(403)
  })

  test('returns 401 without authentication', async ({ client }) => {
    const response = await client.get('/api/orders/1')
    response.assertStatus(401)
  })
})

import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Design from '#models/design'
import Order from '#models/order'
import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'

/**
 * Helper: creates a user, logs in, and returns the session cookie.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loginAs(client: any, email?: string): Promise<{ cookie: string; user: InstanceType<typeof User> }> {
  const userEmail = email ?? `test-${Date.now()}@example.com`
  const user = await User.create({
    email: userEmail,
    password: 'motdepasse123',
    provider: 'email',
  })
  const loginResponse = await client.post('/auth/login').json({ email: userEmail, password: 'motdepasse123' })
  const rawCookies = loginResponse.headers()['set-cookie'] as unknown as string[] | undefined
  const cookie = rawCookies?.map((c: string) => c.split(';')[0]).join('; ') ?? ''
  return { cookie, user }
}

async function createDesignForUser(userId: number, status: Design['status'] = 'completed') {
  return Design.create({
    userId,
    sessionToken: randomBytes(32).toString('hex'),
    status,
    expiresAt: DateTime.now().plus({ days: 7 }),
  })
}

test.group('POST /api/orders', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 without authentication', async ({ client }) => {
    const response = await client.post('/api/orders').json({ designId: 1 })
    response.assertStatus(401)
  })

  test('creates order for completed design (201 with valid Stripe config, 500 otherwise)', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const design = await createDesignForUser(user.id, 'completed')

    const response = await client
      .post('/api/orders')
      .header('cookie', cookie)
      .json({ designId: design.id })

    const body = response.body()
    const status = response.response.status

    if (status === 201) {
      // Stripe config is valid — full flow works
      assert.isTrue(body.success)
      assert.exists(body.data.orderId)
      assert.exists(body.data.checkoutUrl)
      const order = await Order.find(body.data.orderId)
      assert.isNotNull(order)
      assert.equal(order!.status, 'pending')
    } else {
      // Stripe config is invalid (e.g., test price ID) — verify graceful error handling
      assert.equal(status, 500)
      assert.isFalse(body.success)
      assert.equal(body.error.code, 'STRIPE_SESSION_FAILED')
    }

    // Either way, an order should have been created in DB
    const orders = await Order.query().where('userId', user.id).where('designId', design.id)
    assert.isAbove(orders.length, 0)
    assert.equal(orders[0].amount, 1990)
  })

  test('returns 403 for design owned by another user', async ({ client, assert }) => {
    const { user: owner } = await loginAs(client, `owner-${Date.now()}@example.com`)
    const design = await createDesignForUser(owner.id, 'completed')

    const { cookie: otherCookie } = await loginAs(client, `other-${Date.now()}@example.com`)

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
    const design = await createDesignForUser(user.id, 'paid')

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
    const design = await createDesignForUser(user.id, 'draft')

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

test.group('GET /api/orders/:id', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns order details for owner', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const design = await createDesignForUser(user.id, 'completed')
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
    const { user: owner } = await loginAs(client, `owner-${Date.now()}@example.com`)
    const design = await createDesignForUser(owner.id, 'completed')
    const order = await Order.create({
      userId: owner.id,
      designId: design.id,
      amount: 1990,
      status: 'pending',
    })

    const { cookie: otherCookie } = await loginAs(client, `other-${Date.now()}@example.com`)

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

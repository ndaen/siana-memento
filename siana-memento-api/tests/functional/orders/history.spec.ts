import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Design from '#models/design'
import Order from '#models/order'
import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'

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

async function createPaidOrder(userId: number, overrides?: Partial<{ template: string; partner1Name: string; partner2Name: string; createdAt: DateTime }>) {
  const design = await Design.create({
    userId,
    sessionToken: randomBytes(32).toString('hex'),
    status: 'paid',
    template: overrides?.template ?? 'boheme',
    partner1Name: overrides?.partner1Name ?? 'Sophie',
    partner2Name: overrides?.partner2Name ?? 'Thomas',
    weddingDate: DateTime.fromISO('2026-09-15'),
    previewUrl: 'https://res.cloudinary.com/test/previews/design-1.png',
    cloudinaryPublicId: 'designs/design-1',
    expiresAt: DateTime.now().plus({ days: 7 }),
  })

  const order = await Order.create({
    userId,
    designId: design.id,
    amount: 1990,
    status: 'paid',
    paidAt: DateTime.now(),
    emailSentAt: DateTime.now(),
    stripeSessionId: `cs_test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  })

  if (overrides?.createdAt) {
    order.createdAt = overrides.createdAt
    await order.save()
  }

  return { order, design }
}

test.group('GET /api/orders — order history', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns paid orders for the authenticated user', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    await createPaidOrder(user.id)
    await createPaidOrder(user.id, { template: 'moderne', partner1Name: 'Marie', partner2Name: 'Lucas' })

    const response = await client.get('/api/orders').header('cookie', cookie)

    response.assertStatus(200)
    const body = response.body()
    assert.isTrue(body.success)
    assert.isArray(body.data)
    assert.lengthOf(body.data, 2)
  })

  test('does NOT return orders from another user', async ({ client, assert }) => {
    const { user: otherUser } = await loginAs(client, `other-${Date.now()}@example.com`)
    await createPaidOrder(otherUser.id)

    const { cookie } = await loginAs(client, `me-${Date.now()}@example.com`)

    const response = await client.get('/api/orders').header('cookie', cookie)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 0)
  })

  test('does NOT return pending or failed orders', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    await createPaidOrder(user.id)

    // Create pending order
    const pendingDesign = await Design.create({
      userId: user.id,
      sessionToken: randomBytes(32).toString('hex'),
      status: 'completed',
      template: 'classique',
      expiresAt: DateTime.now().plus({ days: 7 }),
    })
    await Order.create({
      userId: user.id,
      designId: pendingDesign.id,
      amount: 1990,
      status: 'pending',
    })

    // Create failed order
    const failedDesign = await Design.create({
      userId: user.id,
      sessionToken: randomBytes(32).toString('hex'),
      status: 'completed',
      template: 'vintage',
      expiresAt: DateTime.now().plus({ days: 7 }),
    })
    await Order.create({
      userId: user.id,
      designId: failedDesign.id,
      amount: 1990,
      status: 'failed',
    })

    const response = await client.get('/api/orders').header('cookie', cookie)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1)
    assert.equal(response.body().data[0].status, 'paid')
  })

  test('returns empty array when user has no orders', async ({ client, assert }) => {
    const { cookie } = await loginAs(client)

    const response = await client.get('/api/orders').header('cookie', cookie)

    response.assertStatus(200)
    assert.isTrue(response.body().success)
    assert.isArray(response.body().data)
    assert.lengthOf(response.body().data, 0)
  })

  test('returns 401 without authentication', async ({ client }) => {
    const response = await client.get('/api/orders')
    response.assertStatus(401)
  })

  test('returns orders sorted by createdAt DESC (newest first)', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    await createPaidOrder(user.id, { createdAt: DateTime.now().minus({ days: 5 }) })
    await createPaidOrder(user.id, { createdAt: DateTime.now().minus({ days: 1 }) })
    await createPaidOrder(user.id, { createdAt: DateTime.now().minus({ days: 3 }) })

    const response = await client.get('/api/orders').header('cookie', cookie)

    response.assertStatus(200)
    const data = response.body().data
    assert.lengthOf(data, 3)
    // Verify DESC order: newest first
    const dates = data.map((o: { createdAt: string }) => new Date(o.createdAt).getTime())
    assert.isTrue(dates[0] >= dates[1])
    assert.isTrue(dates[1] >= dates[2])
  })

  test('each order includes design data (template, partnerNames, previewUrl)', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    await createPaidOrder(user.id)

    const response = await client.get('/api/orders').header('cookie', cookie)

    response.assertStatus(200)
    const order = response.body().data[0]
    assert.isNotNull(order.design)
    assert.equal(order.design.template, 'boheme')
    assert.equal(order.design.partner1Name, 'Sophie')
    assert.equal(order.design.partner2Name, 'Thomas')
    assert.exists(order.design.previewUrl)
    assert.notProperty(order.design, 'cloudinaryPublicId')
  })
})

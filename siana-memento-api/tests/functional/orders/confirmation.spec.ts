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

async function createDesignWithPreview(userId: number) {
  return Design.create({
    userId,
    sessionToken: randomBytes(32).toString('hex'),
    status: 'paid',
    template: 'boheme',
    partner1Name: 'Sophie',
    partner2Name: 'Thomas',
    weddingDate: DateTime.fromISO('2026-09-15'),
    previewUrl: 'https://res.cloudinary.com/test/previews/design-1.png',
    cloudinaryPublicId: 'designs/design-1',
    expiresAt: DateTime.now().plus({ days: 7 }),
  })
}

test.group('GET /api/orders/:id — enriched response', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns design info (template, partner names, weddingDate, previewUrl)', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const design = await createDesignWithPreview(user.id)
    const order = await Order.create({
      userId: user.id,
      designId: design.id,
      amount: 1990,
      status: 'paid',
      paidAt: DateTime.now(),
      stripeSessionId: 'cs_test_enriched',
    })

    const response = await client
      .get(`/api/orders/${order.id}`)
      .header('cookie', cookie)

    response.assertStatus(200)
    const body = response.body()
    assert.isTrue(body.success)
    assert.equal(body.data.id, order.id)
    assert.equal(body.data.status, 'paid')
    assert.exists(body.data.emailSentAt !== undefined)
    assert.isNotNull(body.data.design)
    assert.equal(body.data.design.template, 'boheme')
    assert.equal(body.data.design.partner1Name, 'Sophie')
    assert.equal(body.data.design.partner2Name, 'Thomas')
    assert.exists(body.data.design.weddingDate)
    assert.equal(body.data.design.previewUrl, 'https://res.cloudinary.com/test/previews/design-1.png')
  })

  test('does NOT expose cloudinaryPublicId in response', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const design = await createDesignWithPreview(user.id)
    const order = await Order.create({
      userId: user.id,
      designId: design.id,
      amount: 1990,
      status: 'paid',
      paidAt: DateTime.now(),
    })

    const response = await client
      .get(`/api/orders/${order.id}`)
      .header('cookie', cookie)

    response.assertStatus(200)
    const body = response.body()
    assert.notProperty(body.data.design, 'cloudinaryPublicId')
    assert.notProperty(body.data.design, 'generatedImageUrl')
    assert.notProperty(body.data.design, 'sessionToken')
  })
})

test.group('GET /api/orders/by-session/:sessionId', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns order for authenticated owner by Stripe session ID', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const design = await createDesignWithPreview(user.id)
    const stripeSessionId = `cs_test_${Date.now()}`
    const order = await Order.create({
      userId: user.id,
      designId: design.id,
      amount: 1990,
      status: 'paid',
      paidAt: DateTime.now(),
      stripeSessionId,
    })

    const response = await client
      .get(`/api/orders/by-session/${stripeSessionId}`)
      .header('cookie', cookie)

    response.assertStatus(200)
    const body = response.body()
    assert.isTrue(body.success)
    assert.equal(body.data.id, order.id)
    assert.equal(body.data.status, 'paid')
    assert.isNotNull(body.data.design)
    assert.equal(body.data.design.template, 'boheme')
  })

  test('returns 403 for order owned by another user', async ({ client, assert }) => {
    const { user: owner } = await loginAs(client, `owner-${Date.now()}@example.com`)
    const design = await createDesignWithPreview(owner.id)
    const stripeSessionId = `cs_test_other_${Date.now()}`
    await Order.create({
      userId: owner.id,
      designId: design.id,
      amount: 1990,
      status: 'paid',
      paidAt: DateTime.now(),
      stripeSessionId,
    })

    const { cookie: otherCookie } = await loginAs(client, `other-${Date.now()}@example.com`)

    const response = await client
      .get(`/api/orders/by-session/${stripeSessionId}`)
      .header('cookie', otherCookie)

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('returns 404 for non-existent session ID', async ({ client, assert }) => {
    const { cookie } = await loginAs(client)

    const response = await client
      .get('/api/orders/by-session/cs_nonexistent_999')
      .header('cookie', cookie)

    response.assertStatus(404)
    assert.equal(response.body().error.code, 'ORDER_NOT_FOUND')
  })

  test('returns 401 without authentication', async ({ client }) => {
    const response = await client.get('/api/orders/by-session/cs_test_unauth')
    response.assertStatus(401)
  })
})

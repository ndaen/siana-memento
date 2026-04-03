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

async function createPaidOrderWithDesign(
  userId: number,
  overrides?: Partial<{ paidAt: DateTime; cloudinaryPublicId: string | null; emailSentAt: DateTime | null; status: 'pending' | 'paid' | 'failed' }>
) {
  const design = await Design.create({
    userId,
    sessionToken: randomBytes(32).toString('hex'),
    status: 'paid' as const,
    template: 'boheme' as const,
    partner1Name: 'Sophie',
    partner2Name: 'Thomas',
    weddingDate: DateTime.fromISO('2026-09-15'),
    previewUrl: 'https://res.cloudinary.com/test/previews/design-1.png',
    cloudinaryPublicId: overrides?.cloudinaryPublicId !== undefined ? overrides.cloudinaryPublicId : 'designs/design-1',
    expiresAt: DateTime.now().plus({ days: 7 }),
  })

  const order = await Order.create({
    userId,
    designId: design.id,
    amount: 1990,
    status: overrides?.status ?? 'paid',
    paidAt: overrides?.paidAt ?? DateTime.now(),
    emailSentAt: overrides?.emailSentAt !== undefined ? overrides.emailSentAt : DateTime.now(),
    stripeSessionId: `cs_test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  })

  return { order, design }
}

test.group('GET /api/orders/:id/download — design re-download', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 200 with downloadUrl for paid order within 7 days', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const { order } = await createPaidOrderWithDesign(user.id)

    const response = await client.get(`/api/orders/${order.id}/download`).header('cookie', cookie)

    response.assertStatus(200)
    const body = response.body()
    assert.isTrue(body.success)
    assert.exists(body.data.downloadUrl)
    assert.include(body.data.downloadUrl, 'cloudinary')
    assert.include(body.data.downloadUrl, 'designs/design-1')
  })

  test('returns 410 Gone for order paid more than 7 days ago', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const { order } = await createPaidOrderWithDesign(user.id, {
      paidAt: DateTime.now().minus({ days: 8 }),
    })

    const response = await client.get(`/api/orders/${order.id}/download`).header('cookie', cookie)

    response.assertStatus(410)
    const body = response.body()
    assert.isFalse(body.success)
    assert.equal(body.error.code, 'DOWNLOAD_EXPIRED')
  })

  test('returns 403 for order owned by another user', async ({ client, assert }) => {
    const { user: owner } = await loginAs(client, `owner-${Date.now()}@example.com`)
    const { order } = await createPaidOrderWithDesign(owner.id)

    const { cookie } = await loginAs(client, `other-${Date.now()}@example.com`)

    const response = await client.get(`/api/orders/${order.id}/download`).header('cookie', cookie)

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('returns 401 without authentication', async ({ client }) => {
    const response = await client.get('/api/orders/1/download')
    response.assertStatus(401)
  })

  test('returns 400 for unpaid order (pending)', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const { order } = await createPaidOrderWithDesign(user.id, { status: 'pending' })

    const response = await client.get(`/api/orders/${order.id}/download`).header('cookie', cookie)

    response.assertStatus(400)
    assert.equal(response.body().error.code, 'ORDER_NOT_PAID')
  })

  test('returns 404 for non-existent order', async ({ client, assert }) => {
    const { cookie } = await loginAs(client)

    const response = await client.get('/api/orders/99999/download').header('cookie', cookie)

    response.assertStatus(404)
    assert.equal(response.body().error.code, 'ORDER_NOT_FOUND')
  })

  test('returns 422 when design has no cloudinaryPublicId', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const { order } = await createPaidOrderWithDesign(user.id, { cloudinaryPublicId: null })

    const response = await client.get(`/api/orders/${order.id}/download`).header('cookie', cookie)

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'DESIGN_FILE_MISSING')
  })
})

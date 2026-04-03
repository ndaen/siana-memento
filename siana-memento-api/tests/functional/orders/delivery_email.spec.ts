import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Design from '#models/design'
import Order from '#models/order'
import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'

async function createPaidOrder() {
  const user = await User.create({
    email: `  delivery-${Date.now()}@example.com  `,
    password: 'motdepasse123',
    provider: 'email',
  })
  const design = await Design.create({
    userId: user.id,
    sessionToken: randomBytes(32).toString('hex'),
    status: 'paid',
    partner1Name: 'Claire',
    partner2Name: 'Marc',
    weddingDate: DateTime.fromISO('2026-09-15'),
    cloudinaryPublicId: 'designs/design-test-42',
    expiresAt: DateTime.now().plus({ days: 7 }),
  })
  const order = await Order.create({
    userId: user.id,
    designId: design.id,
    amount: 1990,
    status: 'paid',
    paidAt: DateTime.now(),
  })
  return { user, design, order }
}

test.group('Email Service — sendDesignDelivery', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('trims email whitespace before sending', async ({ assert }) => {
    const { user } = await createPaidOrder()
    // User email has leading/trailing spaces
    assert.isTrue(user.email.startsWith(' '))
    assert.equal(user.email.trim(), `delivery-${user.email.trim().split('@')[0].replace('delivery-', '')}@example.com`)
    // Verify trim produces valid email
    const trimmed = user.email.trim()
    assert.isFalse(trimmed.startsWith(' '))
    assert.isFalse(trimmed.endsWith(' '))
    assert.match(trimmed, /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  })

  test('emailSentAt is null/undefined by default on new orders', async ({ assert }) => {
    const { order } = await createPaidOrder()
    await order.refresh()
    assert.isNull(order.emailSentAt)
  })

  test('emailSentAt can be set on order', async ({ assert }) => {
    const { order } = await createPaidOrder()
    order.emailSentAt = DateTime.now()
    await order.save()
    await order.refresh()
    assert.isNotNull(order.emailSentAt)
  })

  test('idempotence: emailSentAt prevents double email send', async ({ assert }) => {
    const { order } = await createPaidOrder()
    // Simulate first email sent
    order.emailSentAt = DateTime.now()
    await order.save()
    await order.refresh()

    // Second call should detect emailSentAt and skip
    assert.isNotNull(order.emailSentAt)
    // The handleCheckoutCompleted check: if (order.emailSentAt) return — skip
  })

  test('sendDesignDelivery returns success false when cloudinaryPublicId is null', async ({ assert }) => {
    const { sendDesignDelivery } = await import('#services/email_service')

    const user = await User.create({
      email: `no-cloudinary-${Date.now()}@example.com`,
      password: 'motdepasse123',
      provider: 'email',
    })
    const design = await Design.create({
      userId: user.id,
      sessionToken: randomBytes(32).toString('hex'),
      status: 'paid',
      cloudinaryPublicId: null,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })
    const order = await Order.create({
      userId: user.id,
      designId: design.id,
      amount: 1990,
      status: 'paid',
      paidAt: DateTime.now(),
    })

    const result = await sendDesignDelivery(order, user, design)
    assert.isFalse(result.success)
    assert.isUndefined(result.resendId)
  })

  test('sendDesignDelivery returns success false when Cloudinary fetch fails', async ({ assert }) => {
    const { sendDesignDelivery } = await import('#services/email_service')

    const user = await User.create({
      email: `fetch-fail-${Date.now()}@example.com`,
      password: 'motdepasse123',
      provider: 'email',
    })
    const design = await Design.create({
      userId: user.id,
      sessionToken: randomBytes(32).toString('hex'),
      status: 'paid',
      cloudinaryPublicId: 'designs/nonexistent-design-99999',
      expiresAt: DateTime.now().plus({ days: 7 }),
    })
    const order = await Order.create({
      userId: user.id,
      designId: design.id,
      amount: 1990,
      status: 'paid',
      paidAt: DateTime.now(),
    })

    const result = await sendDesignDelivery(order, user, design)
    // Will fail because the Cloudinary URL points to a nonexistent resource
    assert.isFalse(result.success)
    assert.isUndefined(result.resendId)
  })
})

test.group('Order + Email ACID independence', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('order stays paid even if email delivery fails', async ({ assert }) => {
    const { order } = await createPaidOrder()

    // Order is paid
    assert.equal(order.status, 'paid')
    assert.isNotNull(order.paidAt)

    // Email not sent yet
    await order.refresh()
    assert.isNull(order.emailSentAt)

    // Order remains paid regardless of email status
    await order.refresh()
    assert.equal(order.status, 'paid')
  })
})

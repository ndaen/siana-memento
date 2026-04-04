import User from '#models/user'
import Design from '#models/design'
import Order from '#models/order'
import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loginAs(client: any, email?: string): Promise<{ cookie: string; user: InstanceType<typeof User> }> {
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

export async function createPaidOrderWithDesign(
  userId: number,
  overrides?: Partial<{
    template: string
    partner1Name: string
    partner2Name: string
    createdAt: DateTime
    paidAt: DateTime
    cloudinaryPublicId: string | null
    emailSentAt: DateTime | null
    status: 'pending' | 'paid' | 'failed'
  }>
) {
  const design = await Design.create({
    userId,
    sessionToken: randomBytes(32).toString('hex'),
    status: 'paid' as const,
    template: (overrides?.template ?? 'boheme') as 'boheme',
    partner1Name: overrides?.partner1Name ?? 'Sophie',
    partner2Name: overrides?.partner2Name ?? 'Thomas',
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

  if (overrides?.createdAt) {
    order.createdAt = overrides.createdAt
    await order.save()
  }

  return { order, design }
}

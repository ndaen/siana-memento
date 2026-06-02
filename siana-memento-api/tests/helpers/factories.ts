import Design from '#models/design'
import Order from '#models/order'
import Photo from '#models/photo'
import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'

export async function createDesign(
  overrides?: Partial<{
    userId: number | null
    sessionToken: string
    status: Design['status']
    template: string
    partner1Name: string
    partner2Name: string
    weddingDate: DateTime
    weddingLocation: string
    previewUrl: string
    cloudinaryPublicId: string | null
    expiresAt: DateTime
    iterationsUsed: number
  }>
) {
  return Design.create({
    userId: overrides?.userId ?? null,
    sessionToken: overrides?.sessionToken ?? randomBytes(32).toString('hex'),
    status: (overrides?.status ?? 'draft') as 'draft',
    template: overrides?.template as 'boheme' | undefined,
    partner1Name: overrides?.partner1Name,
    partner2Name: overrides?.partner2Name,
    weddingDate: overrides?.weddingDate,
    weddingLocation: overrides?.weddingLocation,
    previewUrl: overrides?.previewUrl,
    cloudinaryPublicId: overrides?.cloudinaryPublicId ?? undefined,
    expiresAt: overrides?.expiresAt ?? DateTime.now().plus({ days: 7 }),
    iterationsUsed: overrides?.iterationsUsed,
  })
}

export async function createConfiguredDesign(sessionToken: string, userId: number | null = null) {
  const expiresAt = DateTime.now().plus({ days: 7 })
  const design = await Design.create({
    userId,
    sessionToken,
    status: 'draft',
    expiresAt,
    template: 'boheme',
    partner1Name: 'Sophie',
    partner2Name: 'Thomas',
    weddingDate: DateTime.fromISO('2026-09-20'),
    weddingLocation: 'Château de Lastours',
  })
  await Photo.create({
    designId: design.id,
    position: 1,
    cloudinaryPublicId: 'designs/session123/photo1_abc',
    cloudinaryUrl: 'https://res.cloudinary.com/mycloud/image/upload/v1234/photo1.jpg',
    expiresAt,
  })
  return design
}

export async function createDesignWithPreview(userId: number) {
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
    cloudinaryPublicId:
      overrides?.cloudinaryPublicId !== undefined
        ? overrides.cloudinaryPublicId
        : 'designs/design-1',
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

export async function createGeneration(
  designId: number,
  overrides?: Partial<{
    status: 'pending' | 'generating' | 'completed' | 'failed'
    geminiCostUsd: number | null
    iterationNumber: number
    errorMessage: string | null
    createdAt: DateTime
  }>
) {
  const { default: Generation } = await import('#models/generation')
  const generation = await Generation.create({
    designId,
    iterationNumber: overrides?.iterationNumber ?? 1,
    promptUsed: 'test prompt',
    status: overrides?.status ?? 'completed',
    geminiCostUsd: overrides?.geminiCostUsd ?? null,
    errorMessage: overrides?.errorMessage ?? null,
    attempts: 1,
  })

  if (overrides?.createdAt) {
    generation.createdAt = overrides.createdAt
    await generation.save()
  }

  return generation
}

export async function createDesignViaApi(client: any, cookie?: string) {
  const photo = {
    publicId: 'designs/session123/photo1_abc',
    url: 'https://res.cloudinary.com/mycloud/image/upload/v1234/photo1.jpg',
  }
  let req = client.post('/api/designs').json({ photos: [photo] })
  if (cookie) {
    req = req.header('Cookie', cookie)
  }
  const res = await req
  res.assertStatus(201)
  return res.body().data as { designId: number; sessionToken: string }
}

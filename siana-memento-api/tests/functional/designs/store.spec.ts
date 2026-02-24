import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Design from '#models/design'
import Photo from '#models/photo'
import User from '#models/user'
import { DateTime } from 'luxon'

test.group('POST /api/designs', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const validPhoto1 = {
    publicId: 'designs/session123/photo1_abc',
    url: 'https://res.cloudinary.com/mycloud/image/upload/v1234/photo1.jpg',
  }

  const validPhoto2 = {
    publicId: 'designs/session123/photo2_def',
    url: 'https://res.cloudinary.com/mycloud/image/upload/v1234/photo2.jpg',
  }

  test('crée un design avec 1 photo et retourne 201', async ({ client, assert }) => {
    const response = await client.post('/api/designs').json({
      photos: [validPhoto1],
    })

    response.assertStatus(201)
    const body = response.body()

    assert.isTrue(body.success)
    assert.isNumber(body.data.designId)
    assert.isString(body.data.sessionToken)
    assert.equal(body.data.sessionToken.length, 64) // 32 bytes hex = 64 chars

    // Vérifier en DB
    const design = await Design.find(body.data.designId)
    assert.exists(design)
    assert.equal(design!.status, 'draft')
    assert.isNull(design!.userId)
    assert.isNull(design!.template)

    // Vérifier expiration du design (RGPD)
    const expectedMin = DateTime.now().plus({ days: 6, hours: 23 })
    const expectedMax = DateTime.now().plus({ days: 7, hours: 1 })
    assert.isTrue(design!.expiresAt! >= expectedMin)
    assert.isTrue(design!.expiresAt! <= expectedMax)
  })

  test('crée un design avec 2 photos et les 2 sont en DB', async ({ client, assert }) => {
    const response = await client.post('/api/designs').json({
      photos: [validPhoto1, validPhoto2],
    })

    response.assertStatus(201)
    const body = response.body()

    assert.isTrue(body.success)

    const photos = await Photo.query().where('design_id', body.data.designId).orderBy('position')
    assert.equal(photos.length, 2)
    assert.equal(photos[0].position, 1)
    assert.equal(photos[1].position, 2)
    assert.equal(photos[0].cloudinaryPublicId, validPhoto1.publicId)
    assert.equal(photos[1].cloudinaryPublicId, validPhoto2.publicId)
  })

  test('expires_at des photos est à J+7', async ({ client, assert }) => {
    const response = await client.post('/api/designs').json({
      photos: [validPhoto1],
    })

    response.assertStatus(201)

    const photos = await Photo.query().where('design_id', response.body().data.designId)
    assert.equal(photos.length, 1)

    const expiresAt = photos[0].expiresAt
    const expectedMin = DateTime.now().plus({ days: 6, hours: 23 })
    const expectedMax = DateTime.now().plus({ days: 7, hours: 1 })

    assert.isTrue(expiresAt >= expectedMin, 'expires_at doit être >= J+7 - 1h')
    assert.isTrue(expiresAt <= expectedMax, 'expires_at doit être <= J+7 + 1h')
  })

  test("associe le design à l'utilisateur connecté", async ({ client, assert }) => {
    const user = await User.create({
      email: 'sophie@example.com',
      password: 'motdepasse123',
      provider: 'email',
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'sophie@example.com',
      password: 'motdepasse123',
    })
    loginResponse.assertStatus(200)

    // Pattern identique au test google_oauth.spec.ts "GET /auth/me returns user data"
    const rawCookies = loginResponse.headers()['set-cookie'] as unknown as string[] | undefined
    const cookieHeader = rawCookies?.map((c: string) => c.split(';')[0]).join('; ') ?? ''

    const response = await client
      .post('/api/designs')
      .json({ photos: [validPhoto1] })
      .header('Cookie', cookieHeader)

    response.assertStatus(201)

    const design = await Design.find(response.body().data.designId)
    assert.equal(design!.userId, user.id)
  })

  test('retourne 422 si photos est vide', async ({ client, assert }) => {
    const response = await client.post('/api/designs').json({ photos: [] })

    response.assertStatus(422)
    const body = response.body()
    assert.isFalse(body.success ?? true)
  })

  test('retourne 422 si plus de 2 photos', async ({ client }) => {
    const response = await client.post('/api/designs').json({
      photos: [validPhoto1, validPhoto2, validPhoto1],
    })

    response.assertStatus(422)
  })

  test('retourne 422 si publicId est manquant', async ({ client }) => {
    const response = await client.post('/api/designs').json({
      photos: [{ url: 'https://res.cloudinary.com/test/image/upload/v1/photo.jpg' }],
    })

    response.assertStatus(422)
  })

  test("retourne 422 si url n'est pas une URL valide", async ({ client }) => {
    const response = await client.post('/api/designs').json({
      photos: [{ publicId: 'designs/test/photo', url: 'pas-une-url' }],
    })

    response.assertStatus(422)
  })
})

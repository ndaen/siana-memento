import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Design from '#models/design'
import Photo from '#models/photo'
import User from '#models/user'
import { DateTime } from 'luxon'
import { loginAs, createConfiguredDesign } from '#tests/helpers/index'

test.group('POST /api/designs/:id/generate', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const SESSION_TOKEN = 'a'.repeat(64)

  // ─────────────────────────────────────────────────────────────────────
  // Auth middleware — requiert authentification (Story 3-7)
  // ─────────────────────────────────────────────────────────────────────

  test('retourne 401 sans authentification', async ({ client }) => {
    const design = await createConfiguredDesign(SESSION_TOKEN)

    const response = await client
      .post(`/api/designs/${design.id}/generate`)
      .json({ sessionToken: SESSION_TOKEN })

    response.assertStatus(401)
  })

  // ─────────────────────────────────────────────────────────────────────
  // Tests des cas d'erreur métier — requièrent authentification
  // Les designs doivent appartenir à l'utilisateur connecté (userId match)
  // ─────────────────────────────────────────────────────────────────────

  test('retourne 403 avec un sessionToken incorrect pour design anonyme', async ({
    client,
    assert,
  }) => {
    const { cookie } = await loginAs(client)
    const design = await createConfiguredDesign(SESSION_TOKEN)

    const response = await client
      .post(`/api/designs/${design.id}/generate`)
      .json({ sessionToken: 'b'.repeat(64) })
      .header('Cookie', cookie)

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('retourne 403 sans sessionToken pour un design anonyme', async ({ client, assert }) => {
    const { cookie } = await loginAs(client)
    const design = await createConfiguredDesign(SESSION_TOKEN)

    const response = await client
      .post(`/api/designs/${design.id}/generate`)
      .json({})
      .header('Cookie', cookie)

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('retourne 404 pour un design inexistant (firstOrFail)', async ({ client }) => {
    const { cookie } = await loginAs(client)

    const response = await client
      .post('/api/designs/999999/generate')
      .json({ sessionToken: SESSION_TOKEN })
      .header('Cookie', cookie)

    response.assertStatus(404)
  })

  test('retourne 400 DESIGN_NOT_CONFIGURED si template ou données manquantes', async ({
    client,
    assert,
  }) => {
    const { cookie, user } = await loginAs(client)
    const expiresAt = DateTime.now().plus({ days: 7 })
    const design = await Design.create({
      userId: user.id,
      sessionToken: SESSION_TOKEN,
      status: 'draft',
      expiresAt,
    })

    const response = await client
      .post(`/api/designs/${design.id}/generate`)
      .json({ sessionToken: SESSION_TOKEN })
      .header('Cookie', cookie)

    response.assertStatus(400)
    assert.equal(response.body().error.code, 'DESIGN_NOT_CONFIGURED')
  })

  test('retourne 400 MAX_ITERATIONS_REACHED si iterationsUsed >= 3', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const design = await createConfiguredDesign(SESSION_TOKEN, user.id)
    await design.merge({ iterationsUsed: 3 }).save()

    const response = await client
      .post(`/api/designs/${design.id}/generate`)
      .json({ sessionToken: SESSION_TOKEN })
      .header('Cookie', cookie)

    response.assertStatus(400)
    assert.equal(response.body().error.code, 'MAX_ITERATIONS_REACHED')
  })

  test("retourne 403 si l'utilisateur connecté tente d'accéder au design d'un autre", async ({
    client,
    assert,
  }) => {
    const user1 = await User.create({
      email: 'sophie@example.com',
      password: 'motdepasse123',
      provider: 'email',
    })
    const design = await createConfiguredDesign(SESSION_TOKEN, user1.id)

    const { cookie } = await loginAs(client, {
      email: 'thomas@example.com',
      password: 'autremotdepasse',
    })

    const response = await client
      .post(`/api/designs/${design.id}/generate`)
      .json({})
      .header('Cookie', cookie)

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('remet le status à draft si fetch Cloudinary échoue (URL photo invalide)', async ({
    client,
    assert,
  }) => {
    const { cookie, user } = await loginAs(client)
    const expiresAt = DateTime.now().plus({ days: 7 })
    const design = await Design.create({
      userId: user.id,
      sessionToken: SESSION_TOKEN,
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
      cloudinaryPublicId: 'test/invalid',
      cloudinaryUrl: 'https://this-domain-does-not-exist-for-testing.invalid/photo.jpg',
      expiresAt,
    })

    const response = await client
      .post(`/api/designs/${design.id}/generate`)
      .json({ sessionToken: SESSION_TOKEN })
      .header('Cookie', cookie)

    assert.isTrue(
      [500].includes(response.status()),
      `Status attendu 500, reçu ${response.status()}`
    )

    const updatedDesign = await Design.find(design.id)
    assert.equal(updatedDesign!.status, 'draft', 'Le status doit être revenu à draft après échec')
  })

  test('retourne 200 ou 500 selon env (intégration Gemini optionnelle)', async ({
    client,
    assert,
  }) => {
    const { cookie, user } = await loginAs(client)
    const design = await createConfiguredDesign(SESSION_TOKEN, user.id)

    const response = await client
      .post(`/api/designs/${design.id}/generate`)
      .json({ sessionToken: SESSION_TOKEN })
      .header('Cookie', cookie)

    const updatedDesign = await Design.find(design.id)

    if (response.status() === 200) {
      const body = response.body()
      assert.isTrue(body.success)
      assert.equal(body.data.status, 'completed')
      assert.equal(updatedDesign!.status, 'completed')
      assert.isNotNull(updatedDesign!.generatedImageUrl)
    } else {
      assert.equal(response.status(), 500)
      assert.equal(response.body().error.code, 'GENERATION_FAILED')
      assert.equal(updatedDesign!.status, 'draft', 'Rollback status vers draft attendu')
    }
  })
})

test.group('GET /api/designs/:id/status', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const SESSION_TOKEN = 'c'.repeat(64)

  test('retourne 200 avec le statut du design', async ({ client, assert }) => {
    const design = await createConfiguredDesign(SESSION_TOKEN)

    const response = await client
      .get(`/api/designs/${design.id}/status`)
      .qs({ sessionToken: SESSION_TOKEN })

    response.assertStatus(200)
    const body = response.body()

    assert.isTrue(body.success)
    assert.equal(body.data.designId, design.id)
    assert.equal(body.data.status, 'draft')
    assert.equal(body.data.iterationsUsed, 0)
  })

  test('retourne le bon status après mise à jour', async ({ client, assert }) => {
    const design = await createConfiguredDesign(SESSION_TOKEN)
    await design.merge({ status: 'completed', iterationsUsed: 1 }).save()

    const response = await client
      .get(`/api/designs/${design.id}/status`)
      .qs({ sessionToken: SESSION_TOKEN })

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.data.status, 'completed')
    assert.equal(body.data.iterationsUsed, 1)
  })

  test('retourne 403 avec un sessionToken incorrect', async ({ client, assert }) => {
    const design = await createConfiguredDesign(SESSION_TOKEN)

    const response = await client
      .get(`/api/designs/${design.id}/status`)
      .qs({ sessionToken: 'd'.repeat(64) })

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('retourne 403 sans sessionToken pour un design anonyme', async ({ client, assert }) => {
    const design = await createConfiguredDesign(SESSION_TOKEN)

    const response = await client.get(`/api/designs/${design.id}/status`)

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('retourne 404 pour un design inexistant', async ({ client }) => {
    const response = await client
      .get('/api/designs/999999/status')
      .qs({ sessionToken: SESSION_TOKEN })

    response.assertStatus(404)
  })
})

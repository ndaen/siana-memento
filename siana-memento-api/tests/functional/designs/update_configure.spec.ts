import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Design from '#models/design'
import { loginAs, createDesignViaApi, VALID_CONFIG_PAYLOAD } from '#tests/helpers/index'

test.group('PATCH /api/designs/:id/configure', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('met à jour la configuration avec sessionToken valide (anonyme)', async ({
    client,
    assert,
  }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    const response = await client.patch(`/api/designs/${designId}/configure`).json({
      ...VALID_CONFIG_PAYLOAD,
      sessionToken,
    })

    response.assertStatus(200)
    const body = response.body()
    assert.isTrue(body.success)
    assert.equal(body.data.designId, designId)

    const design = await Design.find(designId)
    assert.equal(design!.partner1Name, 'Sophie')
    assert.equal(design!.partner2Name, 'Thomas')
    assert.equal(design!.weddingLocation, 'Château de Lastours')
    assert.isNotNull(design!.weddingDate)
  })

  test('retourne 422 si partner1Name est absent', async ({ client, assert }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    const response = await client.patch(`/api/designs/${designId}/configure`).json({
      partner2Name: 'Thomas',
      weddingDate: '2026-09-20',
      weddingLocation: 'Château de Lastours',
      sessionToken,
    })

    response.assertStatus(422)
    assert.isFalse(response.body().success ?? true)
  })

  test('retourne 422 si partner1Name est vide', async ({ client, assert }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    const response = await client.patch(`/api/designs/${designId}/configure`).json({
      ...VALID_CONFIG_PAYLOAD,
      partner1Name: '',
      sessionToken,
    })

    response.assertStatus(422)
    assert.isFalse(response.body().success ?? true)
  })

  test('retourne 422 si weddingDate a un format invalide', async ({ client, assert }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    const response = await client.patch(`/api/designs/${designId}/configure`).json({
      ...VALID_CONFIG_PAYLOAD,
      weddingDate: '20/09/2026',
      sessionToken,
    })

    response.assertStatus(422)
    assert.isFalse(response.body().success ?? true)
  })

  test('retourne 422 si weddingDate contient une date impossible (ex: mois 13)', async ({
    client,
    assert,
  }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    const response = await client.patch(`/api/designs/${designId}/configure`).json({
      ...VALID_CONFIG_PAYLOAD,
      weddingDate: '2026-13-40',
      sessionToken,
    })

    response.assertStatus(422)
    assert.isFalse(response.body().success ?? true)
  })

  test('retourne 422 si weddingLocation est absent', async ({ client, assert }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    const response = await client.patch(`/api/designs/${designId}/configure`).json({
      partner1Name: 'Sophie',
      partner2Name: 'Thomas',
      weddingDate: '2026-09-20',
      sessionToken,
    })

    response.assertStatus(422)
    assert.isFalse(response.body().success ?? true)
  })

  test('retourne 403 avec mauvais sessionToken', async ({ client, assert }) => {
    const { designId } = await createDesignViaApi(client)

    const response = await client.patch(`/api/designs/${designId}/configure`).json({
      ...VALID_CONFIG_PAYLOAD,
      sessionToken: 'a'.repeat(64),
    })

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('retourne 404 si design inexistant', async ({ client, assert }) => {
    const response = await client.patch('/api/designs/999999/configure').json({
      ...VALID_CONFIG_PAYLOAD,
      sessionToken: 'a'.repeat(64),
    })

    response.assertStatus(404)
    assert.equal(response.body().error.code, 'DESIGN_NOT_FOUND')
  })

  test('met à jour la configuration pour un utilisateur connecté possédant le design', async ({
    client,
    assert,
  }) => {
    const { cookie, user } = await loginAs(client, { email: 'sophie@example.com' })
    const { designId } = await createDesignViaApi(client, cookie)

    const response = await client
      .patch(`/api/designs/${designId}/configure`)
      .json(VALID_CONFIG_PAYLOAD)
      .header('Cookie', cookie)

    response.assertStatus(200)
    assert.isTrue(response.body().success)

    const design = await Design.find(designId)
    assert.equal(design!.userId, user.id)
    assert.equal(design!.partner1Name, 'Sophie')
    assert.equal(design!.partner2Name, 'Thomas')
  })

  test("retourne 403 pour un utilisateur connecté tentant de modifier le design d'un autre", async ({
    client,
    assert,
  }) => {
    const { cookie: ownerCookie } = await loginAs(client, { email: 'owner@example.com' })
    const { designId } = await createDesignViaApi(client, ownerCookie)

    const { cookie: attackerCookie } = await loginAs(client, { email: 'attacker@example.com' })

    const response = await client
      .patch(`/api/designs/${designId}/configure`)
      .json(VALID_CONFIG_PAYLOAD)
      .header('Cookie', attackerCookie)

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })
})

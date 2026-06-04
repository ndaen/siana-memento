import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { loginAs, createDesignViaApi } from '#tests/helpers/index'

test.group('GET /api/designs/:id/status', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('retourne 200 avec header X-Session-Token valide (AC1)', async ({ client, assert }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    const response = await client
      .get(`/api/designs/${designId}/status`)
      .header('X-Session-Token', sessionToken)

    response.assertStatus(200)
    const body = response.body()
    assert.isTrue(body.success)
    assert.equal(body.data.designId, designId)
    assert.equal(body.data.status, 'draft')
    assert.equal(body.data.iterationsUsed, 0)
  })

  test('retourne 403 avec header X-Session-Token invalide (AC2)', async ({ client, assert }) => {
    const { designId } = await createDesignViaApi(client)

    const response = await client
      .get(`/api/designs/${designId}/status`)
      .header('X-Session-Token', 'a'.repeat(64))

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('retourne 200 avec query param sessionToken valide (fallback rétro-compat, AC3)', async ({
    client,
    assert,
  }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    const response = await client.get(`/api/designs/${designId}/status`).qs({ sessionToken })

    response.assertStatus(200)
    const body = response.body()
    assert.isTrue(body.success)
    assert.equal(body.data.designId, designId)
  })

  test('header X-Session-Token a la priorité sur le query param', async ({ client, assert }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    const response = await client
      .get(`/api/designs/${designId}/status`)
      .header('X-Session-Token', sessionToken)
      .qs({ sessionToken: 'b'.repeat(64) })

    response.assertStatus(200)
    assert.equal(response.body().data.designId, designId)
  })

  test('retourne 403 sans aucun token (AC4)', async ({ client, assert }) => {
    const { designId } = await createDesignViaApi(client)

    const response = await client.get(`/api/designs/${designId}/status`)

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('retourne 200 pour utilisateur connecté propriétaire sans aucun token (AC5)', async ({
    client,
    assert,
  }) => {
    const { cookie } = await loginAs(client, { email: 'sophie@example.com' })
    const { designId } = await createDesignViaApi(client, cookie)

    const response = await client.get(`/api/designs/${designId}/status`).header('Cookie', cookie)

    response.assertStatus(200)
    assert.isTrue(response.body().success)
    assert.equal(response.body().data.designId, designId)
  })

  test('retourne 403 pour utilisateur connecté non propriétaire sans token', async ({
    client,
    assert,
  }) => {
    const { cookie: ownerCookie } = await loginAs(client, { email: 'owner@example.com' })
    const { designId } = await createDesignViaApi(client, ownerCookie)

    const { cookie: attackerCookie } = await loginAs(client, { email: 'attacker@example.com' })

    const response = await client
      .get(`/api/designs/${designId}/status`)
      .header('Cookie', attackerCookie)

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('retourne 403 pour user authentifié non-propriétaire même avec header X-Session-Token valide (F-R2)', async ({
    client,
    assert,
  }) => {
    const { cookie: ownerCookie } = await loginAs(client, { email: 'owner@example.com' })
    const { designId, sessionToken } = await createDesignViaApi(client, ownerCookie)

    const { cookie: attackerCookie } = await loginAs(client, { email: 'attacker@example.com' })

    const response = await client
      .get(`/api/designs/${designId}/status`)
      .header('Cookie', attackerCookie)
      .header('X-Session-Token', sessionToken)

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('header vide tombe en fallback query param (F-R1)', async ({ client, assert }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    const response = await client
      .get(`/api/designs/${designId}/status`)
      .header('X-Session-Token', '')
      .qs({ sessionToken })

    response.assertStatus(200)
    assert.equal(response.body().data.designId, designId)
  })

  test('retourne 404 pour design inexistant', async ({ client, assert }) => {
    const response = await client
      .get('/api/designs/999999/status')
      .header('X-Session-Token', 'a'.repeat(64))

    response.assertStatus(404)
    assert.equal(response.body().error.code, 'DESIGN_NOT_FOUND')
  })
})

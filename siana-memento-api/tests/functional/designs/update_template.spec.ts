import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Design from '#models/design'
import { loginAs, createDesignViaApi } from '#tests/helpers/index'

test.group('PATCH /api/designs/:id/template', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('met à jour le template avec sessionToken valide (anonyme)', async ({ client, assert }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    const response = await client.patch(`/api/designs/${designId}/template`).json({
      template: 'boheme',
      sessionToken,
    })

    response.assertStatus(200)
    const body = response.body()
    assert.isTrue(body.success)
    assert.equal(body.data.designId, designId)
    assert.equal(body.data.template, 'boheme')

    const design = await Design.find(designId)
    assert.equal(design!.template, 'boheme')
  })

  test('accepte les 5 templates valides', async ({ client, assert }) => {
    const templates = ['boheme', 'moderne', 'classique', 'vintage', 'minimaliste'] as const

    for (const template of templates) {
      const { designId, sessionToken } = await createDesignViaApi(client)

      const response = await client.patch(`/api/designs/${designId}/template`).json({
        template,
        sessionToken,
      })

      response.assertStatus(200)
      assert.equal(response.body().data.template, template)
    }
  })

  test('retourne 422 si template est invalide', async ({ client, assert }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    const response = await client.patch(`/api/designs/${designId}/template`).json({
      template: 'baroque',
      sessionToken,
    })

    response.assertStatus(422)
    assert.isFalse(response.body().success ?? true)
  })

  test('retourne 403 avec mauvais sessionToken', async ({ client, assert }) => {
    const { designId } = await createDesignViaApi(client)

    const response = await client.patch(`/api/designs/${designId}/template`).json({
      template: 'moderne',
      sessionToken: 'a'.repeat(64),
    })

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('retourne 403 sans sessionToken pour utilisateur anonyme', async ({ client, assert }) => {
    const { designId } = await createDesignViaApi(client)

    const response = await client.patch(`/api/designs/${designId}/template`).json({
      template: 'moderne',
    })

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('retourne 404 si design inexistant', async ({ client, assert }) => {
    const response = await client.patch('/api/designs/999999/template').json({
      template: 'classique',
      sessionToken: 'a'.repeat(64),
    })

    response.assertStatus(404)
    assert.equal(response.body().error.code, 'DESIGN_NOT_FOUND')
  })

  test('met à jour le template pour un utilisateur connecté possédant le design', async ({
    client,
    assert,
  }) => {
    const { cookie, user } = await loginAs(client, { email: 'sophie@example.com' })
    const { designId } = await createDesignViaApi(client, cookie)

    const response = await client
      .patch(`/api/designs/${designId}/template`)
      .json({ template: 'vintage' })
      .header('Cookie', cookie)

    response.assertStatus(200)
    assert.equal(response.body().data.template, 'vintage')

    const design = await Design.find(designId)
    assert.equal(design!.userId, user.id)
    assert.equal(design!.template, 'vintage')
  })

  test("retourne 403 pour un utilisateur connecté tentant de modifier le design d'un autre", async ({
    client,
    assert,
  }) => {
    const { cookie: ownerCookie } = await loginAs(client, { email: 'owner@example.com' })
    const { designId } = await createDesignViaApi(client, ownerCookie)

    const { cookie: attackerCookie } = await loginAs(client, { email: 'attacker@example.com' })

    const response = await client
      .patch(`/api/designs/${designId}/template`)
      .json({ template: 'minimaliste' })
      .header('Cookie', attackerCookie)

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('accepte une palette valide et la sauvegarde en DB', async ({ client, assert }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    const response = await client.patch(`/api/designs/${designId}/template`).json({
      template: 'boheme',
      palette: 'lavande-miel',
      sessionToken,
    })

    response.assertStatus(200)
    const body = response.body()
    assert.isTrue(body.success)
    assert.equal(body.data.template, 'boheme')
    assert.equal(body.data.palette, 'lavande-miel')

    const design = await Design.find(designId)
    assert.equal(design!.palette, 'lavande-miel')
  })

  test("retourne 422 si la palette n'appartient pas au template sélectionné", async ({
    client,
    assert,
  }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    const response = await client.patch(`/api/designs/${designId}/template`).json({
      template: 'moderne',
      palette: 'lavande-miel', // palette Bohème sur template Moderne
      sessionToken,
    })

    response.assertStatus(422)
    assert.isFalse(response.body().success ?? true)
  })

  test('accepte une requête sans palette et sauvegarde null (palette par défaut utilisée)', async ({
    client,
    assert,
  }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    const response = await client.patch(`/api/designs/${designId}/template`).json({
      template: 'classique',
      sessionToken,
    })

    response.assertStatus(200)
    assert.isNull(response.body().data.palette)

    const design = await Design.find(designId)
    assert.equal(design!.template, 'classique')
    assert.isNull(design!.palette)
  })

  test('un changement de template vers un autre avec sa propre palette fonctionne', async ({
    client,
    assert,
  }) => {
    const { designId, sessionToken } = await createDesignViaApi(client)

    // 1ère sélection : Bohème + Lavande & Miel
    await client.patch(`/api/designs/${designId}/template`).json({
      template: 'boheme',
      palette: 'lavande-miel',
      sessionToken,
    })

    let design = await Design.find(designId)
    assert.equal(design!.palette, 'lavande-miel')

    // 2ème sélection : Moderne + Noir & Or (palette propre à Moderne)
    const response = await client.patch(`/api/designs/${designId}/template`).json({
      template: 'moderne',
      palette: 'noir-or',
      sessionToken,
    })

    response.assertStatus(200)
    assert.equal(response.body().data.palette, 'noir-or')

    design = await Design.find(designId)
    assert.equal(design!.template, 'moderne')
    assert.equal(design!.palette, 'noir-or')
  })
})

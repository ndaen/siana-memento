import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Design from '#models/design'
import User from '#models/user'

test.group('PATCH /api/designs/:id/template', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const validPhoto = {
    publicId: 'designs/session123/photo1_abc',
    url: 'https://res.cloudinary.com/mycloud/image/upload/v1234/photo1.jpg',
  }

  async function createDesign(client: any) {
    const res = await client.post('/api/designs').json({ photos: [validPhoto] })
    res.assertStatus(201)
    return res.body().data as { designId: number; sessionToken: string }
  }

  test('met à jour le template avec sessionToken valide (anonyme)', async ({ client, assert }) => {
    const { designId, sessionToken } = await createDesign(client)

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
      const { designId, sessionToken } = await createDesign(client)

      const response = await client.patch(`/api/designs/${designId}/template`).json({
        template,
        sessionToken,
      })

      response.assertStatus(200)
      assert.equal(response.body().data.template, template)
    }
  })

  test('retourne 422 si template est invalide', async ({ client, assert }) => {
    const { designId, sessionToken } = await createDesign(client)

    const response = await client.patch(`/api/designs/${designId}/template`).json({
      template: 'baroque',
      sessionToken,
    })

    response.assertStatus(422)
    assert.isFalse(response.body().success ?? true)
  })

  test('retourne 403 avec mauvais sessionToken', async ({ client, assert }) => {
    const { designId } = await createDesign(client)

    const response = await client.patch(`/api/designs/${designId}/template`).json({
      template: 'moderne',
      sessionToken: 'a'.repeat(64),
    })

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('retourne 403 sans sessionToken pour utilisateur anonyme', async ({ client, assert }) => {
    const { designId } = await createDesign(client)

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

  test("met à jour le template pour un utilisateur connecté possédant le design", async ({
    client,
    assert,
  }) => {
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

    const rawCookies = loginResponse.headers()['set-cookie'] as unknown as string[] | undefined
    const cookieHeader = rawCookies?.map((c: string) => c.split(';')[0]).join('; ') ?? ''

    // Créer un design en tant qu'utilisateur connecté
    const createRes = await client
      .post('/api/designs')
      .json({ photos: [validPhoto] })
      .header('Cookie', cookieHeader)
    createRes.assertStatus(201)
    const { designId } = createRes.body().data

    const response = await client
      .patch(`/api/designs/${designId}/template`)
      .json({ template: 'vintage' })
      .header('Cookie', cookieHeader)

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
    // Créer propriétaire
    await User.create({
      email: 'owner@example.com',
      password: 'motdepasse123',
      provider: 'email',
    })
    const ownerLogin = await client
      .post('/auth/login')
      .json({ email: 'owner@example.com', password: 'motdepasse123' })
    const ownerCookies = (ownerLogin.headers()['set-cookie'] as unknown as string[] | undefined)
      ?.map((c: string) => c.split(';')[0])
      .join('; ') ?? ''

    const createRes = await client
      .post('/api/designs')
      .json({ photos: [validPhoto] })
      .header('Cookie', ownerCookies)
    const { designId } = createRes.body().data

    // Créer attaquant
    await User.create({
      email: 'attacker@example.com',
      password: 'motdepasse123',
      provider: 'email',
    })
    const attackerLogin = await client
      .post('/auth/login')
      .json({ email: 'attacker@example.com', password: 'motdepasse123' })
    const attackerCookies = (
      attackerLogin.headers()['set-cookie'] as unknown as string[] | undefined
    )
      ?.map((c: string) => c.split(';')[0])
      .join('; ') ?? ''

    const response = await client
      .patch(`/api/designs/${designId}/template`)
      .json({ template: 'minimaliste' })
      .header('Cookie', attackerCookies)

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })
})

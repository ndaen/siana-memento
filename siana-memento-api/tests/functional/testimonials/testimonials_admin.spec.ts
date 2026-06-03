import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { loginAs } from '#tests/helpers/auth'
import Testimonial from '#models/testimonial'

function adminTestimonials(client: any, cookie: string) {
  return client.get('/api/admin/testimonials').header('Cookie', cookie)
}

test.group('Testimonials — CRUD admin (Story 6.7)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // --- Sécurité (NFR-S10) ---

  test('returns 401 when not authenticated (admin list)', async ({ client }) => {
    const response = await client.get('/api/admin/testimonials')
    response.assertStatus(401)
  })

  test('returns 403 for a non-admin on POST (NFR-S10)', async ({ client, assert }) => {
    const { cookie } = await loginAs(client, { isAdmin: false })
    const response = await client
      .post('/api/admin/testimonials')
      .header('Cookie', cookie)
      .json({ authorName: 'Léa', content: 'Super service !' })

    response.assertStatus(403)
    assert.isFalse(response.body().success)
  })

  test('returns 401 for an anonymous user on DELETE', async ({ client }) => {
    const response = await client.delete('/api/admin/testimonials/1')
    response.assertStatus(401)
  })

  // --- AC#1 : création ---

  test('AC#1 — admin creates a testimonial (active by default)', async ({ client, assert }) => {
    const { cookie } = await loginAs(client, { isAdmin: true })
    const response = await client
      .post('/api/admin/testimonials')
      .header('Cookie', cookie)
      .json({ authorName: 'Claire & Maxime', content: 'Résultat bluffant en 10 minutes.' })

    response.assertStatus(201)
    const { data } = response.body()
    assert.equal(data.authorName, 'Claire & Maxime')
    assert.isTrue(data.isActive)

    const row = await Testimonial.find(data.id)
    assert.exists(row)
    assert.isTrue(row!.isActive)
  })

  test('AC#1 — empty author/content is rejected (422)', async ({ client }) => {
    const { cookie } = await loginAs(client, { isAdmin: true })

    const r1 = await client
      .post('/api/admin/testimonials')
      .header('Cookie', cookie)
      .json({ authorName: '', content: 'texte' })
    r1.assertStatus(422)

    const r2 = await client
      .post('/api/admin/testimonials')
      .header('Cookie', cookie)
      .json({ authorName: 'Léa', content: '' })
    r2.assertStatus(422)
  })

  // --- AC#2 : toggle + impact public ---

  test('AC#2 — PATCH isActive=false hides it from the public endpoint', async ({
    client,
    assert,
  }) => {
    const { cookie } = await loginAs(client, { isAdmin: true })
    const created = await Testimonial.create({
      authorName: 'Manon & Romain',
      content: 'Élégant et fidèle à nos photos.',
      isActive: true,
      displayOrder: 0,
    })

    const patch = await client
      .patch(`/api/admin/testimonials/${created.id}`)
      .header('Cookie', cookie)
      .json({ isActive: false })
    patch.assertStatus(200)
    assert.isFalse(patch.body().data.isActive)

    const publicRes = await client.get('/api/testimonials')
    publicRes.assertStatus(200)
    const ids = (publicRes.body().data as any[]).map((t) => t.id)
    assert.notInclude(ids, created.id)
  })

  // --- AC#3 : endpoint public ---

  test('AC#3 — public endpoint returns only active testimonials, no auth, public fields only', async ({
    client,
    assert,
  }) => {
    const activeOne = await Testimonial.create({
      authorName: 'Julie & Alexandre',
      content: 'Simple, rapide et magnifique.',
      isActive: true,
      displayOrder: 1,
    })
    const inactiveOne = await Testimonial.create({
      authorName: 'Inactif',
      content: 'Ne doit pas apparaître.',
      isActive: false,
      displayOrder: 2,
    })

    const response = await client.get('/api/testimonials')
    response.assertStatus(200)
    const data = response.body().data as any[]
    const ids = data.map((t) => t.id)

    assert.include(ids, activeOne.id)
    assert.notInclude(ids, inactiveOne.id)

    const item = data.find((t) => t.id === activeOne.id)
    assert.properties(item, ['id', 'authorName', 'content'])
    assert.notProperty(item, 'isActive')
    assert.notProperty(item, 'createdAt')
    assert.notProperty(item, 'updatedAt')
  })

  test('AC#3 — public endpoint orders by display_order then created_at', async ({
    client,
    assert,
  }) => {
    const second = await Testimonial.create({
      authorName: 'Second',
      content: 'b',
      isActive: true,
      displayOrder: 200000,
    })
    const first = await Testimonial.create({
      authorName: 'First',
      content: 'a',
      isActive: true,
      displayOrder: 100000,
    })

    const response = await client.get('/api/testimonials')
    response.assertStatus(200)
    const data = response.body().data as any[]
    const idxFirst = data.findIndex((t) => t.id === first.id)
    const idxSecond = data.findIndex((t) => t.id === second.id)
    assert.isBelow(idxFirst, idxSecond)
  })

  // --- AC#4 : hard delete ---

  test('AC#4 — DELETE removes the row from the database (hard delete)', async ({
    client,
    assert,
  }) => {
    const { cookie } = await loginAs(client, { isAdmin: true })
    const created = await Testimonial.create({
      authorName: 'À supprimer',
      content: 'temporaire',
      isActive: true,
      displayOrder: 0,
    })

    const response = await client
      .delete(`/api/admin/testimonials/${created.id}`)
      .header('Cookie', cookie)
    response.assertStatus(200)
    assert.isTrue(response.body().success)

    const row = await Testimonial.find(created.id)
    assert.isNull(row)
  })

  test('PATCH/DELETE on a missing testimonial returns 404', async ({ client, assert }) => {
    const { cookie } = await loginAs(client, { isAdmin: true })

    const patch = await client
      .patch('/api/admin/testimonials/999999999')
      .header('Cookie', cookie)
      .json({ isActive: false })
    patch.assertStatus(404)
    assert.isFalse(patch.body().success)

    const del = await client
      .delete('/api/admin/testimonials/999999999')
      .header('Cookie', cookie)
    del.assertStatus(404)
  })

  // --- index admin retourne actifs + inactifs ---

  test('admin index returns both active and inactive testimonials', async ({ client, assert }) => {
    const { cookie } = await loginAs(client, { isAdmin: true })
    const active = await Testimonial.create({
      authorName: 'Actif index',
      content: 'a',
      isActive: true,
      displayOrder: 0,
    })
    const inactive = await Testimonial.create({
      authorName: 'Inactif index',
      content: 'b',
      isActive: false,
      displayOrder: 0,
    })

    const response = await adminTestimonials(client, cookie)
    response.assertStatus(200)
    const ids = (response.body().data as any[]).map((t) => t.id)
    assert.include(ids, active.id)
    assert.include(ids, inactive.id)
  })
})

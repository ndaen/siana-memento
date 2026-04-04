import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { loginAs, createPaidOrderWithDesign } from './_helpers.js'

test.group('GET /api/orders/:id/download — design re-download', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 200 with downloadUrl for paid order within 7 days', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const { order } = await createPaidOrderWithDesign(user.id)

    const response = await client.get(`/api/orders/${order.id}/download`).header('cookie', cookie)

    response.assertStatus(200)
    const body = response.body()
    assert.isTrue(body.success)
    assert.exists(body.data.downloadUrl)
    assert.include(body.data.downloadUrl, 'cloudinary')
    assert.include(body.data.downloadUrl, 'designs/design-1')
  })

  test('returns 410 Gone for order paid more than 7 days ago', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const { order } = await createPaidOrderWithDesign(user.id, {
      paidAt: DateTime.now().minus({ days: 8 }),
    })

    const response = await client.get(`/api/orders/${order.id}/download`).header('cookie', cookie)

    response.assertStatus(410)
    const body = response.body()
    assert.isFalse(body.success)
    assert.equal(body.error.code, 'DOWNLOAD_EXPIRED')
  })

  test('returns 403 for order owned by another user', async ({ client, assert }) => {
    const { user: owner } = await loginAs(client, `owner-${Date.now()}@example.com`)
    const { order } = await createPaidOrderWithDesign(owner.id)

    const { cookie } = await loginAs(client, `other-${Date.now()}@example.com`)

    const response = await client.get(`/api/orders/${order.id}/download`).header('cookie', cookie)

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'FORBIDDEN')
  })

  test('returns 401 without authentication', async ({ client }) => {
    const response = await client.get('/api/orders/1/download')
    response.assertStatus(401)
  })

  test('returns 400 for unpaid order (pending)', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const { order } = await createPaidOrderWithDesign(user.id, { status: 'pending' })

    const response = await client.get(`/api/orders/${order.id}/download`).header('cookie', cookie)

    response.assertStatus(400)
    assert.equal(response.body().error.code, 'ORDER_NOT_PAID')
  })

  test('returns 404 for non-existent order', async ({ client, assert }) => {
    const { cookie } = await loginAs(client)

    const response = await client.get('/api/orders/99999/download').header('cookie', cookie)

    response.assertStatus(404)
    assert.equal(response.body().error.code, 'ORDER_NOT_FOUND')
  })

  test('returns 422 when design has no cloudinaryPublicId', async ({ client, assert }) => {
    const { cookie, user } = await loginAs(client)
    const { order } = await createPaidOrderWithDesign(user.id, { cloudinaryPublicId: null })

    const response = await client.get(`/api/orders/${order.id}/download`).header('cookie', cookie)

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'DESIGN_FILE_MISSING')
  })
})

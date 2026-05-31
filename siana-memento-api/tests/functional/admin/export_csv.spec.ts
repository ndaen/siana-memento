import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { loginAs } from '#tests/helpers/auth'
import { createPaidOrderWithDesign } from '#tests/helpers/factories'

test.group('GET /api/admin/metrics/export-csv', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/admin/metrics/export-csv')
    response.assertStatus(401)
  })

  test('returns 403 for a non-admin user', async ({ client }) => {
    const { cookie } = await loginAs(client, { isAdmin: false })
    const response = await client.get('/api/admin/metrics/export-csv').header('Cookie', cookie)
    response.assertStatus(403)
  })

  test('returns a CSV attachment with the expected header row for an admin', async ({
    client,
    assert,
  }) => {
    const { cookie, user } = await loginAs(client, { isAdmin: true })
    await createPaidOrderWithDesign(user.id)

    const response = await client.get('/api/admin/metrics/export-csv').header('Cookie', cookie)

    response.assertStatus(200)
    assert.include(response.header('content-type'), 'text/csv')
    assert.include(response.header('content-disposition'), 'attachment')
    assert.include(response.header('content-disposition'), '.csv')

    const text = response.text()
    // BOM UTF-8 + ligne d'en-tête exacte (colonnes AC3)
    assert.include(text, 'Date')
    assert.include(text, 'Montant (€)')
    assert.include(text, 'Statut')
    assert.include(text, 'Coût API (€)')
    assert.include(text, 'Marge (€)')
    // La commande payée (19,90€) figure dans le corps
    assert.include(text, '19.90')
  })
})

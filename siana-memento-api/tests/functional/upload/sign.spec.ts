import { test } from '@japa/runner'

test.group('POST /api/upload/sign', () => {
  test('retourne 200 avec les champs de signature Cloudinary', async ({ client, assert }) => {
    const response = await client.post('/api/upload/sign')

    response.assertStatus(200)
    const body = response.body()

    assert.isTrue(body.success)
    assert.exists(body.data.signature)
    assert.isNumber(body.data.timestamp)
    assert.isString(body.data.cloudName)
    assert.isString(body.data.apiKey)
    assert.isString(body.data.folder)
    assert.isString(body.data.tags)
    assert.match(body.data.tags, /^expires_\d+$/)
  })

  test('inclut session_token dans le folder quand fourni', async ({ client, assert }) => {
    const response = await client.post('/api/upload/sign?session_token=abc123')

    response.assertStatus(200)
    const body = response.body()

    assert.isTrue(body.success)
    assert.include(body.data.folder, 'abc123')
  })

  test('assainit le session_token pour éviter le Path Traversal', async ({ client, assert }) => {
    const response = await client.post('/api/upload/sign?session_token=../../../etc/passwd')

    response.assertStatus(200)
    const body = response.body()

    assert.isTrue(body.success)
    // Le token assaini ne doit pas contenir de séquences de traversal
    // `../../../etc/passwd` → `etcpasswd` (seuls alphanum conservés)
    assert.equal(body.data.folder, 'designs/etcpasswd')
  })

  test('retourne 200 sans session_token (folder par défaut "designs/anonymous")', async ({
    client,
    assert,
  }) => {
    const response = await client.post('/api/upload/sign')

    response.assertStatus(200)
    const body = response.body()

    assert.isTrue(body.success)
    assert.include(body.data.folder, 'designs/')
  })

  test('est accessible sans authentification', async ({ client }) => {
    // Aucun cookie de session — doit quand même retourner 200
    const response = await client.post('/api/upload/sign')
    response.assertStatus(200)
  })
})

import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('POST /auth/login', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 200 and session cookie on valid credentials', async ({ client, assert }) => {
    await User.create({
      email: 'sophie@example.com',
      password: 'motdepasse123',
      provider: 'email',
    })

    const response = await client.post('/auth/login').json({
      email: 'sophie@example.com',
      password: 'motdepasse123',
    })

    response.assertStatus(200)
    response.assertCookie('adonis-session')
    const body = response.body()
    assert.isTrue(body.success)
    assert.equal(body.data.user.email, 'sophie@example.com')
    assert.exists(body.data.user.id)
  })

  test('does not expose password in response', async ({ client, assert }) => {
    await User.create({
      email: 'secure@example.com',
      password: 'motdepasse123',
      provider: 'email',
    })

    const response = await client.post('/auth/login').json({
      email: 'secure@example.com',
      password: 'motdepasse123',
    })

    response.assertStatus(200)
    const body = response.body()
    assert.notProperty(body.data.user, 'password')
  })

  test('returns 401 INVALID_CREDENTIALS for unknown email', async ({ client, assert }) => {
    const response = await client.post('/auth/login').json({
      email: 'inconnu@example.com',
      password: 'motdepasse123',
    })

    response.assertStatus(401)
    const body = response.body()
    assert.isFalse(body.success)
    assert.equal(body.error.code, 'INVALID_CREDENTIALS')
    assert.equal(body.error.message, 'Email ou mot de passe incorrect')
  })

  test('returns 401 INVALID_CREDENTIALS for wrong password', async ({ client, assert }) => {
    await User.create({
      email: 'test@example.com',
      password: 'motdepasse123',
      provider: 'email',
    })

    const response = await client.post('/auth/login').json({
      email: 'test@example.com',
      password: 'mauvais-motdepasse',
    })

    response.assertStatus(401)
    const body = response.body()
    assert.isFalse(body.success)
    assert.equal(body.error.code, 'INVALID_CREDENTIALS')
    assert.equal(body.error.message, 'Email ou mot de passe incorrect')
  })

  test('returns same error for wrong email and wrong password (anti-enumeration)', async ({
    client,
    assert,
  }) => {
    await User.create({
      email: 'existing@example.com',
      password: 'motdepasse123',
      provider: 'email',
    })

    const wrongEmailResponse = await client.post('/auth/login').json({
      email: 'nope@example.com',
      password: 'motdepasse123',
    })

    const wrongPasswordResponse = await client.post('/auth/login').json({
      email: 'existing@example.com',
      password: 'wrongpass',
    })

    wrongEmailResponse.assertStatus(401)
    wrongPasswordResponse.assertStatus(401)
    assert.equal(
      wrongEmailResponse.body().error.message,
      wrongPasswordResponse.body().error.message
    )
  })

  test('returns 422 VALIDATION_FAILED for invalid email format', async ({ client, assert }) => {
    const response = await client.post('/auth/login').json({
      email: 'pas-un-email',
      password: 'motdepasse123',
    })

    response.assertStatus(422)
    const body = response.body()
    assert.isFalse(body.success)
    assert.equal(body.error.code, 'VALIDATION_FAILED')
  })

  test('returns 422 VALIDATION_FAILED when password is missing', async ({ client, assert }) => {
    const response = await client.post('/auth/login').json({
      email: 'test@example.com',
    })

    response.assertStatus(422)
    const body = response.body()
    assert.isFalse(body.success)
    assert.equal(body.error.code, 'VALIDATION_FAILED')
  })

  test('enforces rate limit of 10 requests per 15 minutes', async ({ client, assert }) => {
    // 10 allowed requests in parallel
    await Promise.all(
      Array.from({ length: 10 }).map((_, i) =>
        client.post('/auth/login').json({
          email: `rate${i}@example.com`,
          password: 'motdepasse123',
        })
      )
    )

    // 11th request should be rate-limited
    const response = await client.post('/auth/login').json({
      email: 'blocked@example.com',
      password: 'motdepasse123',
    })

    response.assertStatus(429)
    const body = response.body()
    assert.isFalse(body.success)
    assert.equal(body.error.code, 'RATE_LIMIT_EXCEEDED')
  })
})

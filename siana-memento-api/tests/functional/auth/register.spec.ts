import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('POST /auth/register', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates account and returns 201 with user data', async ({ client, assert }) => {
    const response = await client.post('/auth/register').json({
      email: 'sophie@example.com',
      password: 'motdepasse123',
      fullName: 'Sophie Thomas',
    })

    response.assertStatus(201)
    response.assertCookie('adonis-session')
    const body = response.body()
    assert.isTrue(body.success)
    assert.equal(body.data.user.email, 'sophie@example.com')
    assert.equal(body.data.user.fullName, 'Sophie Thomas')
    assert.exists(body.data.user.id)
  })

  test('hashes the password (not stored in plain text)', async ({ client, assert }) => {
    await client.post('/auth/register').json({
      email: 'hash@example.com',
      password: 'motdepasse123',
    })

    const user = await User.findByOrFail('email', 'hash@example.com')
    assert.isNotNull(user.password)
    assert.notEqual(user.password, 'motdepasse123')
  })

  test('sets provider to email on creation', async ({ client, assert }) => {
    await client.post('/auth/register').json({
      email: 'provider@example.com',
      password: 'motdepasse123',
    })

    const user = await User.findByOrFail('email', 'provider@example.com')
    assert.equal(user.provider, 'email')
  })

  test('returns 422 DUPLICATE_EMAIL when email already exists', async ({ client, assert }) => {
    await User.create({
      email: 'doublon@example.com',
      password: 'quelconque123',
      provider: 'email',
    })

    const response = await client.post('/auth/register').json({
      email: 'doublon@example.com',
      password: 'autremotdepasse',
    })

    response.assertStatus(422)
    const body = response.body()
    assert.isFalse(body.success)
    assert.equal(body.error.code, 'DUPLICATE_EMAIL')
    assert.include(body.error.message, 'existe déjà')
  })

  test('returns 422 for invalid email format', async ({ client, assert }) => {
    const response = await client.post('/auth/register').json({
      email: 'pas-un-email',
      password: 'motdepasse123',
    })

    response.assertStatus(422)
    const body = response.body()
    assert.isFalse(body.success)
  })

  test('returns 422 for password shorter than 8 characters', async ({ client, assert }) => {
    const response = await client.post('/auth/register').json({
      email: 'test@example.com',
      password: 'court',
    })

    response.assertStatus(422)
    const body = response.body()
    assert.isFalse(body.success)
  })

  test('accepts registration without fullName', async ({ client, assert }) => {
    const response = await client.post('/auth/register').json({
      email: 'sansprenom@example.com',
      password: 'motdepasse123',
    })

    response.assertStatus(201)
    const body = response.body()
    assert.isTrue(body.success)
    assert.isNull(body.data.user.fullName)
  })

  test('enforces rate limit of 3 requests per hour', async ({ client, assert }) => {
    // 3 allowed requests
    for (let i = 0; i < 3; i++) {
      await client.post('/auth/register').json({
        email: `rate${i}@example.com`,
        password: 'motdepasse123',
      })
    }

    // 4th request should fail
    const response = await client.post('/auth/register').json({
      email: 'blocked@example.com',
      password: 'motdepasse123',
    })

    response.assertStatus(429)
    const body = response.body()
    assert.isFalse(body.success)
    assert.equal(body.error.code, 'RATE_LIMIT_EXCEEDED')
  })
})

import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import AuthService from '#services/auth_service'
import { extractCookie } from '#tests/helpers/index'

test.group('Google OAuth', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // ─── GET /auth/google ───────────────────────────────────────────────────────

  test('GET /auth/google redirects to Google consent screen', async ({ client, assert }) => {
    const response = await client.get('/auth/google').redirects(0)
    response.assertStatus(302)
    const location = response.header('location') ?? ''
    assert.include(location, 'accounts.google.com')
  })

  test('GET /auth/google?returnTo=/reveal/abc123 still redirects to Google', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/auth/google?returnTo=/reveal/abc123').redirects(0)
    response.assertStatus(302)
    const location = response.header('location') ?? ''
    assert.include(location, 'accounts.google.com')
  })

  test('GET /auth/google?returnTo=http://evil.com ignores malicious returnTo', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/auth/google?returnTo=http://evil.com').redirects(0)
    response.assertStatus(302)
    const location = response.header('location') ?? ''
    assert.include(location, 'accounts.google.com')
  })

  test('returnTo stored in session does not affect callback error path', async ({
    client,
    assert,
  }) => {
    const oauthResponse = await client.get('/auth/google?returnTo=/reveal/abc123').redirects(0)
    oauthResponse.assertStatus(302)

    const sessionCookieRaw = oauthResponse.header('set-cookie') as unknown as
      | string[]
      | string
      | undefined
    const sessionCookieHeader = Array.isArray(sessionCookieRaw)
      ? (sessionCookieRaw.find((c) => c.startsWith('adonis-session'))?.split(';')[0] ?? '')
      : ''

    const callbackResponse = await client
      .get('/auth/google/callback?error=access_denied')
      .header('Cookie', sessionCookieHeader)
      .redirects(0)

    callbackResponse.assertStatus(302)
    const location = callbackResponse.header('location') ?? ''
    assert.include(location, 'oauth=denied')
  })

  // ─── GET /auth/google/callback (error cases — testables sans Google) ───────

  test('callback with access_denied redirects to /login?oauth=denied', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/auth/google/callback?error=access_denied').redirects(0)
    response.assertStatus(302)
    const location = response.header('location') ?? ''
    assert.include(location, 'oauth=denied')
  })

  test('callback with generic error redirects to /login?oauth=error', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/auth/google/callback?error=server_error').redirects(0)
    response.assertStatus(302)
    const location = response.header('location') ?? ''
    assert.include(location, 'oauth=error')
  })

  // ─── GET /auth/me ──────────────────────────────────────────────────────────

  test('GET /auth/me returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/auth/me')
    response.assertStatus(401)
  })

  test('GET /auth/me returns user data when authenticated', async ({ client, assert }) => {
    await User.create({
      email: 'oauth-me@example.com',
      password: 'motdepasse123',
      provider: 'email',
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'oauth-me@example.com',
      password: 'motdepasse123',
    })
    loginResponse.assertStatus(200)

    const cookieHeader = await extractCookie(loginResponse)

    const meResponse = await client.get('/auth/me').header('Cookie', cookieHeader)
    meResponse.assertStatus(200)

    const body = meResponse.body()
    assert.isTrue(body.success)
    assert.equal(body.data.user.email, 'oauth-me@example.com')
    assert.exists(body.data.user.id)
    assert.notProperty(body.data.user, 'password')
  })

  // ─── AuthService.findOrCreateOAuthUser ────────────────────────────────────

  test('findOrCreateOAuthUser creates a new user when email is unknown', async ({ assert }) => {
    const service = new AuthService()

    const user = await service.findOrCreateOAuthUser({
      email: 'newgoogle@example.com',
      fullName: 'Sophie Google',
      providerId: 'google-id-123',
    })

    assert.equal(user.email, 'newgoogle@example.com')
    assert.equal(user.fullName, 'Sophie Google')
    assert.equal(user.provider, 'google')
    assert.equal(user.providerId, 'google-id-123')
    assert.isNull(user.password)

    const count = await User.query().where('email', 'newgoogle@example.com').count('* as total')
    assert.equal(Number(count[0].$extras.total), 1)
  })

  test('findOrCreateOAuthUser returns existing user without creating a duplicate', async ({
    assert,
  }) => {
    const service = new AuthService()

    const existing = await User.create({
      email: 'existing-oauth@example.com',
      password: 'motdepasse123',
      provider: 'email',
    })

    const user = await service.findOrCreateOAuthUser({
      email: 'existing-oauth@example.com',
      fullName: 'Existing User',
      providerId: 'google-id-456',
    })

    assert.equal(user.id, existing.id)

    const count = await User.query()
      .where('email', 'existing-oauth@example.com')
      .count('* as total')
    assert.equal(Number(count[0].$extras.total), 1)
  })
})

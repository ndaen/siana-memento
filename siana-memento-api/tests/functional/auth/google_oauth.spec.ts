import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import AuthService from '#services/auth_service'

test.group('Google OAuth', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // ─── GET /auth/google ───────────────────────────────────────────────────────

  test('GET /auth/google redirects to Google consent screen', async ({ client }) => {
    // .redirects(0) : ne pas suivre la redirection — on vérifie le 302 directement
    const response = await client.get('/auth/google').redirects(0)
    response.assertStatus(302)
    const location = response.header('location') ?? ''
    assert_contains(location, 'accounts.google.com')
  })

  test('GET /auth/google?returnTo=/reveal/abc123 still redirects to Google', async ({ client }) => {
    const response = await client.get('/auth/google?returnTo=/reveal/abc123').redirects(0)
    response.assertStatus(302)
    const location = response.header('location') ?? ''
    assert_contains(location, 'accounts.google.com')
  })

  test('GET /auth/google?returnTo=http://evil.com ignores malicious returnTo', async ({
    client,
  }) => {
    // returnTo ne commençant pas par '/' doit être ignoré (sécurité open redirect)
    // Le comportement observable : la route redirige toujours vers Google (pas d'erreur)
    const response = await client.get('/auth/google?returnTo=http://evil.com').redirects(0)
    response.assertStatus(302)
    const location = response.header('location') ?? ''
    assert_contains(location, 'accounts.google.com')
  })

  test('returnTo stored in session does not affect callback error path', async ({ client }) => {
    // AC#4 — test indirecte : vérifie que oauth_return_to en session ne perturbe pas
    // le path d'erreur du callback (session cross-request fonctionne correctement)
    // Note : tester le redirect success path vers returnTo nécessite un mock Ally
    // non disponible dans cette stack (pas de sinon) — ce test couvre la robustesse du mécanisme.

    // Étape 1 : stocker returnTo en session via /auth/google
    const oauthResponse = await client.get('/auth/google?returnTo=/reveal/abc123').redirects(0)
    oauthResponse.assertStatus(302)

    // Étape 2 : récupérer le cookie de session posé par /auth/google
    const sessionCookieRaw = oauthResponse.header('set-cookie') as unknown as
      | string[]
      | string
      | undefined
    const sessionCookieHeader = Array.isArray(sessionCookieRaw)
      ? (sessionCookieRaw.find((c) => c.startsWith('adonis-session'))?.split(';')[0] ?? '')
      : ''

    // Étape 3 : appeler le callback avec une erreur en réutilisant le cookie de session
    const callbackResponse = await client
      .get('/auth/google/callback?error=access_denied')
      .header('Cookie', sessionCookieHeader)
      .redirects(0)

    callbackResponse.assertStatus(302)
    const location = callbackResponse.header('location') ?? ''
    // Le path d'erreur doit rediriger vers oauth=denied, jamais vers returnTo
    assert_contains(location, 'oauth=denied')
  })

  // ─── GET /auth/google/callback (error cases — testables sans Google) ───────

  test('callback with access_denied redirects to /login?oauth=denied', async ({ client }) => {
    const response = await client.get('/auth/google/callback?error=access_denied').redirects(0)
    response.assertStatus(302)
    const location = response.header('location') ?? ''
    assert_contains(location, 'oauth=denied')
  })

  test('callback with generic error redirects to /login?oauth=error', async ({ client }) => {
    const response = await client.get('/auth/google/callback?error=server_error').redirects(0)
    response.assertStatus(302)
    const location = response.header('location') ?? ''
    assert_contains(location, 'oauth=error')
  })

  // ─── GET /auth/me ──────────────────────────────────────────────────────────

  test('GET /auth/me returns 401 when not authenticated', async ({ client }) => {
    // AdonisJS retourne {"errors":[{"message":"Unauthorized access"}]} pour les 401 non gérés
    const response = await client.get('/auth/me')
    response.assertStatus(401)
  })

  test('GET /auth/me returns user data when authenticated', async ({ client, assert }) => {
    // Étape 1 : créer un user et se connecter pour obtenir le cookie de session
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

    // Étape 2 : extraire les cookies de la réponse login et les passer à /auth/me
    const rawCookies = loginResponse.headers()['set-cookie'] as unknown as string[] | undefined
    const cookieHeader = rawCookies?.map((c: string) => c.split(';')[0]).join('; ') ?? ''

    // Étape 3 : appeler /auth/me avec le cookie de session
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

    // Vérifier qu'un seul user existe en base
    const count = await User.query().where('email', 'newgoogle@example.com').count('* as total')
    assert.equal(Number(count[0].$extras.total), 1)
  })

  test('findOrCreateOAuthUser returns existing user without creating a duplicate', async ({
    assert,
  }) => {
    const service = new AuthService()

    // Utilisateur déjà en base (inscrit via email/password)
    const existing = await User.create({
      email: 'existing-oauth@example.com',
      password: 'motdepasse123',
      provider: 'email',
    })

    // OAuth avec le même email → doit retourner le user existant (pas de doublon)
    const user = await service.findOrCreateOAuthUser({
      email: 'existing-oauth@example.com',
      fullName: 'Existing User',
      providerId: 'google-id-456',
    })

    assert.equal(user.id, existing.id)

    // Vérifier : toujours 1 seul user en base
    const count = await User.query()
      .where('email', 'existing-oauth@example.com')
      .count('* as total')
    assert.equal(Number(count[0].$extras.total), 1)
  })
})

// Helper inline pour les assertions sur les chaînes
function assert_contains(haystack: string | undefined, needle: string) {
  if (!haystack?.includes(needle)) {
    throw new Error(`Expected "${haystack}" to contain "${needle}"`)
  }
}

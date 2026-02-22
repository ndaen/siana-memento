import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('POST /auth/logout', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 200 and clears session cookie when authenticated', async ({ client, assert }) => {
    await User.create({
      email: 'sophie@example.com',
      password: 'motdepasse123',
      provider: 'email',
    })

    // Créer une session via login
    const loginResponse = await client.post('/auth/login').json({
      email: 'sophie@example.com',
      password: 'motdepasse123',
    })
    loginResponse.assertStatus(200)
    loginResponse.assertCookie('adonis-session')

    // Récupérer le cookie de session
    const setCookieHeader = loginResponse.header('set-cookie') as unknown as string[]
    const sessionCookie =
      setCookieHeader.find((c: string) => c.startsWith('adonis-session'))?.split(';')[0] ?? ''

    // Déconnexion
    const logoutResponse = await client.post('/auth/logout').header('Cookie', sessionCookie)
    logoutResponse.assertStatus(200)
    const body = logoutResponse.body()
    // Note : avec le driver cookie AdonisJS, logout() réinitialise la session
    // (nouveau cookie vide envoyé) plutôt que d'envoyer Max-Age=0 explicitement.
    // L'invalidation réelle est vérifiée dans le test "authenticated request fails after logout"
    assert.isTrue(body.success)
  })

  test('returns 200 even when called without active session (idempotent)', async ({
    client,
    assert,
  }) => {
    const response = await client.post('/auth/logout')
    response.assertStatus(200)
    const body = response.body()
    assert.isTrue(body.success)
  })

  test('authenticated request fails after logout', async ({ client }) => {
    await User.create({
      email: 'thomas@example.com',
      password: 'motdepasse123',
      provider: 'email',
    })

    // Login
    const loginResponse = await client.post('/auth/login').json({
      email: 'thomas@example.com',
      password: 'motdepasse123',
    })
    loginResponse.assertStatus(200)
    const setCookieHeader = loginResponse.header('set-cookie') as unknown as string[]
    const sessionCookie =
      setCookieHeader.find((c: string) => c.startsWith('adonis-session'))?.split(';')[0] ?? ''

    // Logout
    await client.post('/auth/logout').header('Cookie', sessionCookie)

    // Tenter d'accéder à /auth/me avec l'ancien cookie — doit échouer
    const meResponse = await client.get('/auth/me').header('Cookie', sessionCookie)
    meResponse.assertStatus(401)
  })
})

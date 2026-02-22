/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import limiter from '@adonisjs/limiter/services/main'

const AuthController = () => import('#controllers/auth_controller')

const registerThrottle = limiter.define('register', () =>
  limiter.allowRequests(3).every('1 hour')
)

const loginThrottle = limiter.define('login', () =>
  limiter.allowRequests(10).every('15 minutes')
)

router.get('/api/health', async ({ response }) => {
  return response.ok({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

router
  .group(() => {
    router
      .post('/register', [AuthController, 'register'])
      .use([registerThrottle, middleware.guest()])

    router
      .post('/login', [AuthController, 'login'])
      .use(loginThrottle)

    router.get('/google', [AuthController, 'redirectToGoogle'])
    router.get('/google/callback', [AuthController, 'googleCallback'])

    router.get('/me', [AuthController, 'me']).use(middleware.auth())

    router.post('/logout', [AuthController, 'logout'])
  })
  .prefix('/auth')

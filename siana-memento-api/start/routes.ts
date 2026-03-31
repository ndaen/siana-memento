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
const UploadController = () => import('#controllers/upload_controller')
const DesignsController = () => import('#controllers/designs_controller')

const registerThrottle = limiter.define('register', () =>
  limiter.allowRequests(3).every('1 hour')
)

const loginThrottle = limiter.define('login', () =>
  limiter.allowRequests(10).every('15 minutes')
)

const designsThrottle = limiter.define('designs', () =>
  limiter.allowRequests(20).every('1 hour')
)

// Rate limit strict pour les générations IA — coût Gemini par requête
const generationsThrottle = limiter.define('generations', () =>
  limiter.allowRequests(5).every('1 minute')
)

router.get('/api/health', async ({ response }) => {
  return response.ok({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

// API routes — upload et designs
router.get('/api/upload/sign', [UploadController, 'sign'])
// silentAuth : populer auth.user si connecté, sans bloquer si anonyme
router
  .post('/api/designs', [DesignsController, 'store'])
  .use([designsThrottle, middleware.silentAuth()])
router
  .patch('/api/designs/:id/template', [DesignsController, 'updateTemplate'])
  .use([designsThrottle, middleware.silentAuth()])
router
  .patch('/api/designs/:id/configure', [DesignsController, 'updateConfigure'])
  .use([designsThrottle, middleware.silentAuth()])

// Génération IA — auth obligatoire + throttle strict (5/min) pour limiter les coûts API Gemini
router
  .post('/api/designs/:id/generate', [DesignsController, 'generate'])
  .use([generationsThrottle, middleware.auth()])

// Polling statut — sans throttle strict (légère, retourne juste un statut)
router
  .get('/api/designs/:id/status', [DesignsController, 'status'])
  .use(middleware.silentAuth())

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

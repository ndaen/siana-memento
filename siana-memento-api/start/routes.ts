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
const OrdersController = () => import('#controllers/orders_controller')
const WebhooksController = () => import('#controllers/webhooks_controller')
const HealthController = () => import('#controllers/health_controller')
const AdminController = () => import('#controllers/admin_controller')
const TestimonialsController = () => import('#controllers/testimonials_controller')
const SurveyController = () => import('#controllers/survey_controller')

const registerThrottle = limiter.define('register', () => limiter.allowRequests(3).every('1 hour'))

const loginThrottle = limiter.define('login', () => limiter.allowRequests(10).every('15 minutes'))

const designsThrottle = limiter.define('designs', () => limiter.allowRequests(20).every('1 hour'))

// Rate limit strict pour les générations IA — coût Gemini par requête
const generationsThrottle = limiter.define('generations', () =>
  limiter.allowRequests(5).every('1 minute')
)

const ordersThrottle = limiter.define('orders', () => limiter.allowRequests(5).every('15 minutes'))

const downloadThrottle = limiter.define('download', () =>
  limiter.allowRequests(10).every('15 minutes')
)

// Survey public (Story 6.8) — soumission sans auth, throttle léger contre l'abus de la route ouverte.
// Appliqué uniquement au POST (write) : le GET (lecture, findBy indexé) reste libre pour ne pas
// bloquer le chargement de page derrière une IP partagée (NAT/CGNAT). Cf. les autres routes write-only.
const surveyThrottle = limiter.define('survey', () => limiter.allowRequests(20).every('15 minutes'))

// Healthcheck — pas de rate limiter ni d'auth utilisateur (cf. Story 6.1)
// /api/health      : readiness détaillée (DB + Cloudinary + Resend) protégée par MONITORING_SECRET → cible UptimeRobot
// /api/health/live : liveness publique légère → cible du healthcheck de déploiement (Railway / Docker)
router.get('/api/health', [HealthController, 'index'])
router.get('/api/health/live', [HealthController, 'live'])

// Testimonials — lecture publique (landing). Aucune auth : ne retourne que les actifs (Story 6.7).
router.get('/api/testimonials', [TestimonialsController, 'publicIndex'])

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

// Génération IA — silentAuth + throttle strict (5/min) pour limiter les coûts API Gemini
router
  .post('/api/designs/:id/generate', [DesignsController, 'generate'])
  .use([generationsThrottle, middleware.silentAuth()])

// Polling statut — sans throttle strict (légère, retourne juste un statut)
router.get('/api/designs/:id/status', [DesignsController, 'status']).use(middleware.silentAuth())

// Orders — auth obligatoire, throttle uniquement sur la création (coût Stripe)
router.get('/api/orders', [OrdersController, 'index']).use(middleware.auth())
router.post('/api/orders', [OrdersController, 'store']).use([ordersThrottle, middleware.auth()])
router
  .get('/api/orders/by-session/:sessionId', [OrdersController, 'showBySession'])
  .use(middleware.auth())
router
  .get('/api/orders/:id/download', [OrdersController, 'download'])
  .use([downloadThrottle, middleware.auth()])
router.get('/api/orders/:id', [OrdersController, 'show']).use(middleware.auth())

// Stripe webhook — pas d'auth, pas de rate limiter, signature validée dans le controller
router.post('/api/webhooks/stripe', [WebhooksController, 'handle'])

// Survey de satisfaction (Story 6.8) — PUBLIC, sans auth, résolu par token opaque (D5).
// Throttle uniquement sur la soumission (POST) ; le GET (lecture) reste libre.
router.get('/api/survey/:token', [SurveyController, 'show'])
router.post('/api/survey/:token', [SurveyController, 'submit']).use(surveyThrottle)

// Admin — dashboard métriques + export CSV. Protégé serveur (NFR-S10) : auth() puis admin().
// L'ordre importe : auth() peuple auth.user, admin() vérifie isAdmin (403 sinon).
router
  .group(() => {
    router.get('/metrics', [AdminController, 'metrics'])
    router.get('/metrics/export-csv', [AdminController, 'exportCsv'])
    router.get('/logs', [AdminController, 'logs'])
    router.get('/orders', [AdminController, 'orders'])
    router.post('/orders/:id/resend-email', [AdminController, 'resendEmail'])
    router.get('/survey', [AdminController, 'survey'])

    // CRUD testimonials (Story 6.7, FR50)
    router.get('/testimonials', [TestimonialsController, 'index'])
    router.post('/testimonials', [TestimonialsController, 'store'])
    router.patch('/testimonials/:id', [TestimonialsController, 'update'])
    router.delete('/testimonials/:id', [TestimonialsController, 'destroy'])
  })
  .prefix('/api/admin')
  .use([middleware.auth(), middleware.admin()])

router
  .group(() => {
    router
      .post('/register', [AuthController, 'register'])
      .use([registerThrottle, middleware.guest()])

    router.post('/login', [AuthController, 'login']).use(loginThrottle)

    router.get('/google', [AuthController, 'redirectToGoogle'])
    router.get('/google/callback', [AuthController, 'googleCallback'])

    router.get('/me', [AuthController, 'me']).use(middleware.auth())

    router.post('/logout', [AuthController, 'logout'])
  })
  .prefix('/auth')

/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DATABASE_URL: Env.schema.string.optional(),
  DB_HOST: Env.schema.string.optional({ format: 'host' }),
  DB_PORT: Env.schema.number.optional(),
  DB_USER: Env.schema.string.optional(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring ally package
  |----------------------------------------------------------
  */
  GOOGLE_CLIENT_ID: Env.schema.string(),
  GOOGLE_CLIENT_SECRET: Env.schema.string(),
  APP_URL: Env.schema.string(),
  FRONTEND_URL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Cloudinary
  |----------------------------------------------------------
  */
  CLOUDINARY_CLOUD_NAME: Env.schema.string(),
  CLOUDINARY_API_KEY: Env.schema.string(),
  CLOUDINARY_API_SECRET: Env.schema.string(),
  // public_id du logo uploadé dans Cloudinary (ex: "watermarks/siana-logo")
  CLOUDINARY_WATERMARK_PUBLIC_ID: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Stripe
  |----------------------------------------------------------
  */
  STRIPE_SECRET_KEY: Env.schema.string(),
  STRIPE_WEBHOOK_SECRET: Env.schema.string(),
  STRIPE_PRICE_ID: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Resend (transactional emails)
  |----------------------------------------------------------
  */
  RESEND_API_KEY: Env.schema.string(),
  RESEND_FROM_EMAIL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring monitoring / healthcheck
  |----------------------------------------------------------
  */
  // Secret partagé avec UptimeRobot pour accéder au readiness endpoint /api/health (NFR-S10)
  MONITORING_SECRET: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring admin metrics dashboard
  |----------------------------------------------------------
  */
  // Estimation MVP du coût Gemini par génération (EUR). Utilisé tant que la Story 6.3
  // ne persiste pas le coût réel. Défaut applicatif ~0,50€ si absent.
  GEMINI_COST_EUR_ESTIMATE: Env.schema.number.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring admin alerts (alertes admin)
  |----------------------------------------------------------
  */
  // Destinataire des emails d'alerte (commande alerts:check). Optionnel : si absent,
  // la commande loggue un WARN et n'envoie aucun email (garde test/dev — pas d'appel Resend).
  ADMIN_ALERT_EMAIL: Env.schema.string.optional(),
  // Seuil taux d'erreur des générations IA (ratio 0..1). Défaut applicatif 0.05 (5%).
  ERROR_RATE_THRESHOLD: Env.schema.number.optional(),
  // Volume minimal de générations sur la fenêtre avant d'évaluer le taux d'erreur
  // (évite 1 échec sur 1 = 100% faux positif). Défaut applicatif 5.
  ERROR_RATE_MIN_SAMPLE: Env.schema.number.optional(),
  // Seuil coût moyen API par commande payée (EUR). Défaut applicatif 0.70.
  API_COST_ALERT_EUR: Env.schema.number.optional(),
  // Nombre minimal d'erreurs quota (429/RESOURCE_EXHAUSTED/...) avant alerte rate-limit. Défaut 1.
  GEMINI_QUOTA_ALERT_MIN_HITS: Env.schema.number.optional(),
  // Cooldown anti-spam entre deux alertes du même type (minutes). Défaut applicatif 60.
  ALERT_COOLDOWN_MINUTES: Env.schema.number.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring satisfaction survey (Story 6.8)
  |----------------------------------------------------------
  */
  // Délai (heures) après paiement avant l'envoi du survey. Défaut applicatif 24.
  SURVEY_DELAY_HOURS: Env.schema.number.optional(),
  // Fenêtre haute (jours) : on n'enquête pas les commandes payées il y a plus de N jours
  // (anti-flood rétroactif au 1er run). Défaut applicatif 30.
  SURVEY_RETRO_WINDOW_DAYS: Env.schema.number.optional(),
})

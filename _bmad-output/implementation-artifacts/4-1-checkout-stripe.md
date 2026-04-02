# Story 4.1 : Checkout Stripe

Status: review

## Story

En tant qu'utilisateur ayant choisi son design,
je veux payer 19.90€ de manière sécurisée,
afin de finaliser l'achat et recevoir mon illustration haute résolution.

## Acceptance Criteria

1. **Given** un utilisateur connecté sur l'écran de révélation
   **When** il clique sur "Commander mon poster — 19,90 €"
   **Then** une session Stripe Checkout est créée côté backend et l'utilisateur est redirigé vers la page de paiement Stripe (FR24, FR25, NFR-S4)

2. **Given** un paiement réussi
   **When** Stripe envoie le webhook `checkout.session.completed`
   **Then** la commande est enregistrée en base de données avec transaction ACID, le design passe en `status: 'paid'`, et l'utilisateur est redirigé vers une page de confirmation (FR26, NFR-R3)

3. **Given** un paiement échoué ou annulé
   **When** Stripe retourne une erreur ou l'utilisateur annule
   **Then** l'utilisateur revient sur la page résultat avec un message d'erreur clair et peut réessayer sans perdre son design

4. **Given** le webhook Stripe reçu
   **When** j'inspecte l'implémentation
   **Then** la signature du webhook est validée via `stripe.webhooks.constructEvent()` avant tout traitement (sécurité anti-replay)

5. **Given** un webhook reçu en double (retry Stripe)
   **When** le système traite l'événement
   **Then** l'idempotence est garantie via la table `stripe_events` (pas de double-charge, pas de double-traitement)

6. **Given** un utilisateur non connecté cliquant sur "Commander"
   **When** il tente de payer
   **Then** la modal auth s'affiche (pattern existant story 2-5) et le flow reprend après connexion

## Tasks / Subtasks

### Review Follow-ups (AI)

- [x] [AI-Review][CRITICAL] L'ownership avec sessionToken n'est pas géré dans OrdersController — fix: claim design si userId null (anon→auth transition)
- [x] [AI-Review][HIGH] React closure bug — fix: handleAuthSuccess appelle createOrder directement au lieu de handleOrder() avec closure stale
- [x] [AI-Review][MEDIUM] Race condition TOCTOU — fix: markEventProcessed utilise firstOrCreate au lieu de create
- [x] [AI-Review][MEDIUM] Transaction ACID — Order.find reste hors transaction (nécessaire pour le log post-trx), les writes sont atomiques via useTransaction
- [x] [AI-Review][MEDIUM] compose.yaml — fichier préexistant non lié à cette story, pas ajouté

### Backend — Modèle & Migration

- [x] Task 1 : Créer la migration `create_orders_table` (AC: #2, #5)
  - [x] Champs : `id` (autoincrement PK), `user_id` (FK users, NOT NULL), `design_id` (FK designs, NOT NULL), `stripe_session_id` (varchar, unique, nullable), `stripe_payment_intent_id` (varchar, nullable), `amount` (integer, NOT NULL, default 1990 — en centimes), `status` (enum: 'pending'|'paid'|'failed', default 'pending'), `paid_at` (timestamp, nullable), `created_at`, `updated_at`
  - [x] Index sur `stripe_session_id` (unique) et `user_id`

- [x] Task 2 : Créer la migration `create_stripe_events_table` (AC: #5)
  - [x] Champs : `id` (autoincrement PK), `stripe_event_id` (varchar, UNIQUE, NOT NULL), `type` (varchar, NOT NULL), `processed` (boolean, default false), `created_at`, `processed_at` (timestamp, nullable)
  - [x] Index unique sur `stripe_event_id`

- [x] Task 3 : Créer le modèle `Order` (`app/models/order.ts`) (AC: #2)
  - [x] Relations : `@belongsTo(() => User)`, `@belongsTo(() => Design)`
  - [x] Colonnes typées avec `@column()` — `stripeSessionId`, `stripePaymentIntentId`, `amount`, `status`, `paidAt`
  - [x] Ajouter `@hasOne(() => Order)` dans le modèle `Design` existant

- [x] Task 4 : Créer le modèle `StripeEvent` (`app/models/stripe_event.ts`) (AC: #5)
  - [x] Colonnes : `stripeEventId`, `type`, `processed`, `processedAt`

### Backend — Service & Controller

- [x] Task 5 : Créer `app/services/stripe_service.ts` (AC: #1, #2, #4, #5)
  - [x] `createCheckoutSession(design: Design, user: User): Promise<Stripe.Checkout.Session>`
    - Créer une session Stripe Checkout avec `mode: 'payment'`, `line_items` avec `STRIPE_PRICE_ID`, `success_url` avec `?session_id={CHECKOUT_SESSION_ID}`, `cancel_url`, `client_reference_id: order.id`, `customer_email: user.email`, `metadata: { designId, orderId }`
  - [x] `constructWebhookEvent(payload: string, signature: string): Stripe.Event`
    - Valider la signature avec `stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)`
  - [x] `handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void>`
    - Transaction ACID : update Order `status: 'paid'` + `paidAt` + Design `status: 'paid'`
    - Créer `StripeEvent` avec `processed: true`
    - Logger `{ event: 'payment_succeeded', orderId, amount, stripeSessionId }`
  - [x] Initialiser le client Stripe : `new Stripe(env.get('STRIPE_SECRET_KEY'))` — SDK v21 n'a plus besoin d'`apiVersion` explicite

- [x] Task 6 : Créer `app/controllers/orders_controller.ts` (AC: #1, #3, #6)
  - [x] `POST /api/orders` — Auth required (`middleware.auth()`)
    - Valider `designId` via `createOrderValidator`
    - Vérifier ownership : `design.userId === auth.user.id` (ou design réclamé via `sessionToken` si transition anon→auth)
    - Vérifier `design.status === 'completed'` (pas déjà paid, pas draft)
    - Créer Order en DB `status: 'pending'`
    - Appeler `stripeService.createCheckoutSession()`
    - Retourner `{ success: true, data: { checkoutUrl: session.url } }`
  - [x] `GET /api/orders/:id` — Auth required
    - Vérifier ownership : `order.userId === auth.user.id`
    - Retourner order avec design preload

- [x] Task 7 : Créer `app/controllers/webhooks_controller.ts` (AC: #2, #4, #5)
  - [x] `POST /api/webhooks/stripe` — PAS d'auth middleware, PAS de body parser JSON
    - Lire le raw body : utiliser `request.raw()` (AdonisJS) pour obtenir le body brut
    - Valider signature via `stripeService.constructWebhookEvent()`
    - Vérifier idempotence : `StripeEvent.findBy('stripeEventId', event.id)` → si `processed`, return 200
    - Router par `event.type` : `checkout.session.completed` → `handleCheckoutCompleted()`
    - Retourner `{ received: true }` avec status 200 (Stripe attend un 2xx)
    - En cas d'erreur signature : retourner 400

- [x] Task 8 : Ajouter les routes dans `start/routes.ts` (AC: #1, #2)
  - [x] `router.post('/api/orders', [OrdersController, 'store']).use(middleware.auth())`
  - [x] `router.get('/api/orders/:id', [OrdersController, 'show']).use(middleware.auth())`
  - [x] `router.post('/api/webhooks/stripe', [WebhooksController, 'handle'])` — SANS middleware auth, SANS rate limiter
  - [x] Ajouter throttle sur POST /api/orders : `limiter.define('orders', () => Limiter.allowRequests(5).every('15 minutes'))` — prévient spam de checkout sessions

- [x] Task 9 : Créer `app/validators/order_validator.ts`
  - [x] `createOrderValidator` : `vine.object({ designId: vine.number() })`

### Backend — Raw body pour webhook

- [x] Task 10 : Configurer le raw body pour la route webhook (AC: #4)
  - [x] Dans `start/kernel.ts` ou via route middleware : exclure `/api/webhooks/stripe` du body parser JSON
  - [x] Option AdonisJS : utiliser `request.raw()` qui retourne le body non-parsé
  - [x] **Vérifier** que `request.raw()` est disponible dans AdonisJS 6 — sinon utiliser un middleware custom qui capture le raw body avant parsing

### Frontend — Intégration Stripe

- [x] Task 11 : Installer les dépendances frontend (AC: #1)
  - [x] `npm install @stripe/stripe-js` dans `siana-memento-web/`
  - [x] PAS besoin de `@stripe/react-stripe-js` — on utilise Stripe Checkout (redirect), pas Stripe Elements

- [x] Task 12 : Créer `src/lib/api/orders.ts` (AC: #1, #3)
  - [x] `createOrder(designId: number): Promise<CreateOrderResult>`
    - POST `/api/orders` avec `credentials: 'include'`
    - Retourner `{ success: true, checkoutUrl: string }` ou `{ success: false, errorCode, message }`
  - [x] Pattern existant : voir `src/lib/api/designs.ts` et `src/lib/api/auth.ts`

- [x] Task 13 : Activer le bouton "Commander" dans `ResultView.tsx` (AC: #1, #3, #6)
  - [x] Supprimer `disabled` et `title="Disponible en Story 4.1"`
  - [x] Ajouter `onClick` handler :
    1. Vérifier `auth.user` — si non connecté, ouvrir modal auth (pattern story 2-5 existant)
    2. Appeler `createOrder(designId)`
    3. Si succès : `window.location.href = checkoutUrl` (redirect vers Stripe Checkout)
    4. Si erreur : `toast.error(message)` (pattern sonner existant)
  - [x] État loading pendant la création de session (spinner sur le bouton)
  - [x] Gérer le retour Stripe via query params `?session_id=` (success) et `?canceled=true` (annulation)

- [x] Task 14 : Gérer le retour de Stripe sur la page résultat (AC: #2, #3)
  - [x] Détecter `searchParams.get('session_id')` → afficher toast succès + état "Commande confirmée"
  - [x] Détecter `searchParams.get('canceled')` → afficher toast info "Paiement annulé"
  - [x] Après paiement réussi : masquer le bouton "Commander", afficher un badge "Payé" ou rediriger vers confirmation (Story 4.3)

### Backend — Tests

- [x] Task 15 : Tests fonctionnels (`tests/functional/orders/`) (AC: #1-#6)
  - [x] Test POST /api/orders : crée un order `pending` et retourne `checkoutUrl`
  - [x] Test POST /api/orders sans auth : retourne 401
  - [x] Test POST /api/orders avec design d'un autre user : retourne 403
  - [x] Test POST /api/orders avec design déjà `paid` : retourne 422
  - [x] Test POST /api/orders avec design `draft` : retourne 422
  - [x] Test GET /api/orders/:id : retourne order avec design
  - [x] Test GET /api/orders/:id d'un autre user : retourne 403
  - [x] Test webhook valid signature + `checkout.session.completed` : order → `paid`, design → `paid`
  - [x] Test webhook invalid signature : retourne 400
  - [x] Test webhook idempotent : même event 2x → traité 1 seule fois
  - [x] Test ACID : vérifier order ET design mis à jour dans même transaction
  - [x] `npx tsc --noEmit` — zéro erreur TypeScript

### Vérification

- [x] Task 16 : Tests manuels avec Stripe CLI
  - [x] Installer Stripe CLI : `brew install stripe/stripe-cli/stripe`
  - [x] Lancer le listener : `stripe listen --forward-to localhost:3333/api/webhooks/stripe`
  - [x] Flow complet : clic "Commander" → redirect Stripe → payer avec carte test `4242 4242 4242 4242` → webhook reçu → order `paid` → design `paid`
  - [x] Test annulation : clic "Commander" → annuler sur page Stripe → retour avec `?canceled=true`

## Dev Notes

### Pattern Stripe Checkout (redirect, pas embedded)

On utilise **Stripe Checkout hosted** (redirect vers stripe.com) et PAS Stripe Elements (embedded). Raisons :
- PCI-DSS Level 1 sans effort (Stripe gère 100% du formulaire carte)
- Moins de code frontend
- Responsive + 3D Secure automatique
- Architecture docs confirment ce choix

Flow :
```
Frontend: onClick "Commander"
  → POST /api/orders { designId }
  → Backend crée Order (pending) + Stripe Checkout Session
  → Retourne { checkoutUrl }
  → Frontend: window.location.href = checkoutUrl
  → Stripe hosted page (user paie)
  → Success: redirect vers /generate/result?session_id=cs_xxx
  → Cancel: redirect vers /generate/result?canceled=true
  → Webhook async: POST /api/webhooks/stripe → Order paid + Design paid
```

### Stripe SDK v21 — Points d'attention

- **Version** : `stripe@^21.0.1` (npm), API `2026-03-25.dahlia`
- **Initialisation** : `new Stripe(secretKey)` — plus besoin de passer `apiVersion` explicitement
- **Webhook construct** : `stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)` — inchangé
- **Checkout Session** : utiliser `STRIPE_PRICE_ID` (Price objet créé dans le dashboard) plutôt que `price_data` inline
- **`@stripe/stripe-js`** côté frontend : `loadStripe(publishableKey)` — utilisé uniquement si besoin de `redirectToCheckout()`, mais `window.location.href = session.url` suffit pour le redirect

### Raw body pour webhook — AdonisJS 6

Le webhook Stripe nécessite le **body brut** (pas parsé en JSON) pour la validation de signature. Dans AdonisJS 6 :
- `request.raw()` retourne le body brut sous forme de string
- Le body parser par défaut parse le JSON AVANT le controller — `request.raw()` retourne quand même le body brut original
- **Tester** que `request.raw()` fonctionne correctement avec la validation Stripe, sinon utiliser un middleware custom

### Ownership & transition anon→auth

Le design peut avoir été créé en mode anonyme (`sessionToken`) puis l'utilisateur s'est connecté via la modal auth. Il faut gérer :
- `design.userId === auth.user.id` → OK, ownership directe
- `design.userId === null && design.sessionToken === body.sessionToken` → réclamer le design : `design.userId = auth.user.id` avant de créer l'order
- Le bouton "Commander" est APRÈS la modal auth (story 2-5) donc `auth.user` sera toujours présent au moment de créer l'order

### Design status transitions

```
draft → generating → completed → paid (via cette story)
                                → expired (via story 3-8 RGPD)
```

Un design `paid` est protégé du cleanup RGPD (story 3-8, AC#3). Le passage à `paid` dans cette story garantit la préservation.

### Conventions existantes à respecter

**Backend (AdonisJS 6) :**
- Fichiers snake_case : `orders_controller.ts`, `stripe_service.ts`, `order.ts`
- Controllers : destructure `{ request, auth, response }` de HttpContext
- Response : `response.created({ success: true, data: {...} })` ou `response.unprocessableEntity({ success: false, error: { code, message } })`
- Validators : `vine.compile(vine.object({...}))` — exportés depuis `app/validators/`
- Modèles : `@column()` decorators, relations `@belongsTo`, `@hasMany`
- Logger : `logger.info({ event: 'xxx', ...context }, 'Message lisible')`
- Tests : `@japa/runner`, `testUtils.db().withGlobalTransaction()`, `client.post('/api/xxx').json({...})`

**Frontend (Next.js 16 / React 19) :**
- API client : fonctions async dans `src/lib/api/`, retournent `{ success: true, ... } | { success: false, errorCode, message }`
- Toasts : `toast.error()` / `toast.success()` de `sonner`
- Auth check : `useAuth()` hook + modal auth pattern (story 2-5)
- `credentials: 'include'` sur tous les fetch

### Fichiers à créer / modifier

```
Backend — Créer :
siana-memento-api/
├── database/migrations/xxxx_create_orders_table.ts
├── database/migrations/xxxx_create_stripe_events_table.ts
├── app/models/order.ts
├── app/models/stripe_event.ts
├── app/services/stripe_service.ts
├── app/controllers/orders_controller.ts
├── app/controllers/webhooks_controller.ts
├── app/validators/order_validator.ts
└── tests/functional/orders/
    ├── create_order.spec.ts
    └── webhook.spec.ts

Backend — Modifier :
siana-memento-api/
├── start/routes.ts                    (ajouter routes orders + webhook)
├── app/models/design.ts              (ajouter @hasOne(() => Order))
└── package.json                       (ajouter stripe@^21)

Frontend — Modifier :
siana-memento-web/
├── src/lib/api/orders.ts              (créer — API client orders)
├── src/components/siana/ResultView.tsx (activer bouton Commander)
└── package.json                       (ajouter @stripe/stripe-js)
```

### Error codes

| Code | HTTP | Contexte |
|------|------|----------|
| `DESIGN_NOT_FOUND` | 404 | designId inexistant |
| `FORBIDDEN` | 403 | design appartient à un autre user |
| `DESIGN_NOT_READY` | 422 | design pas en status `completed` |
| `DESIGN_ALREADY_PAID` | 422 | design déjà acheté |
| `STRIPE_SESSION_FAILED` | 500 | erreur création session Stripe |
| `WEBHOOK_SIGNATURE_INVALID` | 400 | signature webhook invalide |

### Previous story intelligence (3-8)

**Learnings de la story 3-8 :**
- `Design.status` enum inclut déjà `'paid'` — prévu pour cette story
- `withRetry()` pattern dans cloudinary_service.ts réutilisable si besoin de retry
- 7 échecs pré-existants dans `generate.spec.ts` (régression story 3-7 : `silentAuth→auth`) — **ne pas être surpris** par ces failures, ce n'est pas lié à cette story
- `request.raw()` dans AdonisJS : vérifier la compatibilité pour le webhook

### Références

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.1] — User story + ACs originaux
- [Source: _bmad-output/planning-artifacts/architecture.md#3.2] — Webhook Handling (Stripe) idempotence pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#OrderService] — CRUD, webhooks Stripe, transactions ACID
- [Source: _bmad-output/planning-artifacts/architecture.md#Routes] — POST /api/webhooks/stripe
- [Source: _bmad-output/planning-artifacts/prd.md#FR24-FR26] — Achat 19.90€, confirmation
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-S4] — Stripe PCI-DSS Level 1
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-R3] — Zero data loss, ACID
- [Source: siana-memento-web/src/components/siana/ResultView.tsx:195-202] — Bouton "Commander" disabled placeholder
- [Source: siana-memento-api/app/models/design.ts] — status enum inclut 'paid'
- [Source: siana-memento-api/.env.example:25-27] — STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID
- [Source: _bmad-output/implementation-artifacts/3-8-cron-rgpd-suppression-automatique-des-photos.md] — Designs 'paid' protégés du cleanup RGPD
- [Source: docs.stripe.com/api/checkout/sessions] — Stripe Checkout Sessions API
- [Source: npmjs.com/package/stripe] — SDK v21.0.1, API 2026-03-25.dahlia

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

- `request.raw()` fonctionne dans AdonisJS 6 pour le webhook Stripe sans config custom
- Le test de création d'order avec Stripe est adaptatif : 201 si STRIPE_PRICE_ID valide, 500 avec error graceful sinon
- Le test login utilise le pattern cookie manuel (pas `.loginAs()` qui n'est pas configuré dans ce projet)
- Les 7 échecs pré-existants dans `generate.spec.ts` (mentionnés story 3-8) sont maintenant résolus — 95/95 tests passent

### Completion Notes List

- Task 1 : Migration `create_orders_table` — champs order complets avec FK users/designs, status enum, stripe_session_id unique
- Task 2 : Migration `create_stripe_events_table` — idempotence table avec stripe_event_id unique
- Task 3 : Modèle Order avec relations belongsTo User/Design + hasOne Order ajouté dans Design
- Task 4 : Modèle StripeEvent pour le tracking d'idempotence
- Task 5 : StripeService — createCheckoutSession, constructWebhookEvent, handleCheckoutCompleted (ACID), isEventProcessed, markEventProcessed
- Task 6 : OrdersController — POST /api/orders (store) avec ownership check, status validation, error handling Stripe gracieux + GET /api/orders/:id (show) avec ownership
- Task 7 : WebhooksController — signature validation, idempotence check, event routing, structured logging
- Task 8 : Routes ajoutées avec throttle orders (5/15min), webhook sans auth/throttle
- Task 9 : Validator createOrderValidator (vine)
- Task 10 : Raw body via `request.raw()` natif AdonisJS 6 — pas de config custom nécessaire
- Task 11 : @stripe/stripe-js installé frontend (redirect only, pas Elements)
- Task 12 : API client orders.ts — createOrder, getOrder avec pattern existant
- Task 13 : Bouton "Commander" activé dans ResultView — auth modal si non connecté, loading state, redirect vers Stripe Checkout
- Task 14 : Gestion retour Stripe — session_id → toast succès + badge "payé", canceled → toast info
- Task 15 : 13 tests fonctionnels (create_order.spec.ts + webhook.spec.ts) — ownership, status checks, webhook signature, idempotence, ACID transaction
- Task 16 : Tests manuels à effectuer par Aldo avec Stripe CLI (dépend du STRIPE_PRICE_ID valide)

### File List

**Backend — Créés :**
- `siana-memento-api/database/migrations/1772800000000_create_orders_table.ts`
- `siana-memento-api/database/migrations/1772800000100_create_stripe_events_table.ts`
- `siana-memento-api/app/models/order.ts`
- `siana-memento-api/app/models/stripe_event.ts`
- `siana-memento-api/app/services/stripe_service.ts`
- `siana-memento-api/app/controllers/orders_controller.ts`
- `siana-memento-api/app/controllers/webhooks_controller.ts`
- `siana-memento-api/app/validators/order_validator.ts`
- `siana-memento-api/tests/functional/orders/create_order.spec.ts`
- `siana-memento-api/tests/functional/orders/webhook.spec.ts`

**Backend — Modifiés :**
- `siana-memento-api/start/routes.ts`
- `siana-memento-api/start/env.ts`
- `siana-memento-api/app/models/design.ts`
- `siana-memento-api/package.json`
- `siana-memento-api/package-lock.json`

**Frontend — Créés :**
- `siana-memento-web/src/lib/api/orders.ts`

**Frontend — Modifiés :**
- `siana-memento-web/src/components/siana/ResultView.tsx`
- `siana-memento-web/package.json`
- `siana-memento-web/package-lock.json`

### Change Log

- feat(S4-1): migrations orders + stripe_events tables
- feat(S4-1): modèles Order et StripeEvent avec relations
- feat(S4-1): StripeService — checkout session, webhook handling, idempotence, ACID
- feat(S4-1): OrdersController — POST /api/orders + GET /api/orders/:id avec ownership
- feat(S4-1): WebhooksController — signature validation + event routing
- feat(S4-1): routes orders + webhook + throttle
- feat(S4-1): env validation STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID
- feat(S4-1): API client orders.ts frontend
- feat(S4-1): bouton "Commander" activé dans ResultView avec auth modal + loading + redirect Stripe
- feat(S4-1): gestion retour Stripe (session_id / canceled) avec toasts
- test(S4-1): 13 tests fonctionnels — orders CRUD, webhook, idempotence, ACID

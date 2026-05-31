---
baseline_commit: a64a017a624d0a8f1ad97f9b42e88d7d50f70d31
---

# Story 6.1: Healthcheck Endpoint et Monitoring

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'**admin Aldo**,
je veux **un endpoint `/api/health` qui vérifie l'état de tous les composants (DB, Cloudinary, Resend)**,
afin de **recevoir des alertes via UptimeRobot si le service est dégradé**.

## Acceptance Criteria

> Critères repris **verbatim** depuis `epics.md` (Story 6.1, lignes 911-933). Ne pas reformuler.

1. **Given** une requête GET sur `/api/health`
   **When** tous les composants sont opérationnels (DB, Cloudinary, Resend)
   **Then** l'endpoint retourne HTTP 200 avec `{ status: "ok", components: {...} }` (FR45)

2. **Given** une requête GET sur `/api/health`
   **When** un composant est indisponible
   **Then** l'endpoint retourne HTTP 503 avec le détail du composant défaillant (NFR-R5)

3. **Given** l'endpoint configuré
   **When** UptimeRobot ping toutes les 5 minutes et deux pings consécutifs échouent
   **Then** Aldo reçoit un email d'alerte automatique (NFR-R1 — uptime ≥99%)

4. **Given** l'endpoint `/api/health`
   **When** j'inspecte son accès
   **Then** il est protégé par un secret token ou IP allowlist — jamais public sans auth (NFR-S10)

[Source: epics.md#Story-6.1-Healthcheck-Endpoint-et-Monitoring (lignes 911-933) — AC#1 L919-921, AC#2 L923-925, AC#3 L927-929, AC#4 L931-933]

## Tasks / Subtasks

- [x] **Task 1 — Extraire le stub existant dans un `HealthController`** (AC: #1, #2)
  - [x] Créé `app/controllers/health_controller.ts` (ESM, classe par défaut, `@inject()`, `HttpContext` destructuré — pattern `auth_controller.ts`).
  - [x] Logique du stub inline reprise et enrichie ; le contrat `{status, timestamp}` est préservé sur la route liveness.
  - [x] `start/routes.ts` : handler inline remplacé par `router.get('/api/health', [HealthController, 'index'])` + `router.get('/api/health/live', [HealthController, 'live'])`, avec `const HealthController = () => import('#controllers/health_controller')`. *(handler nommé `index`/`live` plutôt que `handle` — split readiness/liveness validé par Aldo.)*
  - [x] Aucun rate limiter ni `middleware.auth()/silentAuth()` sur ces routes ; protection secret gérée dans le controller.

- [x] **Task 2 — Implémenter les checks de composants** (AC: #1, #2)
  - [x] **DB (PostgreSQL)** : `db.connection().rawQuery('SELECT 1')` en `try/catch`, encadré par `withTimeout(…, 3000)`. Mesure `responseTime`. Toujours live (dépendance dure).
  - [x] **Cloudinary** : **ping réel léger** `cloudinary.api.ping()` (timeout 3s) — peut réellement passer `down` si l'API Cloudinary est injoignable. *(Correctif review M1 : remplace l'ancien check « présence de config » tautologique.)*
  - [x] **Resend** : **ping réel léger** `resend.domains.list()` (timeout 3s) — valide la clé + joignabilité API sans consommer le quota d'envoi. ⚠️ requiert une clé Resend **full-access** (cf. note dans le service).
  - [x] **INTERDIT respecté** : aucun appel Gemini ni Stripe dans la sonde.
  - [x] **Caching** : succès des pings Cloudinary/Resend mémoïsés **60s** (`HealthService.cache`, `resetCache()` pour les tests) ; un `down` n'est pas caché (rétablissement détecté vite). La DB n'est pas cachée.
  - [x] Agrégation : tous `ok` → **200** ; au moins un `down` → **503**.

- [x] **Task 3 — Format de réponse (rétro-compatible + détaillé)** (AC: #1, #2)
  - [x] Réponse 200 : `{ status: "ok", timestamp, components: { database: { status, responseTime }, cloudinary: { status }, resend: { status } } }`.
  - [x] Réponse 503 : `status: "error"` + composant(s) `down` avec `message` court non sensible.
  - [x] Champs top-level `status` + `timestamp` conservés (rétro-compat Story 1.2 + keyword UptimeRobot).
  - [x] Forme « plate » conservée volontairement (PAS d'enveloppe `{success,data}`) — choix documenté en commentaire inline dans le controller.

- [x] **Task 4 — Sécuriser l'endpoint + résoudre le conflit healthcheck Railway** (AC: #4)
  - [x] **Routes readiness/liveness** : `/api/health` = readiness détaillée + secret (UptimeRobot) ; `/api/health/live` = liveness publique légère (Railway).
  - [x] **`railway.toml` repointé** : `healthcheckPath = "/api/health/live"` (vérifié).
  - [x] `/api/health` protégé par secret **via header `x-monitoring-secret` uniquement** (pas en query — correctif review L1 : éviter la fuite du secret dans les access logs), comparé à `MONITORING_SECRET` en **temps constant** (`timingSafeEqual` — correctif review L2) ; `401` si absent/incorrect.
  - [x] Choix secret token (IP allowlist documentée comme alternative).
  - [x] `MONITORING_SECRET` ajouté à `start/env.ts` (`Env.schema.string()`), `.env` et `.env.example`.
  - [x] Aucune info sensible (stack/version/host/DB/métriques) dans le corps.

- [x] **Task 5 — Logging (NFR-R8)** (AC: #2)
  - [x] `logger.warn({ event: 'health_check_degraded', components }, …)` uniquement sur état dégradé ; aucun log sur ping OK.

- [~] **Task 6 — Configuration du monitoring externe + déploiement** (AC: #3) — *partie code faite ; partie ops à finaliser par Aldo*
  - [ ] **UptimeRobot** : *action ops Aldo* — créer le monitor HTTP(s) sur `/api/health` avec le `MONITORING_SECRET` **en header `x-monitoring-secret`** (le secret en query n'est plus accepté), intervalle 5 min, alerte email après 2 échecs, keyword `"ok"`. (Hors-code.)
  - [x] **Railway** : `railway.toml` `healthcheckPath` repointé sur `/api/health/live` (Task 4).
  - [x] **Dev local Docker (`compose.yaml`)** : bloc `healthcheck` ajouté au service `api` (`wget -qO- http://localhost:3333/api/health/live`, interval 10s, timeout 5s, retries 5, start_period 25s). `wget` confirmé présent (BusyBox sur `node:22-alpine`). Healthcheck `db` (`pg_isready`) inchangé.

- [x] **Task 7 — Tests fonctionnels Japa** (AC: #1, #2, #4)
  - [x] `tests/functional/health/health.spec.ts` (endpoint, via `app.container.swap(HealthService)`) + `tests/functional/health/health_service.spec.ts` (logique du service avec pings injectés + DB live).
  - [x] `MONITORING_SECRET` fourni via `.env` (chargé aussi en `NODE_ENV=test`, pas de `.env.test` dans le repo) ; lu via `env.get('MONITORING_SECRET')`.
  - [x] Cas endpoint readiness : 200 (tous up : database/cloudinary/resend), 503 (composant down), 401 sans secret, 401 secret invalide, **401 secret en query** (header-only, correctif L1), pas de 429 sur 15 appels.
  - [x] Cas liveness : 200 sans secret, `{status:"ok"}`, sans `components`.
  - [x] Cas service : tous up → healthy ; cloudinary `down` → unhealthy + détail ; resend qui throw → `down` sans crash.
  - **Résultat : 10/10 health (7 endpoint + 3 service) ; suite complète 154/154.**

## Dev Notes

### Contexte & objectif
La Story 6.1 ouvre l'**Epic 6 (Dashboard Admin & Opérations Business)**. Elle transforme le **stub `/api/health` existant** (introduit en Story 1.2, simple `{status, timestamp}`) en une véritable sonde de santé multi-composants, support du monitoring uptime externe (UptimeRobot) et socle des opérations. C'est une story **backend/ops, sans surface UI** (confirmé : aucune exigence UX pertinente — l'endpoint n'a pas d'écran). [Source: epics.md#Epic-6 lignes 902-907 ; #Story-6.1 lignes 911-933]

### État actuel du code (lu directement)
- **`start/routes.ts:37-42`** — route inline existante :
  ```ts
  router.get('/api/health', async ({ response }) => {
    return response.ok({ status: 'ok', timestamp: new Date().toISOString() })
  })
  ```
  Aucun middleware ni rate limiter sur cette route. Les autres routes utilisent `@adonisjs/limiter` (throttles `register`/`login`/`designs`/`generations`/`orders`/`download`) et `middleware.auth()` / `middleware.silentAuth()` / `middleware.guest()`. **À préserver** : toutes les autres routes inchangées.
- **Stack (package.json vérifié)** : AdonisJS `@adonisjs/core ^6.18.0`, `@adonisjs/lucid ^21.6.1`, `@adonisjs/auth`, `@adonisjs/cors`, `@adonisjs/limiter`, `@adonisjs/session`, `@adonisjs/ally`, `pg ^8.18.0`, `luxon ^3.7.2`, `cloudinary ^2.9.0`, `resend ^6.10.0`, `stripe ^21.0.1`, `@google/genai`. Node `>=20.6.0`, ESM (`"type":"module"`), alias d'import (`#controllers/*`, `#services/*`, `#config/*`, `#start/*`, …).
- **`config/database.ts`** : connexion `postgres` (client `pg`), `env.get('DATABASE_URL')` sinon `DB_HOST/PORT/USER/PASSWORD/DATABASE`. → le check DB peut utiliser `db.connection().rawQuery('SELECT 1')` sans config supplémentaire.
- **`start/env.ts`** : valide `NODE_ENV`, `PORT`, `APP_KEY`, `HOST`, `LOG_LEVEL`, `DATABASE_URL?`/`DB_*?`, `CLOUDINARY_*`, `RESEND_API_KEY`, `STRIPE_*`, etc. → y ajouter `MONITORING_SECRET`.
- **`start/kernel.ts`** : middleware serveur (`container_bindings`, `force_json_response`, `cors`) + middleware routeur (`bodyparser`, `session`, `auth/initialize`) + nommés (`guest`/`auth`/`silentAuth`). La route health **ne doit recevoir aucun** middleware nommé ; la protection secret est gérée dans le controller (ou un petit middleware dédié), **pas** via `middleware.auth()` (qui est l'auth utilisateur).
- **`railway.toml`** : healthcheck déploiement déjà branché sur `/api/health` (voir conflit critique ci-dessous).
- **`compose.yaml`** : healthcheck `db` (`pg_isready`) présent ; service `api` sur `PORT=3333`, **sans** healthcheck.
- **Controllers existants** : `auth_controller.ts`, `designs_controller.ts`, `orders_controller.ts`, `upload_controller.ts`, `webhooks_controller.ts` → suivre ce pattern pour `health_controller.ts`.
- **Services existants (dossier plat `app/services/`)** : `auth_service.ts`, `cloudinary_service.ts`, `email_service.ts`, `generation_service.ts`, `stripe_service.ts`. Si une logique de check mérite un service, créer `app/services/health_service.ts` (convention plate, pas de sous-dossier).
- **Tests** : Japa (`@japa/runner`, `@japa/api-client`, `@japa/plugin-adonisjs`, `@japa/assert`), `tests/functional/<feature>/<cas>.spec.ts`, bootstrap `tests/bootstrap.ts`, helpers `tests/helpers/`. Commande : `npm test` (`node ace test`).

### Patterns à suivre (architecture)
- **Controller** : classe exportée par défaut, `@inject()` si dépendance service, handler `async handle({ response }: HttpContext)`. [Source: code map — auth_controller.ts]
- **DB** : `import db from '@adonisjs/lucid/services/db'` ; `db.connection().rawQuery('SELECT 1')`. Pool Lucid `{min:2,max:10}`. [Source: architecture.md#5.2 ; config/database.ts]
- **Logger** : `import logger from '@adonisjs/core/services/logger'` (Pino JSON structuré, niveaux error/warn/info/debug). [Source: architecture.md#3.3]
- **Env** : ajouter les nouvelles variables dans `start/env.ts` (validation Adonis) + `.env`/`.env.example`.

### Option recommandée — module health natif AdonisJS 6 (✅ disponible, vérifié)
Le **module health checks natif** est **déjà installé** (vérifié : `@adonisjs/core/build/modules/health.js` + `@adonisjs/lucid/build/src/database/checks/db_check.js`). Il fournit `DbCheck` (exécute `SELECT 1`), `DbConnectionCountCheck`, `DiskSpaceCheck`, `MemoryHeapCheck`/`MemoryRSSCheck`. Pattern conventionnel : créer `start/health.ts` qui enregistre les checks, puis dans le controller :
```ts
const report = await healthChecks.run()
return report.isHealthy ? response.ok(report) : response.serviceUnavailable(report)
```
- **À préférer pour le check DB** (`DbCheck` → mapping propre 200/503, support `cacheInterval` pour ne pas re-sonder à chaque ping).
- ⚠️ Le **format natif** du rapport (`{ isHealthy, status, checks: [...] }`) **ne correspond pas** au contrat des AC (`{ status:"ok", components:{...} }`) ni au champ `timestamp` de la Story 1.2. → **Mapper** le rapport natif vers la forme attendue (`status` + `components` + `timestamp`), ou composer une réponse maison qui s'appuie sur `DbCheck` pour la DB et des checks légers maison pour Cloudinary/Resend. Ne pas renvoyer le rapport natif brut.
- ⚠️ Le rapport natif expose disk/heap/RSS/connection-counts → infos sensibles : ne les exposer que derrière le secret (Task 4), jamais sur la route de liveness publique.
- **Alternative minimaliste** (philosophie « Good Enough Architecture », ~10% coverage MVP) : check manuel `db.connection().rawQuery('SELECT 1')` en `try/catch` si l'intégration du module paraît disproportionnée. [Source: code vérifié ; AdonisJS docs health checks]

### 🔴 Conflit CRITIQUE : protection par secret (AC#4) ↔ healthcheck de déploiement Railway
**Vérifié dans le repo** : `siana-memento-api/railway.toml` contient déjà (contenu exact) :
```toml
[build]
builder = "RAILPACK"
buildCommand = "npm install && node ace build --ignore-ts-errors"

[deploy]
startCommand = "node build/ace migration:run --force && node build/bin/server.js"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```
→ Railway ping `/api/health` **à chaque déploiement** et **ne peut pas** y joindre le `MONITORING_SECRET`. Si on protège `/api/health` par secret (AC#4) **sans rien changer d'autre**, Railway recevra **401 → tous les déploiements échoueront** (rollback en boucle). (Note : `healthcheckTimeout = 30` s offre une marge confortable vis-à-vis des checks ≤3s — pas de faux négatif au déploiement.)

**Résolution ACTÉE (décision Aldo, 2026-05-31) — pattern liveness/readiness :**
- **`/api/health`** → readiness **détaillée + protégée par secret** (DB+Cloudinary+Resend, 200/503) = AC#1/#2/#4, cible **UptimeRobot**.
- **`/api/health/live`** (nouvelle) → liveness **publique ultra-légère** (`{status:"ok"}`, sans DB/tiers/secret) = cible du **healthcheck Railway** et du compose dev.
- **Repointer `railway.toml`** : `healthcheckPath = "/api/health/live"`.

Ce choix respecte les 4 AC à la lettre et ne demande qu'un repointage `railway.toml`. C'est la solution à implémenter (les alternatives route-unique / IP-allowlist ont été écartées).

### ⚠️ Autres conflits inter-sources (ne pas propager naïvement)
1. **Cible de déploiement — tranchée : Railway.** `architecture.md` décrit (de façon non retenue) un VPS Hostinger auto-hébergé, mais `CLAUDE.md`, `prd.md`, `epics.md` **et la présence de `railway.toml`** confirment **Railway** (+ Vercel front). Le `compose.yaml` du repo sert le **dev local** uniquement. → Implémenter pour Railway ; le compose dev est un bonus (Task 6).
2. **Canal d'alerte — Email vs Discord (décision repoussée à la Story 6.4).** Pour la 6.1, l'alerte de l'AC#3 est émise par **UptimeRobot** (externe) par **email** — c'est l'alerte uptime, inchangée et indépendante de ce choix. L'alerting **applicatif** (taux d'erreur >5%, coûts, rate limits) relève de la **Story 6.4** (hors scope 6.1) : `architecture.md §5.3` propose **Discord webhooks** (`DiscordService`), tandis que `prd.md`/`epics.md` mentionnent l'**email**. **Aldo a choisi de trancher au moment de créer la Story 6.4** (décision 2026-05-31). → **Ne rien implémenter d'alerting applicatif dans cette story**, et ne pas préjuger du canal.
3. **Hallucination écartée.** Un sous-agent d'analyse a cité un fichier `___wip_note.md` — **il n'existe pas** dans le repo (vérifié). Ignorer toute « note de travail » qui en proviendrait.

### Garde-fous anti-erreurs (synthèse)
- 🔴 **Repointer `railway.toml` healthcheckPath** sur la route liveness publique AVANT de mériter `/api/health` → sinon déploiements Railway cassés par le 401.
- ❌ Ne pas réécrire le stub from scratch ailleurs : **étendre** la route existante (`routes.ts:37-42`).
- ❌ Ne pas appeler Gemini/Stripe dans le healthcheck (coût + fausses pannes).
- ❌ Ne pas marteler Cloudinary/Resend → checks légers + timeout court + cache.
- ❌ Ne pas enrober en `{success,data}` (casserait le contrat Story 1.2 + keyword UptimeRobot).
- ❌ Ne pas renvoyer le rapport natif `@adonisjs/core/health` brut → mapper vers `{status, timestamp, components}`.
- ❌ Ne pas logger chaque ping OK (spam) ; logger seulement dégradé/erreur.
- ❌ Ne pas laisser fuiter d'info sensible (version, stack trace, métriques système, disk/heap/RSS) dans le corps public.
- ❌ Ne pas laisser une exception d'un check faire échouer la réponse : `try/catch` par composant, agrégation en 200/503.

### Project Structure Notes
- **NEW** : `app/controllers/health_controller.ts` ; `tests/functional/health/health.spec.ts` ; (recommandé) `start/health.ts` (enregistrement des checks natifs) ; (optionnel) `app/services/health_service.ts`.
- **UPDATE** : `start/routes.ts` (route inline → controller + ajout route liveness) ; `start/env.ts` (+`MONITORING_SECRET`) ; `.env` / `.env.example` (+`MONITORING_SECRET`) ; **`siana-memento-api/railway.toml`** (`healthcheckPath` → route liveness) ; (optionnel) `compose.yaml` (bloc healthcheck service `api`, sans toucher au `db`).
- **READ-FOR-CONTEXT** : `app/controllers/auth_controller.ts` (pattern controller `@inject()` + `HttpContext`), `app/services/stripe_service.ts` (injection `db`/logger), `config/database.ts` (connexion `postgres`, `DATABASE_URL` sinon `DB_*`), `config/logger.ts`, `start/kernel.ts` (middleware ; aucun middleware nommé à appliquer à health), `tests/bootstrap.ts`, `tests/functional/auth/login.spec.ts` (template de test).
- Alignement conventions : ESM, alias `#…`, dossier services plat, tests co-localisés par feature. Aucune variance détectée.

### References
- [Source: epics.md#Story-6.1-Healthcheck-Endpoint-et-Monitoring] (lignes 911-933) — user story + 4 AC verbatim
- [Source: epics.md#Epic-6-Dashboard-Admin-Opérations-Business] (lignes 902-907) — objectif epic, FR/NFR couverts
- [Source: epics.md] (Story 1.2, AC `GET /api/health` → `{status,timestamp}` HTTP 200) — contrat initial à préserver
- [Source: epics.md] (Additional Requirements / Architecture) — UptimeRobot (gratuit), Pino logging
- [Source: architecture.md#5.3 — Monitoring & Alerting] — Discord webhooks pour l'alerting applicatif (≠ email epics/prd ; canal à trancher en Story 6.4)
- [Source: prd.md] — FR45 (healthcheck), NFR-R5 (`/api/health`), NFR-R1 (uptime ≥99%, ping 5 min), NFR-R4 (alerte <5 min), NFR-S10 (endpoints admin protégés), NFR-I7 (timeout 30s), NFR-R8 (logging), NFR-I1 (taux succès ≥95%)
- [Source: architecture.md#5.2] — PostgreSQL 16 via Lucid, pool {min:2,max:10}, check DB `SELECT 1`
- [Source: architecture.md#3.3] — logging Pino structuré (event-based, niveaux)
- [Source: architecture.md#5.3] — monitoring/alerting (UptimeRobot ; alerting applicatif = Story 6.4)
- [Source: architecture.md — Infrastructure & Deployment] — conflit cible Railway vs VPS (à confirmer)
- [Source: code — `siana-memento-api/start/routes.ts:37-42`, `package.json`, `start/env.ts`, `config/database.ts`, `start/kernel.ts`] — stub existant + stack + env + DB + middleware vérifiés
- [Source: code — `siana-memento-api/railway.toml`] — `healthcheckPath=/api/health`, `healthcheckTimeout=30`, `restartPolicyType=on_failure`, `maxRetries=3`, builder RAILPACK, start `node build/ace …` (cible Railway confirmée ; conflit secret à résoudre)
- [Source: code — `compose.yaml`] — healthcheck `db` (`pg_isready`) présent, **aucun** healthcheck `api` ; API sur PORT 3333
- [Source: code vérifié] — module `@adonisjs/core/health` + `@adonisjs/lucid` `db_check` **installés**
- Recherche tech (2025) : liveness vs readiness, `@adonisjs/core/health` (`DbCheck`), healthcheck Railway = deploy-time only (Host `healthcheck.railway.app`), UptimeRobot free tier, ne jamais appeler de tiers payant dans une sonde

### Cross-story context (Epic 6)
- **6.2** Dashboard métriques + export CSV — `/admin/dashboard`, accès admin protégé 401/403 (NFR-S10).
- **6.3** Logs génération & erreurs IA — `/admin/logs`, Pino JSON (base du taux d'erreur).
- **6.4** Alertes automatiques admin — **c'est ici** que vit l'alerting applicatif (<5 min ; canal email vs Discord à trancher à la création de la 6.4) ; pas dans la 6.1.
- **6.5** Renvoi manuel + backups DB (quotidien, rétention 30j).
- **6.6** CRUD testimonials admin.
- **6.7** Survey satisfaction post-achat (cron idempotent).
[Source: epics.md lignes 937-1085]

### Dependencies
- Story 1.1 (scaffold AdonisJS 6 + PostgreSQL) — ✅ done.
- Story 1.2 (stub `/api/health` + provisionnement DB/Cloudinary/Resend) — ✅ done.
- Compte UptimeRobot à configurer (Aldo) pour le ping externe + alerte email.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Claude Opus 4.8, 1M context)

### Debug Log References

- `node ace test` → **154 passed (154)** ; `node ace test --files="health"` → **10 passed (10)** (7 endpoint + 3 service).
- `npm run typecheck` (tsc --noEmit) → OK.
- Lint des fichiers de la story → propre.
- ⚠️ `npm run lint` global remonte **2 erreurs prettier préexistantes** dans `app/controllers/designs_controller.ts:254` et `tests/functional/designs/generate.spec.ts:21` — **hors scope 6.1** (fichiers non touchés par cette story), non corrigées délibérément.
- Stack de test : Postgres via Docker compose (`siana_db`, port 5435), migrations à jour.

### Completion Notes List

- ✅ **AC#1** — `GET /api/health` (avec secret, DB up) → **200** `{ status:"ok", timestamp, components:{database,cloudinary,resend} }`. Testé.
- ✅ **AC#2** — un composant `down` → **503** + détail du composant fautif. Testé via `app.container.swap(HealthService)`.
- ✅ **AC#4** — `/api/health` protégé par `MONITORING_SECRET` via **header `x-monitoring-secret` uniquement**, comparé en temps constant → `401` sinon. Testé (sans secret, secret invalide, secret en query rejeté). Aucune fuite d'info sensible.
- 🟡 **AC#3** — l'endpoint est **prêt pour UptimeRobot** (pingable, protégé, 200/503). La **création du monitor UptimeRobot** (ping 5 min → email après 2 échecs) est une **action ops hors-code à réaliser par Aldo** (compte UptimeRobot requis) — voir Task 6, sous-tâche restante. Le code n'a aucun moyen de provisionner ce monitor.
- **Architecture readiness/liveness** (décision Aldo) : `/api/health` (readiness détaillée + secret, cible UptimeRobot) et `/api/health/live` (liveness publique légère, cible healthcheck Railway/Docker). `railway.toml` `healthcheckPath` repointé sur `/api/health/live` pour ne pas casser les déploiements avec le 401.
- **Corrections post-review (rapport `_bmad-output/code-review-6-1.md`)** :
  - **M1 (Medium)** — Cloudinary/Resend passent de « présence de config » (tautologique, jamais `down`) à de **vrais pings légers** (`cloudinary.api.ping()` / `resend.domains.list()`), timeout 3s, **cache succès 60s**. AC#1/#2 sont désormais réellement effectifs pour les 3 composants. Tests dédiés ajoutés (`health_service.spec.ts`).
  - **L1 (Low sécu)** — secret accepté **en header uniquement** (plus en query) → plus de risque de fuite dans les access logs. Test : secret en query → 401.
  - **L2 (Low sécu)** — comparaison du secret en **temps constant** (`crypto.timingSafeEqual`).
  - N1/N2 (nits) : rendus caducs par la réécriture du service (plus de `Promise.resolve` superflu ; les pings ont leur propre `withTimeout`).
- **Canal d'alerte applicatif (email vs Discord)** : non traité ici (relève de la Story 6.4), conformément à la décision d'Aldo de trancher plus tard.

### File List

**NEW**
- `siana-memento-api/app/controllers/health_controller.ts`
- `siana-memento-api/app/services/health_service.ts`
- `siana-memento-api/tests/functional/health/health.spec.ts`
- `siana-memento-api/tests/functional/health/health_service.spec.ts`

**UPDATE**
- `siana-memento-api/start/routes.ts` (route inline → controller + ajout route liveness)
- `siana-memento-api/start/env.ts` (+ `MONITORING_SECRET`)
- `siana-memento-api/.env` (+ `MONITORING_SECRET`, local)
- `siana-memento-api/.env.example` (+ `MONITORING_SECRET`)
- `siana-memento-api/railway.toml` (`healthcheckPath` → `/api/health/live`)
- `compose.yaml` (healthcheck service `api` → `/api/health/live`)

## Change Log

| Date | Version | Description | Auteur |
|------|---------|-------------|--------|
| 2026-05-31 | 0.1 | Implémentation Story 6.1 — endpoint healthcheck readiness/liveness, secret monitoring, tests Japa, repointage railway.toml + healthcheck compose. Reste : création du monitor UptimeRobot (ops Aldo). | Amelia (dev-story) |
| 2026-05-31 | 0.2 | Corrections post-review (M1 : vrais pings Cloudinary/Resend + cache 60s ; L1 : secret header-only ; L2 : `timingSafeEqual`). +1 spec service. 154/154 tests verts. | Amelia (dev-story) |

## Senior Developer Review (AI)

**Date :** 2026-05-31 · **Rapport complet :** `_bmad-output/code-review-6-1.md`
**Recommandation :** 🟢 APPROUVÉ avec changements mineurs — 0 Critical, 0 High, 1 Medium, 2 Low, 2 Nits.
**Note d'intégrité du reviewer :** une 1ʳᵉ passe avait halluciné des findings (import `#config/cloudinary` cassé, dépendance absente) — annulés après lecture du code réel.

### Action Items

- [x] **[M1 · Medium]** Checks Cloudinary/Resend tautologiques (présence de config → jamais `down`) → remplacés par de vrais pings légers + cache 60s. (`health_service.ts`)
- [x] **[L1 · Low/sécu]** Secret acceptable en query string (fuite logs) → header-only. (`health_controller.ts`)
- [x] **[L2 · Low/sécu]** Comparaison de secret non constant-time → `crypto.timingSafeEqual`. (`health_controller.ts`)
- [x] **[N1 · Nit]** `Promise.resolve()` superflu → caduc après réécriture du service.
- [x] **[N2 · Nit]** Promesse DB orpheline au timeout → le pattern `withTimeout` reste, risque nul sur `SELECT 1` ; noté, non bloquant.
- [ ] **[Ops · Aldo]** Créer le monitor UptimeRobot (hors-code) — AC#3.

### Points positifs retenus (review)
Split liveness/readiness = bonne résolution du conflit Railway/secret ; aucun appel Gemini/Stripe ; logging conforme NFR-R8 ; pas de fuite d'info sensible ; contrat rétro-compatible ; tests propres (`withGlobalTransaction`, `container.swap`).

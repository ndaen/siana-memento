---
baseline_commit: 1d1da30
---

<!-- Story 6.8 — générée par create-story (BMad). Contexte-complet pour dev-story. -->

# Story 6.8: Survey de Satisfaction Post-Achat

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que client ayant acheté un design,
je veux recevoir un survey de satisfaction 24h après mon achat,
afin de partager mon expérience et aider Siana Memento à s'améliorer.

## Acceptance Criteria

1. **Given** une commande avec statut `paid` et email livré avec succès **When** 24 heures s'écoulent après la confirmation de paiement **Then** le client reçoit un email avec 3 questions : satisfaction globale (1-5), qualité design (1-5), recommandation (Oui/Non) (FR48).
2. **Given** l'email de survey reçu **When** le client clique pour répondre **Then** il accède à une page simple (sans connexion requise) pour soumettre ses réponses.
3. **Given** les réponses soumises **When** Aldo consulte le dashboard **Then** il voit le score de satisfaction moyen et la distribution des réponses.
4. **Given** le cron job de survey **When** il s'exécute **Then** il n'envoie pas de survey aux commandes déjà enquêtées (idempotent — colonne `survey_sent_at`).

[Source: epics.md#Story-6.8 L1095-1118 — user story + 4 AC verbatim ; prd.md FR48]

## 🔑 Décisions structurantes (lire avant de coder)

### D1 — Mécanisme d'envoi = **commande Ace `survey:send` planifiée par cron Railway** (PAS un endpoint, PAS un scheduler in-process)
Le repo n'a **aucun scheduler in-process** (pas de `@adonisjs/scheduler` ni `node-cron`). Le précédent établi (Stories 3.8 `cleanup:rgpd`, 6.5 `alerts:check`) est une **commande Ace** lancée par un **service cron Railway dédié**. **L'infra est DÉJÀ prévue** : un service cron Railway nommé `survey:send` est planifié (config `siana-memento-api/railway.cron.toml`, `0 * * * *` = horaire). La commande Ace doit donc **impérativement** s'appeler `survey:send` (cohérent avec `alerts:check` / `cleanup:rgpd`), fichier `commands/send_survey.ts`, pattern **exact** de `commands/cleanup_rgpd.ts` (`static commandName`, `static options = { startApp: true }`, log Pino de synthèse). La cadence horaire est opérationnelle (dashboard Railway, hors périmètre code de la story). [Source: commands/cleanup_rgpd.ts ; commands/check_alerts.ts ; railway.cron.toml ; memory/project_railway_crons.md]

### D2 — Canal = **EMAIL via Resend** (instance existante, NE PAS dupliquer)
L'AC#1 dit « email ». Resend est déjà câblé dans `app/services/email_service.ts` (instance `const resend = new Resend(env.get('RESEND_API_KEY'))`, `from = env.get('RESEND_FROM_EMAIL')`). On **étend** ce module avec `sendSurveyInvite(order, user, design)` (et un builder HTML `buildSurveyHtml`), sur le modèle exact de `sendDesignDelivery` / `sendAdminAlert` : try/catch, **ne throw jamais**, retourne `{ success, resendId? }`, log Pino `survey_email_sent` / `survey_email_failed`. Aucune 2ᵉ instance Resend. [Source: email_service.ts:1-9,62-131,165-208]

### D3 — Idempotence = **colonne `orders.survey_sent_at`** (timestamp nullable), set au moment de l'envoi
AC#4 nomme explicitement la colonne `survey_sent_at`. Migration d'**altération** de `orders` (NE PAS réécrire la migration de création). La commande ne sélectionne que les commandes **éligibles** : `status = 'paid'` ET `email_sent_at IS NOT NULL` (email livré — AC#1) ET `survey_sent_at IS NULL` ET `paid_at <= now - 24h`. Après envoi **réussi**, set `survey_sent_at = now()` → la commande n'est plus jamais re-sélectionnée. **Sur échec d'envoi**, on **laisse `survey_sent_at` NULL** → réessai au run horaire suivant (récupérable, comme la philosophie `email_failed` de 6.6). [Source: epics.md#Story-6.8 L1117 ; order.ts:30-34 ; 6-6-...md (philosophie récupérable)]

### D4 — Stockage des réponses = **nouvelle table `survey_responses`** + modèle `SurveyResponse` (1 réponse / commande)
3 questions (FR48) : `overall_satisfaction` (smallint 1-5), `design_quality` (smallint 1-5), `would_recommend` (boolean). Clé étrangère `order_id` **UNIQUE** (une seule réponse par commande — la 2ᵉ soumission est rejetée ou écrase, cf. D6). Snake_case en base (`survey_responses`, `order_id`, `overall_satisfaction`, `design_quality`, `would_recommend`, `submitted_at`/timestamps). Modèle Lucid sur le pattern de `app/models/alert_state.ts` / `order.ts` (`@column`, `@column.dateTime`, `belongsTo(() => Order)`). [Source: epics.md#Story-6.8 ; prd.md FR48 ; alert_state.ts ; order.ts]

### D5 — Accès à la page de réponse = **token opaque par commande, page PUBLIQUE sans auth**
AC#2 : « page simple sans connexion requise ». Le lien email doit identifier la commande **sans** exposer l'id séquentiel ni exiger de login. → Ajouter `orders.survey_token` (varchar UNIQUE, `randomBytes(32).toString('hex')` = 64 hex, généré au moment de l'envoi du survey — même format que `designs.session_token`). L'email contient `${APP_URL}/survey/{survey_token}`. La route API de soumission est **publique** (hors groupe `/api/admin`, hors `middleware.auth()`), elle résout la commande **par token** (404 si inconnu), pas par id. Pas de fuite : un token aléatoire 256 bits n'est pas devinable. [Source: order_validator.ts (pattern sessionToken 64 hex) ; routes.ts:46-78 (routes publiques `silentAuth`) ; factories.ts (randomBytes(32).toString('hex'))]

### D6 — Anti double-soumission & validation
La page est publique → durcir : (a) `survey_token` invalide/inconnu → 404 ; (b) commande déjà répondue (`survey_responses` existe pour cet `order_id`) → 409 (ou page « déjà répondu, merci ») ; (c) validation VineJS stricte : `overallSatisfaction`/`designQuality` entiers **1..5**, `wouldRecommend` booléen, `surveyToken` 64 hex (réutiliser le pattern du `createOrderValidator`). Rate-limit léger sur la route publique de soumission (réutiliser `limiter.define` comme `ordersThrottle`) pour éviter l'abus. [Source: order_validator.ts ; routes.ts:22-37,68]

### D7 — Dashboard admin = **agrégat lu côté `MetricsService` ou `SurveyService` + carte dans le dashboard existant**
AC#3 : « score de satisfaction moyen et distribution ». Calcul SQL agrégé (centimes-free : ce sont des notes) : `AVG(overall_satisfaction)`, `AVG(design_quality)`, distribution `COUNT(*) FILTER (WHERE overall_satisfaction = n)` pour n∈1..5, taux de recommandation `AVG(would_recommend::int)`, nombre total de réponses. Exposé via `GET /api/admin/survey` (groupe `/api/admin` existant, déjà protégé `auth()+admin()`) et affiché sur **le dashboard admin existant** (`/admin/dashboard`, composant `AdminDashboard`) sous forme de carte « Satisfaction client ». Règle **N/A jamais 0** (héritée 6.2) : si `0` réponse → afficher « N/A », pas `0`. [Source: metrics_service.ts:52-103 (FILTER agrégat) ; admin_controller.ts:43-49 ; AdminDashboard.tsx ; routes.ts:82-91]

## Tasks / Subtasks

### A. Backend — Migration `orders` (survey_sent_at + survey_token) (AC: #1, #2, #4)

- [ ] Créer une migration d'**altération** `*_add_survey_fields_to_orders.ts` (NE PAS réécrire `1772800000000_create_orders_table.ts`) :
  - [ ] `survey_sent_at` timestamp **nullable** (idempotence, D3).
  - [ ] `survey_token` varchar(64) **nullable + UNIQUE** (lien public, D5).
  - [ ] `down()` : drop les deux colonnes (réversible, pas de contrainte bloquante).
- [ ] Mettre à jour `app/models/order.ts` : `@column.dateTime() declare surveySentAt: DateTime | null` et `@column() declare surveyToken: string | null` (camelCase modèle ↔ snake_case colonne via naming strategy par défaut). Ajouter la relation `@hasOne(() => SurveyResponse)` (voir tâche B).
- [ ] ⚠️ Vérifier la convention de nommage timestamp-prefix des migrations existantes avant d'écrire.

### B. Backend — Migration + modèle `survey_responses` (AC: #3)

- [ ] Créer une migration `*_create_survey_responses_table.ts` (pattern `create_alert_states_table` / `create_orders_table`) :
  - [ ] `id` PK, `order_id` integer **NOT NULL + UNIQUE** (FK → `orders.id`, `onDelete('CASCADE')`), `overall_satisfaction` smallint NOT NULL, `design_quality` smallint NOT NULL, `would_recommend` boolean NOT NULL, `submitted_at` timestamp, timestamps standard.
  - [ ] Index/contrainte UNIQUE sur `order_id` (1 réponse / commande, D4/D6).
- [ ] Créer `app/models/survey_response.ts` (`BaseModel`, conventions de `order.ts` : `@column`, `@column.dateTime`, `belongsTo(() => Order)`).
- [ ] ⚠️ `overallSatisfaction`/`designQuality` typés `number`, `wouldRecommend` typé `boolean`.

### C. Backend — Validator de soumission (AC: #2)

- [ ] Créer `app/validators/survey_validator.ts` (VineJS, pattern `order_validator.ts`) :
  - [ ] `surveyToken` : `vine.string().fixedLength(64).regex(/^[a-f0-9]{64}$/)` (ou validé via le param de route).
  - [ ] `overallSatisfaction` : `vine.number().min(1).max(5)` (+ entier).
  - [ ] `designQuality` : `vine.number().min(1).max(5)` (+ entier).
  - [ ] `wouldRecommend` : `vine.boolean()`.

### D. Backend — `SurveyService` (envoi + soumission + agrégat) (AC: #1, #3, #4)

- [ ] Créer `app/services/survey_service.ts` (classe `@inject()`, conventions de `metrics_service.ts` / `orders_admin_service.ts` — `DateTime.now().minus(...).toUTC().toSQL({ includeOffset: false })` pour borner la fenêtre 24h, agrégats SQL avec `FILTER`).
- [ ] **`listOrdersDueForSurvey()`** (AC#1/#4, D3) : `Order.query().where('status','paid').whereNotNull('emailSentAt').whereNull('surveySentAt').where('paidAt','<=', now-24h).preload('user').preload('design')`. Retourne les commandes éligibles. ⚠️ borner aussi par une fenêtre haute raisonnable (ex. `paid_at >= now - 30j`) pour éviter d'enquêter rétroactivement tout l'historique au 1er run (décision : **n'enquêter que les commandes payées depuis ≤30j ET ≥24h** — éviter un flood rétroactif). Documenter ce choix.
- [ ] **`markSurveySent(order, token)`** : set `order.surveyToken = token`, `order.surveySentAt = DateTime.now()`, save. Appelé **après** envoi réussi.
- [ ] **`submitResponse({ surveyToken, overallSatisfaction, designQuality, wouldRecommend })`** (AC#2) : résoudre `Order.findBy('surveyToken', token)` → 404 si absent ; si une `SurveyResponse` existe déjà pour `order.id` → `{ ok:false, code:'ALREADY_SUBMITTED' }` (409, D6) ; sinon créer la `SurveyResponse` (+ `submittedAt = now`). Retourne un résultat uniforme `{ ok, code?, ... }` (pattern `orders_admin_service.resendDelivery`).
- [ ] **`getSurveyStats()`** (AC#3, D7) : agrégat SQL — `count` réponses, `AVG(overall_satisfaction)`, `AVG(design_quality)`, distribution 1..5 via `COUNT(*) FILTER (WHERE overall_satisfaction = n)`, `recommendRate = AVG(would_recommend::int)`. Règle **N/A jamais 0** : `count === 0` → moyennes `null`. Argent N/A : aucune (notes, pas de centimes).

### E. Backend — Commande `survey:send` + dédup (AC: #1, #4)

- [ ] Créer `commands/send_survey.ts` (`BaseCommand`, `static commandName = 'survey:send'`, `static description`, `static options = { startApp: true }` — pattern **exact** de `commands/cleanup_rgpd.ts` / `commands/check_alerts.ts`).
  - [ ] ⚠️ NE PAS utiliser la séquence `*/` dans un commentaire JSDoc (bug `node ace list` rencontré en 6.5 : `*/5` ferme le bloc). Écrire les crons en ligne `#` ou reformulés.
- [ ] Dans `run()` : résoudre `SurveyService` (via `app.container.make(SurveyService)`), récupérer `listOrdersDueForSurvey()`. Pour chaque commande :
  - [ ] générer un `surveyToken` (`randomBytes(32).toString('hex')`), construire l'URL `${APP_URL}/survey/{token}`, appeler `sendSurveyInvite(order, user, design, url)` ;
  - [ ] **sur succès** → `markSurveySent(order, token)` (idempotence D3) + `sent++` ;
  - [ ] **sur échec / skip** (`{success:false}`) → **NE PAS** marquer `survey_sent_at` (réessai au prochain run) + `failed++`/`skipped++` ;
  - [ ] **try/catch par commande** : un échec n'interrompt pas les autres (pattern `cleanup_rgpd`).
- [ ] Log de synthèse `logger.info({ event:'survey_send_summary', candidates, sent, failed, skipped, durationMs }, '...')` + `this.logger.success(...)` (pattern `rgpd_cleanup_summary`).

### F. Backend — `sendSurveyInvite` (Resend) (AC: #1)

- [ ] Étendre `app/services/email_service.ts` (réutiliser l'instance `resend` — NE PAS dupliquer, D2) :
  - [ ] `buildSurveyHtml(design, surveyUrl)` : HTML inline (pattern `buildDeliveryHtml`, Vert Sauge `#2D4A3E`), un CTA « Donner mon avis (1 min) » → `surveyUrl`, mention des 3 questions, ton chaleureux FR. Personnalisation noms/date comme `buildDeliveryHtml`.
  - [ ] `export async function sendSurveyInvite(order, user, design, surveyUrl): Promise<{ success: boolean; resendId?: string }>` — `to = user.email.trim()`, `from = env.get('RESEND_FROM_EMAIL')`, sujet FR (ex. « Comment s'est passée votre expérience ? — Siana Memento »). **Ne throw jamais** (try/catch), log `survey_email_sent` (succès, avec `resendId`) / `survey_email_failed` (échec). Pas de pièce jointe (≠ delivery).

### G. Backend — Routes (AC: #2, #3)

- [ ] **Routes publiques** dans `start/routes.ts` (HORS groupe `/api/admin`, HORS `middleware.auth()`, D5) :
  - [ ] `GET /api/survey/:token` → `SurveyController.show` : renvoie le contexte minimal pour afficher la page (existence du token + si déjà répondu), 404 si token inconnu. Pas de données sensibles (pas d'email, pas d'id séquentiel — juste de quoi rendre le formulaire / l'état « déjà répondu »).
  - [ ] `POST /api/survey/:token` → `SurveyController.submit` : valide (validator D/C), enregistre la réponse, 201/200 ; 404 token inconnu ; 409 déjà répondu. Throttle léger (`limiter.define('survey', ...)`).
- [ ] **Route admin** dans le groupe `/api/admin` existant (déjà `auth()+admin()`) :
  - [ ] `GET /api/admin/survey` → `AdminController.survey` : retourne `getSurveyStats()`. Log Pino `admin_survey_view` (pattern `admin_metrics_view`).
- [ ] Créer `app/controllers/survey_controller.ts` (public) ; étendre `app/controllers/admin_controller.ts` (méthode `survey`, injecter `SurveyService`).

### H. Frontend — Page publique de réponse `/survey/[token]` (AC: #2)

- [ ] Créer la route `src/app/survey/[token]/page.tsx` (route **publique**, hors `(auth)` et hors `admin`) + composant client `SurveySurvey`/`SurveyForm` dans `src/components/siana/`.
  - [ ] `metadata` `robots: { index: false, follow: false }` (page transactionnelle, pas indexable).
  - [ ] Au montage : `GET /api/survey/{token}` → si 404 : message « lien invalide ou expiré » ; si déjà répondu : état « merci, déjà répondu » ; sinon afficher le formulaire.
  - [ ] Formulaire 3 questions : satisfaction globale (1-5, radios/étoiles), qualité design (1-5), recommandation (Oui/Non). Controlled React state. Soumission `POST /api/survey/{token}` (PAS de `credentials:'include'` requis — public, mais inoffensif).
  - [ ] Succès → état de remerciement inline (la page change significativement → success inline, cf. conventions CLAUDE.md). Erreur serveur/réseau → `toast.error()` (sonner). Erreurs de champ (note manquante) → inline `<p>` + `aria-describedby`.
  - [ ] A11y : labels (`sr-only` si visuellement implicites), navigation clavier, contraste ≥4.5:1, Vert Sauge `#2D4A3E`. Réutiliser `components/ui/*` (button, radio-group/label si présents — sinon radios natifs accessibles).
- [ ] **API client** : créer `src/lib/api/survey.ts` (`getSurvey(token)`, `submitSurvey(token, payload)`) sur le style de `src/lib/api/admin.ts` (try/catch, retour discriminé `{success}` / `{success:false, errorCode, message}`).

### I. Frontend — Carte « Satisfaction » sur le dashboard admin (AC: #3)

- [ ] Étendre `src/lib/api/admin.ts` : `getAdminSurvey()` (GET `/api/admin/survey`, `credentials:'include'`, retour discriminé) + types `SurveyStats` (moyennes nullable, distribution 1..5, `recommendRate` nullable, `count`).
- [ ] Étendre `src/components/siana/AdminDashboard.tsx` : ajouter une carte « Satisfaction client » — score moyen global (sur 5), score qualité design, taux de recommandation (%), petit histogramme de distribution 1..5, nombre de réponses. **N/A jamais 0** si `count === 0` (cohérent 6.2). Pas de nouvelle page (réutilise le dashboard existant).

### J. Backend — Config env (AC: #1, #2)

- [ ] Vérifier/ajouter `APP_URL` (ou équivalent base URL frontend déjà présent) dans `start/env.ts` pour construire le lien `/survey/{token}` dans l'email. Chercher une var existante (`FRONTEND_URL` / `APP_URL` / origine CORS) avant d'en créer une. Si absente : `SURVEY_BASE_URL: Env.schema.string.optional()` avec fallback documenté. Mettre à jour `.env.example`.
- [ ] ⚠️ Pas de magic numbers : fenêtre 24h, rétro-limite 30j = constantes nommées en tête de `SurveyService`, overridables par env si pertinent (`SURVEY_DELAY_HOURS` défaut 24).

### K. Tests (AC: #1, #2, #3, #4)

- [ ] **Backend commande** `tests/functional/commands/send_survey.spec.ts` (pattern **exact** de `cleanup_rgpd.spec.ts` / `check_alerts.spec.ts` : `testUtils.db().withGlobalTransaction()`, `await ace.exec('survey:send', [])`) :
  - [ ] **AC#1/#4** : commande `paid` + `emailSentAt` set + `paidAt = now-25h` + `surveySentAt = null` → après exécution, `survey_sent_at` est set ET `survey_token` généré (preuve d'envoi ; Resend court-circuité en test, cf. garde ci-dessous). Cas négatifs : `paidAt = now-1h` (trop récent) → pas envoyé ; `surveySentAt` déjà set → **pas** ré-envoyé (idempotence D3) ; `status != paid` ou `emailSentAt null` → pas envoyé.
  - [ ] **Idempotence (AC#4)** : 2 exécutions consécutives → `survey_sent_at` inchangé au 2ᵉ run, une seule génération de token.
- [ ] **Backend soumission** `tests/functional/survey/submit.spec.ts` (HTTP, pattern des specs `tests/functional/orders/*` / `admin/orders.spec.ts`) :
  - [ ] `POST /api/survey/:token` valide → crée `SurveyResponse` (200/201) ; token inconnu → 404 ; 2ᵉ soumission même token → 409 (D6) ; payload invalide (note 6, note manquante, recommandation non-bool) → 422.
  - [ ] `GET /api/survey/:token` : token connu non répondu → état formulaire ; token inconnu → 404 ; déjà répondu → état « déjà répondu ».
- [ ] **Backend admin stats** `tests/functional/admin/survey.spec.ts` : non-admin → 403 ; `GET /api/admin/survey` agrège correctement moyennes + distribution ; **0 réponse → N/A (null), pas 0**. ⚠️ **Tests en deltas** (base dev partagée — découverte 6.2/6.4) : créer les réponses dans la transaction et asserter sur l'agrégat de ces lignes, pas sur des totaux globaux.
- [ ] **Garde test Resend** : court-circuiter l'appel réseau Resend en test (option A : pas de `RESEND_API_KEY` réel / Resend no-op comme `delivery_email.spec.ts` ; option B : asserter le **déclenchement via `survey_sent_at`/`survey_token`**, pas via l'email — privilégier). Aligner sur le comportement réseau réel des tests existants (`delivery_email.spec.ts` n'envoie pas réellement).
- [ ] **E2E Playwright** (`e2e/survey.spec.ts`, pattern `e2e/admin-orders.spec.ts`) : visiter `/survey/{token}` (API mockée), remplir les 3 questions, soumettre, voir le remerciement ; token invalide → message d'erreur. (+ optionnel : carte satisfaction visible sur `/admin/dashboard`.)
- [ ] Factory test : étendre `createPaidOrderWithDesign` (ou un helper `createSurveyResponse`) dans `tests/helpers/factories.ts` pour `surveySentAt`/`surveyToken` (additif).
- [ ] Lancer `npm run typecheck` (exit 0), `node ace test` (suite verte hors flakes connus : `cleanup:rgpd` intermittent, `home hero` e2e préexistant) ; web `tsc --noEmit` + `eslint` sur les fichiers de la story (exit 0).

## Dev Notes

### Contexte & périmètre

Story 6.8 = dernière story d'Epic 6, **full-stack** mais découplée des couches `Generation`/alertes : elle s'appuie sur le domaine **Orders + email** (Epic 4/5/6.6) déjà livré. Trois blocs : (1) **envoi** d'un email de survey 24h après paiement via une commande Ace `survey:send` (cron Railway horaire **déjà provisionné** côté infra) ; (2) **collecte** des réponses via une page publique sans auth (`/survey/{token}`) + endpoints publics ; (3) **restitution** du score moyen + distribution sur le dashboard admin existant. Idempotence garantie par `orders.survey_sent_at`. [Source: epics.md#Story-6.8 ; sprint-status.yaml epic-6]

L'infra réutilisable existe : Resend câblé (`email_service.ts`, 3 emails déjà en place — delivery + alertes), pattern commande Ace + cron Railway (`cleanup_rgpd` 3.8, `check_alerts` 6.5), groupe admin protégé (`/api/admin` + `auth()+admin()`), dashboard admin (`AdminDashboard`), patterns service/centimes/agrégat (`metrics_service`, `orders_admin_service`).

### 🔑 Infra cron — `survey:send` déjà prévu (ne pas en créer un nouveau nom)

- Trois services cron Railway dédiés tournent déjà : `node build/ace alerts:check` (`*/5 * * * *`), `node build/ace cleanup:rgpd` (`0 3 * * *`), et **`node build/ace survey:send` (`0 * * * *`) — service planifié, commande Ace à créer dans cette story**. Le nom de commande **doit** être `survey:send` pour matcher le service Railway. [Source: memory/project_railway_crons.md ; railway.cron.toml]
- Setup cron (dashboard, hors git) : chaque service cron pointe `Settings → Config File = railway.cron.toml` (config SANS `[deploy]`, healthcheck vide), reçoit les 19 vars d'env requises par `start/env.ts` en Shared Variables, et `DATABASE_URL = ${{Postgres.DATABASE_PUBLIC_URL}}` (URL **publique**). À acter dans le résumé de complétion : confirmer/activer le service `survey:send` en prod (sinon l'AC#1 n'est pas réellement déclenché). [Source: memory/project_railway_crons.md ; railway.cron.toml]
- Cadence **horaire** (`0 * * * *`) suffit pour « ~24h après paiement » (granularité ±1h acceptable pour un survey, vs 5 min pour les alertes). La commande filtre `paid_at <= now-24h` → un délai de quelques heures est sans conséquence fonctionnelle.

### 🔑 Idempotence & récupérabilité (D3)

- Sélection : `status='paid'` ET `email_sent_at IS NOT NULL` ET `survey_sent_at IS NULL` ET `paid_at <= now-24h` (et `paid_at >= now-30j` anti-flood rétroactif au 1er run).
- `survey_sent_at` set **uniquement après envoi réussi** → un échec Resend laisse la commande éligible au run suivant (récupérable). C'est la même philosophie que `email_failed` en 6.6 (jamais de perte, état réessayable).

### État du code backend (vérifié)

- **`orders`** : `status: 'pending'|'paid'|'failed'|'email_failed'`, `amount` (centimes), `paidAt`, `emailSentAt`, relations `belongsTo(User)`/`belongsTo(Design)`. Manque `survey_sent_at`, `survey_token`. [Source: app/models/order.ts:7-47]
- **Resend câblé** : `email_service.ts` — instance `resend`, `sendDesignDelivery` (pièce jointe PNG HR, ne throw jamais, log `delivery_email_*`), `sendAdminAlert` + `buildAlertHtml` (ne throw jamais, log `admin_alert_*`). **Réutiliser ce module** pour `sendSurveyInvite` + `buildSurveyHtml`. `from = env.get('RESEND_FROM_EMAIL')`. [Source: email_service.ts:1-9,62-131,137-208]
- **Commande Ace = précédent cron** : `commands/cleanup_rgpd.ts` (`BaseCommand`, `commandName='cleanup:rgpd'`, `options={startApp:true}`, `durationMs` via `Date.now()`, log structuré par item + synthèse, continue malgré erreurs) ; `commands/check_alerts.ts` (résout un service `@inject()` via container, compteurs `sent/skipped/failed`). **Modèles exacts pour `send_survey.ts`.** ⚠️ piège `*/` en commentaire (6.5). [Source: cleanup_rgpd.ts ; check_alerts.ts]
- **`metrics_service.ts`** : agrégats `db.raw('COUNT(*) FILTER (WHERE ...)')`, `sinceSql()` = `DateTime.now().minus({...}).toUTC().toSQL({includeOffset:false})`, règle **N/A jamais 0** (avgApiCost/conversion `null` si dénominateur 0). **Réutiliser ces patterns** pour `getSurveyStats` (distribution via FILTER). [Source: metrics_service.ts:46-103]
- **`orders_admin_service.ts`** : service `@inject()` retournant des résultats uniformes `{ ok, code?, ... }` (`resendDelivery` → `NOT_FOUND`/`INVALID_STATUS`), mappés en HTTP par le controller (404/409/502). **Modèle pour `submitResponse`.** [Source: orders_admin_service.ts ; admin_controller.ts:154-194]
- **`admin_controller.ts`** : `@inject()`, chaque méthode `auth.getUserOrFail()` + log Pino d'event, `response.ok({success, data})`. Pattern pour `survey()`. [Source: admin_controller.ts:31-148]
- **Routes** : routes publiques sans auth déjà présentes (`/api/upload/sign`, `/api/webhooks/stripe`, `/api/health/*`) ; groupe `/api/admin` protégé `auth()+admin()` ; `limiter.define(...)` pour throttle (ex. `ordersThrottle`). **Ajouter `/api/survey/:token` (public, throttlé) + `/api/admin/survey` (dans le groupe).** [Source: routes.ts:22-37,42-91]
- **Validator** : `order_validator.ts` montre le pattern `vine.string().fixedLength(64).regex(/^[a-f0-9]{64}$/)` pour un token — réutiliser pour `surveyToken`. [Source: order_validator.ts]
- **`alert_state.ts`** : modèle Lucid minimal (`@column`, `@column.dateTime`) — gabarit pour `survey_response.ts`. [Source: app/models/alert_state.ts]
- **`env.ts`** : structure commentée par bloc ; `RESEND_FROM_EMAIL` requis. Ajouter un bloc « survey de satisfaction » si besoin (base URL frontend + `SURVEY_DELAY_HOURS` optionnel). Vérifier d'abord une var d'URL frontend existante. [Source: env.ts:73-79,82-118]

### État du code frontend (vérifié)

- **Routes** : `(auth)` (login/register), `(public)` (generate/privacy), `admin/*` (dashboard/logs/orders/testimonials), `orders`. **Aucune route `survey`** → créer `src/app/survey/[token]/page.tsx` (publique, hors groupes protégés). [Source: arborescence src/app]
- **`AdminDashboard.tsx`** : composant client du dashboard admin (cartes métriques) — **ajouter une carte « Satisfaction »** (pas de nouvelle page). [Source: components/siana/AdminDashboard.tsx]
- **`src/lib/api/admin.ts`** : pattern fetch discriminé (`getAdminMetrics`/`getAdminLogs`/`getAdminOrders`, `credentials:'include'`, retour `{success}` | `{success:false, errorCode, message}`). **Ajouter `getAdminSurvey`** ; créer `src/lib/api/survey.ts` sur le même style pour les endpoints publics. [Source: src/lib/api/admin.ts]
- **`components/ui/*`** : `table.tsx`, `button.tsx`, `sheet.tsx`, etc. déjà présents (shadcn copié). Réutiliser pour le formulaire (radios/labels accessibles). Toaster monté globalement dans `layout.tsx`. [Source: arborescence components/ui ; CLAUDE.md conventions toasts/forms]

### Garde-fous anti-erreurs

- ❌ NE PAS nommer la commande autrement que `survey:send` (le service cron Railway l'attend). [D1]
- ❌ NE PAS écrire un scheduler in-process ni un endpoint « trigger » HTTP pour l'envoi — c'est la commande Ace `survey:send` planifiée par cron Railway. [D1]
- ❌ NE PAS dupliquer l'instance Resend — étendre `email_service.ts`. [D2]
- ❌ NE PAS réécrire la migration de création d'`orders` — migration d'altération additive pour `survey_sent_at`/`survey_token`. [A]
- ❌ NE PAS exposer la page de réponse derrière l'auth — elle est **publique**, résolue **par token opaque** (pas par id séquentiel). [D5]
- ❌ NE PAS set `survey_sent_at` si l'envoi a échoué (sinon perte du réessai). [D3]
- ❌ NE PAS enquêter rétroactivement tout l'historique au 1er run — borner `paid_at >= now-30j`. [D-listOrdersDueForSurvey]
- ❌ NE PAS autoriser une 2ᵉ réponse pour la même commande (`order_id` UNIQUE → 409). [D6]
- ❌ NE PAS afficher `0` quand aucune réponse — **N/A** (règle 6.2). [D7]
- ❌ NE PAS taper Resend dans les tests — asserter le déclenchement via `survey_sent_at`/`survey_token`. [K]
- ❌ Pas de magic numbers (24h, 30j, 5 notes) — constantes nommées. [J]

### ⚠️ Impact cross-story (à signaler, pas une régression)

- **Dépend d'Epic 4/6.6** : la sélection s'appuie sur `orders.status='paid'` + `email_sent_at` (livraison) posés par le webhook Stripe (4.1/4.2) et la logique `email_failed` (6.6). Une commande `email_failed` (jamais livrée) n'est **pas** enquêtée tant que l'email n'est pas renvoyé — comportement voulu (on n'enquête que les clients réellement servis). [Source: stripe_service.ts ; 6-6-...md]
- **`orders.created_at` indexé `(created_at, status)`** (migration `1775900000100`) — la sélection survey filtre surtout sur `paid_at`/`survey_sent_at` (non indexés). Volume MVP faible → acceptable ; noter l'index `(survey_sent_at)` partiel comme dette si volume grossit. [Source: migrations ; deferred-work.md]

### Project Structure Notes

- **NEW backend** :
  - `siana-memento-api/database/migrations/<ts>_add_survey_fields_to_orders.ts` (survey_sent_at + survey_token)
  - `siana-memento-api/database/migrations/<ts>_create_survey_responses_table.ts`
  - `siana-memento-api/app/models/survey_response.ts`
  - `siana-memento-api/app/services/survey_service.ts` (envoi/soumission/agrégat)
  - `siana-memento-api/app/validators/survey_validator.ts`
  - `siana-memento-api/app/controllers/survey_controller.ts` (public : show + submit)
  - `siana-memento-api/commands/send_survey.ts` (commande `survey:send`)
  - `siana-memento-api/tests/functional/commands/send_survey.spec.ts`
  - `siana-memento-api/tests/functional/survey/submit.spec.ts`
  - `siana-memento-api/tests/functional/admin/survey.spec.ts`
- **UPDATE backend** :
  - `siana-memento-api/app/models/order.ts` (surveySentAt, surveyToken, hasOne SurveyResponse)
  - `siana-memento-api/app/services/email_service.ts` (sendSurveyInvite + buildSurveyHtml — réutilise l'instance resend)
  - `siana-memento-api/app/controllers/admin_controller.ts` (méthode survey + inject SurveyService)
  - `siana-memento-api/start/routes.ts` (routes publiques /api/survey/:token + /api/admin/survey)
  - `siana-memento-api/start/env.ts` (base URL frontend + SURVEY_DELAY_HOURS optionnel)
  - `siana-memento-api/.env.example`
  - `siana-memento-api/tests/helpers/factories.ts` (surveySentAt/surveyToken + createSurveyResponse — additif)
- **NEW frontend** :
  - `siana-memento-web/src/app/survey/[token]/page.tsx` (page publique, noindex)
  - `siana-memento-web/src/components/siana/SurveyForm.tsx` (formulaire client 3 questions)
  - `siana-memento-web/src/lib/api/survey.ts` (getSurvey + submitSurvey)
  - `siana-memento-web/e2e/survey.spec.ts`
- **UPDATE frontend** :
  - `siana-memento-web/src/lib/api/admin.ts` (getAdminSurvey + types SurveyStats)
  - `siana-memento-web/src/components/siana/AdminDashboard.tsx` (carte « Satisfaction client »)
- **READ-FOR-CONTEXT** : `email_service.ts`, `commands/cleanup_rgpd.ts` + son test, `commands/check_alerts.ts`, `metrics_service.ts`, `orders_admin_service.ts`, `admin_controller.ts`, `order_validator.ts`, `app/models/alert_state.ts`, `tests/helpers/factories.ts`, `src/lib/api/admin.ts`, `src/components/siana/AdminDashboard.tsx`, `e2e/admin-orders.spec.ts`.
- **NE PAS TOUCHER** : `database/migrations/1772800000000_create_orders_table.ts` (création — utiliser une migration d'altération) ; le pipeline de génération ; les autres endpoints `/api/admin` ; `metrics_service` (on s'en inspire, on ne le modifie pas, sauf si la carte satisfaction y est branchée — préférer un `SurveyService` dédié).

### Cadence d'exécution (opérationnel, hors code de la story)

`survey:send` tourne **`0 * * * *`** (horaire) via le service cron Railway **déjà provisionné**. À acter dans le résumé de complétion : confirmer que le service cron `survey:send` est actif en prod (Config File = `railway.cron.toml`, vars d'env partagées, `DATABASE_PUBLIC_URL`). [Source: memory/project_railway_crons.md ; railway.cron.toml]

### References

- [Source: epics.md#Story-6.8] (L1095-1118) — user story + 4 AC verbatim (FR48)
- [Source: epics.md#Epic-6] — objectif epic (monitoring/admin) ; FR48 (survey 3 questions)
- [Source: prd.md] — FR48 (survey satisfaction post-achat : satisfaction globale 1-5, qualité design 1-5, recommandation Oui/Non)
- [Source: code vérifié — backend] — `email_service.ts` (Resend, sendDesignDelivery/sendAdminAlert), `commands/cleanup_rgpd.ts` + son test + `check_alerts.ts` (pattern commande/cron), `metrics_service.ts` (FILTER agrégat, sinceSql, N/A jamais 0), `orders_admin_service.ts` (résultat uniforme `{ok,code}`), `admin_controller.ts`, `order_validator.ts` (token 64 hex), `app/models/order.ts`/`alert_state.ts`, `start/routes.ts` (public vs `/api/admin`), `tests/helpers/factories.ts`
- [Source: code vérifié — frontend] — `src/lib/api/admin.ts` (fetch discriminé), `src/components/siana/AdminDashboard.tsx`, `e2e/admin-orders.spec.ts`
- [Source: railway.cron.toml + memory/project_railway_crons.md] — service cron `survey:send` (`0 * * * *`) déjà provisionné ; setup dashboard hors git
- [Source: CLAUDE.md] — Conventional Commits EN ; Pino ; Design System (Vert Sauge #2D4A3E) ; conventions toasts/forms/sr-only ; doc/communication FR
- [Source: 6-6-...md / 6-5-...md] — gabarits structurels (statut récupérable, commande Ace + cron externe, tests en deltas)

### Cross-story context (Epic 6)

- **6.1** ✅ healthcheck. **6.2** ✅ dashboard métriques (centimes, FILTER, N/A jamais 0). **6.3** ✅ layout/sidebar admin. **6.4** ✅ logs générations + Pino. **6.5** ✅ alertes (`alerts:check`, Resend `sendAdminAlert`, cron Railway). **6.6** ✅ renvoi manuel email (`email_failed`, `orders_admin_service`) + backups. **6.7** testimonials CRUD (backlog).
- **6.8** (cette story) — survey satisfaction post-achat (`survey:send`, page publique, carte dashboard).
[Source: sprint-status.yaml development_status epic-6]

### Dependencies

- **Bloquant résolu** : Epic 4 ✅ (orders/paid/email delivery), Story 4.2 ✅ (Resend `email_service`), Story 3.8 ✅ (pattern commande Ace `cleanup:rgpd`), Story 6.2 ✅ (patterns agrégat/centimes/N-A), Story 6.6 ✅ (`orders_admin_service`, philosophie récupérable). Infra cron Railway `survey:send` ✅ provisionnée. Aucune dépendance bloquante restante.

## Dev Agent Record

### Agent Model Used

Opus 4.8 (1M context) — claude-opus-4-8[1m]

### Debug Log References

- Développée en worktree isolé `feat/satisfaction-survey` (base `1d1da30`).
- API `npm run typecheck` (tsc --noEmit) : **exit 0**.
- API `npm run lint` (eslint) : **0 erreur** dans les fichiers de la 6.8 (1 erreur prettier
  préexistante dans `orders_admin_service.ts`, non touché par cette story).
- Migrations `1780421514900_add_survey_fields_to_orders_table` + `1780421514910_create_survey_responses_table`
  appliquées sur la DB dev locale (Docker Postgres :5435, `NODE_ENV=test`) : **138 ms**.
- Tests fonctionnels de la story : `tests/functional/survey/submit.spec.ts` + `admin/survey.spec.ts`
  + `commands/send_survey.spec.ts` = **20 passed** (stables sur 3 exécutions consécutives).
- Suite API complète : **209 passed** (2 reruns verts d'affilée). Un run isolé antérieur a montré
  1 flake intermittent (webhook Stripe / `cleanup:rgpd`, flake connu hors périmètre 6.8), disparu au rerun.
- Resend court-circuité en test : stub de `resend.emails.send` (export ajouté) → aucun appel réseau (garde K).
- Web `tsc --noEmit` : **exit 0**. Web `eslint` (fichiers 6.8) : **0 erreur**.
- E2E `e2e/survey.spec.ts` : **NON EXÉCUTABLE dans ce worktree**. `next dev`/`next build`/Turbopack
  (Next 16) refusent le `node_modules` symlinké hors-racine (`Symlink node_modules is invalid, it points
  out of the filesystem root`). Le seul serveur sur :3000 est le conteneur Docker `siana_web` du repo
  principal (sans la route survey) → Playwright le réutilise et renvoie 404. Limitation d'environnement
  identique à la note 6.6 ; le spec est écrit sur le pattern de `admin-orders.spec.ts` (API mockée).

### Completion Notes List

- ✅ **AC#1** — commande Ace `survey:send` (cron Railway horaire déjà provisionné) sélectionne les
  commandes `paid` + `emailSentAt` non nul + `surveySentAt` nul + `paidAt ∈ [now-30j ; now-24h]`,
  envoie l'email Resend `sendSurveyInvite` (3 questions FR48), puis pose `surveyToken`+`surveySentAt`
  **après envoi réussi** uniquement.
- ✅ **AC#2** — page publique `/survey/[token]` (sans auth, `robots noindex`) + endpoints publics
  `GET/POST /api/survey/:token` résolus par token opaque (404 si inconnu). Formulaire 3 questions
  (radios accessibles, `fieldset`/`legend`, `aria-describedby`), succès inline, erreurs système via toast.
- ✅ **AC#3** — `GET /api/admin/survey` (groupe admin `auth()+admin()`) → `SurveyService.getSurveyStats`
  (AVG satisfaction/qualité, taux de reco `AVG(would_recommend::int)`, distribution 1..5 via FILTER).
  Carte « Satisfaction client » sur le dashboard admin existant, **N/A jamais 0** (count===0 → null).
- ✅ **AC#4** — idempotence via `orders.survey_sent_at` (set après succès) + `order_id` UNIQUE sur
  `survey_responses` (2ᵉ soumission → 409). Échec d'envoi → `survey_sent_at` reste NULL (réessai, récupérable).
- **Décisions** : `FRONTEND_URL` (déjà présent) réutilisé pour le lien email ; constantes nommées
  `SURVEY_DELAY_HOURS` (24) et `SURVEY_RETRO_WINDOW_DAYS` (30) overridables par env (anti-flood rétroactif).
- **Réutilisations** : instance `resend` d'`email_service.ts` (export ajouté pour stub test, pas de 2ᵉ instance) ;
  patterns `metrics_service` (FILTER, N/A), `orders_admin_service` (résultat `{ok,code}`), commande `cleanup_rgpd`.
- **Points ops restants** : (1) activer/confirmer le service cron Railway `survey:send` (Config File
  `railway.cron.toml`, vars partagées, `DATABASE_PUBLIC_URL`) sinon l'AC#1 n'est pas réellement déclenché ;
  (2) `SURVEY_DELAY_HOURS`/`SURVEY_RETRO_WINDOW_DAYS` optionnels (défauts applicatifs 24/30) ;
  (3) e2e survey à rejouer dans un environnement avec `node_modules` réel (hors worktree symlinké).

### File List

**NEW — backend**
- `siana-memento-api/database/migrations/1780421514900_add_survey_fields_to_orders_table.ts`
- `siana-memento-api/database/migrations/1780421514910_create_survey_responses_table.ts`
- `siana-memento-api/app/models/survey_response.ts`
- `siana-memento-api/app/services/survey_service.ts`
- `siana-memento-api/app/validators/survey_validator.ts`
- `siana-memento-api/app/controllers/survey_controller.ts`
- `siana-memento-api/commands/send_survey.ts`
- `siana-memento-api/tests/functional/commands/send_survey.spec.ts`
- `siana-memento-api/tests/functional/survey/submit.spec.ts`
- `siana-memento-api/tests/functional/admin/survey.spec.ts`

**UPDATE — backend**
- `siana-memento-api/app/models/order.ts` (surveySentAt, surveyToken, hasOne SurveyResponse)
- `siana-memento-api/app/services/email_service.ts` (sendSurveyInvite + buildSurveyHtml ; export `resend`)
- `siana-memento-api/app/controllers/admin_controller.ts` (méthode `survey` + inject SurveyService)
- `siana-memento-api/start/routes.ts` (routes publiques /api/survey/:token + admin /api/admin/survey + surveyThrottle)
- `siana-memento-api/start/env.ts` (SURVEY_DELAY_HOURS + SURVEY_RETRO_WINDOW_DAYS optionnels)
- `siana-memento-api/.env.example` (vars survey)
- `siana-memento-api/tests/helpers/factories.ts` (surveySentAt/surveyToken + createSurveyResponse)

**NEW — frontend**
- `siana-memento-web/src/app/survey/[token]/page.tsx` (page publique, noindex)
- `siana-memento-web/src/components/siana/SurveyForm.tsx` (formulaire client 3 questions)
- `siana-memento-web/src/lib/api/survey.ts` (getSurvey + submitSurvey)
- `siana-memento-web/e2e/survey.spec.ts`

**UPDATE — frontend**
- `siana-memento-web/src/lib/api/admin.ts` (getAdminSurvey + type SurveyStats)
- `siana-memento-web/src/components/siana/AdminDashboard.tsx` (carte « Satisfaction client »)

## Change Log

| Date | Version | Description | Auteur |
|------|---------|-------------|--------|
| 2026-06-03 | 1.1 | Correctifs review 6.8 : (M1) throttle `survey` appliqué uniquement au POST, GET libre (anti-blocage NAT/CGNAT) ; (M2) validation format token `^[a-f0-9]{64}$` avant requête DB sur `show`/`submit` → 404 si malformé ; (m1) `submitResponse` entoure le `create` d'un try/catch sur violation d'unicité Postgres `23505` → 409 propre (filet anti-race en plus du check `findBy`) ; (m5) `aria-invalid` ajouté sur les fieldsets en erreur du `SurveyForm` (WCAG AA) ; (M3) **DÉCISION ACTÉE** — `getSurveyStats()` garde un agrégat CUMULÉ À VIE (pas de fenêtre 30j) : intentionnel (volume faible, score global cumulé plus pertinent), commenté dans le code. Tests survey étendus (token malformé → 404 GET+POST, re-soumission → 409). | review-fix |
| 2026-06-03 | 1.0 | Implémentation complète (dev-story) : migrations survey_sent_at/survey_token + table survey_responses, modèle SurveyResponse, SurveyService (envoi/soumission/agrégat), validator VineJS, commande Ace `survey:send`, email `sendSurveyInvite`, endpoints publics `/api/survey/:token` + admin `/api/admin/survey`, page publique `/survey/[token]` + SurveyForm, carte « Satisfaction » dashboard. API typecheck/lint OK, 20 tests survey + 209 suite verte. E2E écrit mais non exécutable (Turbopack vs node_modules symlinké). Statut → done. | dev-story |
| 2026-06-03 | 0.1 | Story 6.8 créée (ready-for-dev) — survey satisfaction post-achat : commande Ace `survey:send` (cron Railway horaire déjà provisionné, idempotent via `orders.survey_sent_at`), email Resend `sendSurveyInvite`, page publique `/survey/[token]` (sans auth, token opaque) + endpoints publics, table `survey_responses` (3 questions FR48), carte « Satisfaction » sur le dashboard admin (`GET /api/admin/survey`, N/A jamais 0). Décisions : commande Ace nommée `survey:send` (match cron Railway), Resend réutilisé, idempotence + récupérabilité via `survey_sent_at`, accès par token opaque, anti double-soumission (order_id UNIQUE → 409), anti-flood rétroactif (≤30j). | create-story |

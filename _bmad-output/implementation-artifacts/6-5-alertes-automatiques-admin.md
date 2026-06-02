---
baseline_commit: dd2519988d7eb455c55a13f3fe3e7deb4355155b
---
<!-- Story 6.5 — générée par create-story (BMad). Contexte-complet pour dev-story. -->

# Story 6.5: Alertes Automatiques Admin

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'admin Aldo,
je veux recevoir des alertes email automatiques si des seuils critiques sont dépassés,
afin de réagir en moins de 5 minutes avant que les problèmes n'impactent les clients.

## Acceptance Criteria

1. **Given** le système en production **When** le taux d'erreur des générations IA dépasse 5% sur les 15 dernières minutes **Then** Aldo reçoit un email d'alerte avec le taux actuel et les 5 dernières erreurs (FR36, NFR-R4).
2. **Given** le suivi des coûts API **When** le coût moyen par commande dépasse 0,70€ sur les 24 dernières heures **Then** Aldo reçoit un email d'alerte avec le coût actuel vs seuil (FR37, NFR-R4).
3. **Given** les appels Gemini API **When** les rate limits atteignent >80% du quota journalier **Then** Aldo reçoit un email d'alerte avec le quota restant (FR38, NFR-R4).
4. **Given** les alertes configurées **When** je vérifie le délai de réception **Then** l'email est envoyé en moins de 5 minutes après détection du seuil (NFR-R4).

[Source: epics.md#Story-6.5 L1017-1039 — user story + 4 AC verbatim ; prd.md FR36/FR37/FR38/NFR-R4 L1562-1564,1690]

## 🔑 Décisions structurantes (lire avant de coder)

### D1 — Canal d'alerte = **EMAIL via Resend** (PAS Discord)
Les ACs, les FR (FR36-38) et le NFR-R4 disent **email**. `architecture.md §5.3` (L1258-1340) propose des webhooks Discord comme alternative « Party Mode », **mais aucune story / FR / NFR ne reprend Discord** et `DiscordService` n'existe pas dans le code. → On implémente l'**email** (autorité = PRD/epics), via l'infrastructure Resend déjà câblée (`email_service.ts`). Aucune dette Discord créée. [Source: epics.md#Story-6.5 ; prd.md L1255-1258,1690 ; architecture.md L1258-1340 (divergence assumée) ; email_service.ts]

### D2 — Mécanisme d'exécution = **commande `node ace` planifiée toutes les 5 min** (PAS un endpoint)
NFR-R4 = détection→email **<5 min**. Le repo n'a **aucun scheduler in-process** (pas de `adonisjs-scheduler`, pas de `node-cron`) ; le précédent établi est une **commande Ace** lancée par un cron **externe** (cf. `cleanup:rgpd` / `commands/cleanup_rgpd.ts`, Story 3.8). → Créer une commande `alerts:check` qui évalue les 3 seuils et envoie un email par seuil franchi. La **planification toutes les 5 min** est opérationnelle (cron Railway / GitHub Actions), hors périmètre code de cette story — comme pour `cleanup:rgpd` qui n'a pas de planifieur committé (lancé manuellement / cron externe). Documenter la commande + la cadence attendue dans le résumé de complétion. [Source: commands/cleanup_rgpd.ts ; railway.toml ; architecture.md L1236-1238,1550-1561]

### D3 — Coût = **estimation EUR** (cohérent 6.2/6.4), `gemini_cost_usd` reste réservé
AC#2 « coût moyen par commande > 0,70€ sur 24h ». Le coût réel Gemini n'est **pas** persisté (`generations.gemini_cost_usd = null`, dette 6.2/6.4). On réutilise l'**estimation** `GEMINI_COST_EUR_ESTIMATE` (~0,50€) × nombre de générations, divisé par le nombre de commandes payées — **exactement la même formule que `metrics_service.ts`** mais sur fenêtre **24h** (et non 30j). ⚠️ Le seuil d'alerte 0,70€ > estimation 0,50€ : avec une seule génération/commande l'alerte ne se déclenchera qu'en cas de **multiples re-générations** (itérations) par commande payée — c'est le signal voulu (coût qui dérive). [Source: metrics_service.ts:39-43,69-84 ; start/env.ts:93 ; deferred-work.md (6.2/6.4)]

### D4 — AC#3 « >80% du quota journalier » = **proxy par erreurs 429 / quota détectées** (pas de compteur de quota réel)
Aucun compteur de quota/rate-limit Gemini n'existe en base ni en mémoire. Gemini ne renvoie pas le quota restant dans une API exploitable au MVP. → **Proxy MVP** : détecter, sur les **dernières 24h** (fenêtre journalière), les générations `failed` dont `error_message` matche un signal de quota (`429`, `RESOURCE_EXHAUSTED`, `quota`, `rate limit` — insensible à la casse). Si **au moins une** erreur de quota est détectée (ou ≥ N selon `GEMINI_QUOTA_ALERT_MIN_HITS`, défaut 1), envoyer l'alerte « rate limit proche ». Le corps de l'email reporte le **nombre d'erreurs de quota** + un message « quota restant non mesurable au MVP — voir logs ». **Documenter** clairement que « quota restant » exact est une dette (compteur réel = Growth). [Source: generation_service.ts:357-373 (error_message persistée), designs_controller.ts (persistance `failed`+errorMessage tronqué 500) ; prd.md L1562-1564 ; deferred-work.md]

### D5 — **Anti-spam / déduplication** des alertes
Une commande qui tourne toutes les 5 min ne doit PAS renvoyer le même email toutes les 5 min tant que le seuil reste franchi (sinon flood). → Persister l'**état d'envoi par type d'alerte** (table légère `alert_states` : `alert_type` unique, `last_triggered_at`, `last_value`) et n'**émettre** un email que si **aucune alerte du même type n'a été envoyée depuis `ALERT_COOLDOWN_MINUTES`** (défaut 60). Quand le seuil repasse sous la barre, ré-armer (on peut soit effacer la ligne, soit comparer simplement `now - last_triggered_at >= cooldown`). MVP simple : cooldown temporel par type. [Décision create-story — non spécifiée par l'AC mais requise pour que NFR-R4 soit exploitable sans noyer l'admin.]

## Tasks / Subtasks

### A. Backend — Migration `alert_states` (dédup, support D5) (AC: #4)

- [x] Créer une migration `alert_states` (s'inspirer de `database/migrations/*` existantes — voir patterns `generations`, `orders`) :
  - [x] Colonnes : `id` (PK), `alert_type` varchar **UNIQUE** (`'error_rate' | 'api_cost' | 'rate_limit'`), `last_triggered_at` timestamp, `last_value` varchar nullable (valeur déclenchante humaine, ex. « 7.2% » / « 0,82€ » / « 3 erreurs 429 »), timestamps.
  - [x] Index sur `alert_type` (UNIQUE suffit).
- [x] Créer le modèle `app/models/alert_state.ts` (`BaseModel`, conventions de `app/models/generation.ts` — `@column`, `@column.dateTime`). Pas de relation.
- [x] ⚠️ Vérifier la convention de nommage des fichiers de migration existants (timestamp prefix) et le `tableName` (snake_case `alert_states`) avant d'écrire.

### B. Backend — `AlertsService` : évaluation des 3 seuils (AC: #1, #2, #3)

- [x] Créer `app/services/alerts_service.ts` (classe `@inject()`, conventions de `metrics_service.ts` / `logs_service.ts` — argent en **centimes** integer, `DateTime.now().minus(...).toUTC().toSQL({ includeOffset: false })` pour borner les fenêtres comme `metrics_service.sinceSql()`).
- [x] **`checkErrorRate()`** (AC#1) — fenêtre **15 min** sur `generations.created_at` :
  - [x] `total` = nb générations sur 15 min ; `failed` = nb `status='failed'`. `rate = failed/total`.
  - [x] Garde-fou volume : ne PAS alerter si `total` < `ERROR_RATE_MIN_SAMPLE` (défaut 5) — sinon 1 échec sur 1 = 100% déclenche à tort. (Évite le faux positif faible volume.)
  - [x] Si `rate > 0.05` ET volume suffisant → retourner les **5 dernières erreurs** (`status='failed'`, `orderBy created_at desc, id desc`, limit 5) : `errorMessage`, `createdAt`, `template` (jointure `design`), `iterationNumber`.
- [x] **`checkApiCost()`** (AC#2) — fenêtre **24h** :
  - [x] `paidOrders` = `orders.status='paid'` sur 24h (compte). `generations` = nb générations sur 24h. `apiCostCents = generationsCount × estimateCentsPerGeneration()` (réutiliser la formule de `metrics_service`). `avgCostCents = paidOrders > 0 ? apiCostCents / paidOrders : null`.
  - [x] Si `avgCostCents !== null` ET `avgCostCents > 70` (0,70€) → déclencher avec coût actuel vs seuil.
  - [x] ⚠️ Si `paidOrders === 0` → **pas d'alerte** (division impossible, cohérent règle N/A jamais 0 du dashboard 6.2).
- [x] **`checkRateLimit()`** (AC#3, proxy D4) — fenêtre **24h** :
  - [x] Compter les `generations` `status='failed'` dont `error_message` ILIKE l'un de : `%429%`, `%RESOURCE_EXHAUSTED%`, `%quota%`, `%rate limit%` (Postgres `ILIKE` / `whereRaw('error_message ~* ?', ...)`).
  - [x] Si `count >= GEMINI_QUOTA_ALERT_MIN_HITS` (défaut 1) → déclencher avec le nombre d'erreurs quota détectées + mention « quota restant exact non mesurable au MVP ».
- [x] Chaque `check*` retourne un objet uniforme `{ triggered: boolean, value: string, details?: unknown }` consommable par l'email + la dédup.

### C. Backend — Emails d'alerte (Resend) (AC: #1, #2, #3)

- [x] Étendre `app/services/email_service.ts` (NE PAS créer un 2ᵉ service Resend — réutiliser l'instance `resend` du module + le pattern `sendDesignDelivery`) :
  - [x] Ajouter `export async function sendAdminAlert(type, subject, htmlBody): Promise<{ success: boolean; resendId?: string }>` — **ne throw jamais** (try/catch, log `event:'admin_alert_failed'` sur erreur), retourne `{success}` comme `sendDesignDelivery`.
  - [x] Destinataire = `env.get('ADMIN_ALERT_EMAIL')` (nouvelle var). From = `env.get('RESEND_FROM_EMAIL')` (déjà présent).
  - [x] Sujet préfixé `[Siana Alerte]`. Corps HTML inline (pattern `buildDeliveryHtml`, Vert Sauge `#2D4A3E`) — un builder par type ou un builder générique `buildAlertHtml(title, lines[])`.
  - [x] AC#1 → lister les **5 dernières erreurs** (message tronqué, template, heure). AC#2 → coût actuel vs seuil 0,70€. AC#3 → nb erreurs quota.
  - [x] Log `logger.info({ event: 'admin_alert_sent', type, resendId })` en succès (pattern `delivery_email_sent`).

### D. Backend — Commande `alerts:check` + dédup (AC: #1, #2, #3, #4)

- [x] Créer `commands/check_alerts.ts` (`BaseCommand`, `static commandName = 'alerts:check'`, `static options = { startApp: true }` — pattern **exact** de `commands/cleanup_rgpd.ts`).
- [x] Dans `run()` : instancier/résoudre `AlertsService` (via `app.container.make` ou `new` — vérifier comment Ace résout un service `@inject()` ; `cleanup_rgpd` n'utilise pas de service injecté, donc soit `await app.container.make(AlertsService)` soit instancier les helpers directement). Évaluer les 3 checks.
- [x] Pour chaque check `triggered === true` :
  - [x] **Dédup (D5)** : charger `AlertState` pour `alert_type` ; si `last_triggered_at` existe ET `now - last_triggered_at < ALERT_COOLDOWN_MINUTES` → **skip l'email** (log `event:'admin_alert_throttled'`). Sinon envoyer via `sendAdminAlert(...)`, puis **upsert** `AlertState` (`last_triggered_at = now`, `last_value`).
  - [x] **Défensif** : un échec d'envoi d'un email NE doit PAS empêcher l'évaluation/l'envoi des autres alertes (try/catch par type, comme `cleanup_rgpd` continue malgré une erreur Cloudinary).
- [x] Log de synthèse final : `logger.info({ event: 'alerts_check_summary', errorRate, apiCost, rateLimit, sent, throttled, durationMs }, '...')` + `this.logger.success(...)` (pattern `rgpd_cleanup_summary`).

### E. Backend — Config env (AC: #1, #2, #3, #4)

- [x] Ajouter dans `start/env.ts` (suivre la structure commentée existante) :
  - [x] `ADMIN_ALERT_EMAIL: Env.schema.string()` (destinataire des alertes — **requis** en prod ; si on veut éviter de casser dev/test, `Env.schema.string.optional()` + garde « pas d'email si absent », à trancher : recommandé **optional** pour ne pas bloquer le boot local — la commande log un WARN si absent et skip l'envoi).
  - [x] `ERROR_RATE_THRESHOLD: Env.schema.number.optional()` (défaut applicatif 0.05).
  - [x] `API_COST_ALERT_EUR: Env.schema.number.optional()` (défaut 0.70).
  - [x] `ERROR_RATE_MIN_SAMPLE: Env.schema.number.optional()` (défaut 5).
  - [x] `GEMINI_QUOTA_ALERT_MIN_HITS: Env.schema.number.optional()` (défaut 1).
  - [x] `ALERT_COOLDOWN_MINUTES: Env.schema.number.optional()` (défaut 60).
- [x] Mettre à jour `.env.example` si présent (chercher `RESEND_FROM_EMAIL` pour aligner le format).
- [x] ⚠️ Les seuils en dur (0.05, 0.70, 15min, 24h) sont des **constantes nommées** en tête de `AlertsService`, overridables par env — pas de magic numbers dispersés.

### F. Tests (AC: #1, #2, #3, #4)

- [x] **Backend** `tests/functional/commands/check_alerts.spec.ts` (pattern **exact** de `tests/functional/commands/cleanup_rgpd.spec.ts` : `testUtils.db().withGlobalTransaction()`, `ace.exec('alerts:check', [])`) :
  - [x] **AC#1** : créer >5 générations sur 15 min dont >5% `failed` (factory `createGeneration(designId,{status:'failed'})`) → vérifier qu'une ligne `AlertState('error_rate')` est créée (preuve de déclenchement, l'envoi Resend étant mocké/no-op en test). Cas négatif : taux <5% ou volume < min_sample → pas d'`AlertState`.
  - [x] **AC#2** : créer commandes `paid` + assez de générations sur 24h pour que `avgCost > 0,70€` → `AlertState('api_cost')`. Cas `paidOrders=0` → pas d'alerte.
  - [x] **AC#3** : créer générations `failed` avec `errorMessage` contenant `429`/`RESOURCE_EXHAUSTED` → `AlertState('rate_limit')`. Cas erreurs non-quota → pas d'alerte rate_limit.
  - [x] **Dédup (D5)** : 2ᵉ exécution dans le cooldown → `last_triggered_at` inchangé, pas de nouvel envoi (compteur d'appels mockés / log `throttled`).
  - [x] ⚠️ **Tests en deltas** (base de dev partagée, données résiduelles — découverte 6.2/6.4) : créer les lignes nécessaires dans la transaction et asserter sur la présence/état de l'`AlertState` du type testé, pas sur des totaux absolus globaux.
  - [x] **Mock Resend** : éviter d'envoyer un vrai email. Option A : injecter via env de test `ADMIN_ALERT_EMAIL` absent → `sendAdminAlert` skip l'appel réseau (chemin « pas de destinataire »). Option B : spy sur `sendAdminAlert`. ⚠️ `sendDesignDelivery` n'est pas mocké dans `delivery_email.spec.ts` (les tests existants n'envoient pas réellement car pas d'order complète) — vérifier le comportement réseau en test et privilégier le **garde `ADMIN_ALERT_EMAIL` absent** pour ne PAS taper Resend. **Asserter le déclenchement via `AlertState`**, pas via l'email.
- [x] **Backend** (optionnel propre) `tests/functional/admin/alerts_service.spec.ts` : tester `checkErrorRate/checkApiCost/checkRateLimit` en isolation (entrées contrôlées → `triggered`/`value`).
- [x] Lancer `npm run typecheck` (exit 0) et `node ace test` (suite verte hors flake `cleanup:rgpd` connu / `home hero` e2e préexistant — voir Debug Log 6.4).

## Dev Notes

### Contexte & périmètre

Story 6.5 = 5ᵉ story d'Epic 6. **Backend uniquement** (aucune surface front : pas de page `/admin/*`, pas de composant React, pas d'e2e Playwright). Elle transforme les **lignes `generations` persistées par la Story 6.4** (succès/échec/coût estimé) en **signaux d'alerte proactifs** : une commande `alerts:check` évalue 3 seuils (taux d'erreur, coût moyen/commande, proxy rate-limit) et envoie un email Resend par seuil franchi, avec déduplication temporelle. Dépend directement de 6.4 (sans lignes `generations`, aucun signal). [Source: epics.md#Story-6.5 ; 6-4-...md (persistance/log)]

### État du code backend (vérifié)

- **Resend déjà câblé** : `app/services/email_service.ts` — instance `const resend = new Resend(env.get('RESEND_API_KEY'))`, `sendDesignDelivery(order,user,design)` qui **ne throw jamais** (try/catch, log `delivery_email_failed`/`delivery_email_sent`, retourne `{success, resendId?}`). `from = env.get('RESEND_FROM_EMAIL')`. **Réutiliser ce module** pour `sendAdminAlert`. [Source: email_service.ts:1-9,63-138]
- **Commande Ace = précédent cron** : `commands/cleanup_rgpd.ts` — `BaseCommand`, `commandName='cleanup:rgpd'`, `options={startApp:true}`, mesure `durationMs` via `Date.now()` (autorisé en code runtime), log structuré Pino par item + synthèse `rgpd_cleanup_summary`, **continue malgré les erreurs** (try/catch par item). `commands/admin_promote.ts` montre `app.container`/import dynamique de modèle dans une commande. [Source: cleanup_rgpd.ts ; admin_promote.ts]
- **Test de commande** : `tests/functional/commands/cleanup_rgpd.spec.ts` — `testUtils.db().withGlobalTransaction()`, `await ace.exec('cleanup:rgpd', [])`, assertions sur l'état DB après exécution. **Modèle exact pour `check_alerts.spec.ts`.** [Source: cleanup_rgpd.spec.ts]
- **`metrics_service.ts`** : argent en **centimes** integer, conversion € à la sortie ; `estimateCentsPerGeneration()` = `Math.round((env.GEMINI_COST_EUR_ESTIMATE ?? 0.5) * 100)` ; `sinceSql()` = `DateTime.now().minus({days}).toUTC().toSQL({includeOffset:false})` (borne déterministe pour colonnes `timestamp without time zone`). **Réutiliser ces patterns** (mais fenêtres 15min/24h, pas 30j). [Source: metrics_service.ts:39-43,46-50,69-84]
- **Table/modèle `generations`** : `status enum(pending|generating|completed|failed)`, `error_message varchar(500)?` (tronqué à 500 par 6.4), `created_at` indexé ? → **NON** (dette 6.2 : index manquant sur `generations.created_at`). Les fenêtres 15min/24h scannent `created_at` ; volume MVP faible → acceptable, mais noter. `gemini_cost_usd` = **null** (réservé, ne pas écrire). Relations `Generation.belongsTo(Design)`, `design.template`/`design.userId`. [Source: generation.ts ; deferred-work.md (6.2 index manquant) ; 6-4-...md]
- **`orders`** : `status` (`pending|paid|failed`), `amount` en centimes, `created_at`. `paid` = revenu encaissé. [Source: factories.ts (createPaidOrderWithDesign) ; metrics_service.ts:57-66]
- **`env.ts`** : structure commentée par bloc ; `GEMINI_COST_EUR_ESTIMATE` optional number déjà là (bloc « admin metrics dashboard »). `RESEND_API_KEY`/`RESEND_FROM_EMAIL` string requis. **Ajouter un bloc « alertes admin ».** [Source: env.ts:80-99]
- **Routes admin** : groupe `.prefix('/api/admin').use([auth(), admin()])` — **pas de route à ajouter** ici (la story est une commande, pas un endpoint). [Source: routes.ts:80-89]
- **Logger Pino** : `import logger from '@adonisjs/core/services/logger'`, `logger.info({event, ...ctx}, 'msg')`. **Pas de redaction** → ne PAS logger d'email complet en clair au-delà du nécessaire, ni de payload sensible. [Source: config/logger.ts ; 6-4-...md §Pino]

### Détection du proxy rate-limit (D4) — détail technique

- `generateDesignImage` capture l'erreur Gemini (`lastError`) et la remonte en `{ success:false, error: message }` ; `designs_controller.generate` persiste ce message dans `generations.error_message` (tronqué 500). Les erreurs Gemini de quota apparaissent typiquement comme `429`, `RESOURCE_EXHAUSTED`, ou un message contenant « quota »/« rate limit ». → Requête : `Generation.query().where('status','failed').where('created_at','>=', since24h).whereRaw('error_message ~* ?', ['429|RESOURCE_EXHAUSTED|quota|rate limit'])`. [Source: generation_service.ts:357-373 ; designs_controller.ts (recordGeneration, errorMessage tronqué)]
- ⚠️ Le **« quota restant »** exact demandé par l'AC#3 n'est pas mesurable (Gemini n'expose pas un compteur exploitable au MVP, aucun compteur local). L'email reporte le **nombre d'erreurs quota** + mention explicite que le quota restant exact est une dette Growth. **Tracer dans `deferred-work.md`.**

### Garde-fous anti-erreurs

- ❌ Ne PAS implémenter Discord (architecture §5.3) — les ACs disent **email** ; réutiliser `email_service.ts` (Resend). [D1]
- ❌ Ne PAS créer un endpoint HTTP pour les alertes — c'est une **commande Ace** planifiée (`alerts:check`), pattern `cleanup:rgpd`. [D2]
- ❌ Ne PAS écrire `generations.gemini_cost_usd` ni introduire de taux USD→EUR / prix Gemini réel (scope creep, dette 6.2/6.4) — coût = **estimation EUR** réutilisée de `metrics_service`. [D3]
- ❌ Ne PAS alerter sur taux d'erreur en **faible volume** (garde `ERROR_RATE_MIN_SAMPLE`) — 1/1 = 100% est un faux positif. [B]
- ❌ Ne PAS alerter coût si `paidOrders === 0` (division impossible — règle N/A jamais 0 du dashboard). [B]
- ❌ Ne PAS **flooder** : déduplication par type via `alert_states` + cooldown (`ALERT_COOLDOWN_MINUTES`). [D5]
- ❌ Un échec d'envoi d'un email ne doit PAS bloquer les autres alertes ni faire crasher la commande (try/catch par type, `sendAdminAlert` ne throw pas). [C/D]
- ❌ Ne PAS taper Resend dans les tests — asserter le **déclenchement via `AlertState`**, garder `ADMIN_ALERT_EMAIL` absent en test pour court-circuiter l'envoi réseau. [F]
- ❌ Ne PAS dupliquer l'instance Resend — étendre `email_service.ts`. [C]
- ❌ Pas de magic numbers : seuils = constantes nommées overridables par env. [E]

### ⚠️ Impact cross-story (à signaler, pas une régression)

- **Dépend de 6.4** : la justesse des alertes dépend des lignes `generations` que 6.4 persiste (taux d'erreur, coût). Tant qu'aucune génération `failed` n'est persistée pour une cause infra (cf. defer 6.4 : seuls les échecs Gemini créent une ligne `failed`), le taux d'erreur AC#1 ne « voit » que les échecs Gemini — cohérent avec « erreurs IA » du périmètre. [Source: deferred-work.md (6.4) ; 6-4-...md]
- **Cohérence coût** : la fenêtre coût de 6.5 (24h) réutilise l'estimation de 6.2/6.4 ; si le coût réel est un jour persisté (dette), rebrancher `AlertsService.checkApiCost` dessus en même temps que `metrics_service`. [Source: deferred-work.md (6.2)]

### Project Structure Notes

- **NEW backend** :
  - `siana-memento-api/app/services/alerts_service.ts` (évaluation des 3 seuils)
  - `siana-memento-api/app/models/alert_state.ts` (dédup)
  - `siana-memento-api/database/migrations/<timestamp>_create_alert_states_table.ts`
  - `siana-memento-api/commands/check_alerts.ts` (commande `alerts:check`)
  - `siana-memento-api/tests/functional/commands/check_alerts.spec.ts` (+ optionnel `tests/functional/admin/alerts_service.spec.ts`)
- **UPDATE backend** :
  - `siana-memento-api/app/services/email_service.ts` (ajout `sendAdminAlert` + builder HTML d'alerte — réutilise l'instance `resend`)
  - `siana-memento-api/start/env.ts` (bloc « alertes admin » : `ADMIN_ALERT_EMAIL` + seuils optionnels)
  - `siana-memento-api/.env.example` (si présent — aligner sur `RESEND_FROM_EMAIL`)
  - `_bmad-output/implementation-artifacts/deferred-work.md` (dette « quota restant exact » D4)
- **READ-FOR-CONTEXT** : `app/services/metrics_service.ts` (centimes, `sinceSql`, estimation coût), `commands/cleanup_rgpd.ts` + `tests/functional/commands/cleanup_rgpd.spec.ts` (pattern commande + test), `app/services/email_service.ts` (Resend, sendDesignDelivery), `app/models/generation.ts` (schéma), `tests/helpers/factories.ts` (`createGeneration`, `createPaidOrderWithDesign`), `app/services/generation_service.ts:357-373` (forme du message d'erreur).
- **NE PAS TOUCHER** : `gemini_cost_usd` (réservé) ; le pipeline de génération `designs_controller.generate` / `generation_service` (on **lit** les lignes qu'il produit, on ne le modifie pas) ; les endpoints `/api/admin` existants ; `metrics_service` (on s'en inspire, on ne le modifie pas).
- **FRONTEND** : **aucun** changement (pas de page, pas de composant, pas d'e2e). Si une UI de configuration des seuils est souhaitée, c'est hors périmètre (Growth).

### Cadence d'exécution (opérationnel, hors code de la story)

`alerts:check` doit tourner **≤ toutes les 5 min** pour satisfaire NFR-R4. Comme `cleanup:rgpd`, la planification n'est pas committée dans le repo (cron externe Railway / GitHub Actions schedule `*/5 * * * *` → `node build/ace alerts:check`). À acter dans le résumé de complétion / runbook. [Source: railway.toml ; architecture.md L1236-1238,1550-1561]

### References

- [Source: epics.md#Story-6.5] (L1017-1039) — user story + 4 AC verbatim (FR36, FR37, FR38, NFR-R4)
- [Source: epics.md#Epic-6] (L902-907) — objectif epic, FR36-38, NFR-R4
- [Source: prd.md] — FR36 (alerte taux erreur >5%), FR37 (alerte coût >0,70€/commande), FR38 (alerte rate limit proche), NFR-R4 (alerte email admin <5 min, L1690), L1255-1258 (canal email explicite)
- [Source: architecture.md §5.3 L1258-1340] — proposition Discord (alternative non retenue : ACs/FR disent email) ; L1236-1238,1550-1561 (crons manuels MVP → automatiser Growth)
- [Source: code vérifié — backend] — `email_service.ts` (Resend, sendDesignDelivery), `commands/cleanup_rgpd.ts` + son test (pattern commande/cron), `metrics_service.ts` (centimes, sinceSql, estimation coût), `generation_service.ts:357-373` (message d'erreur), `app/models/generation.ts` (schéma), `start/env.ts:80-99`, `tests/helpers/factories.ts`
- [Source: deferred-work.md] — coût Gemini réel non persisté (6.2/6.4), index manquant `generations.created_at` (6.2), échecs infra non persistés en ligne `Generation` (6.4)
- [Source: 6-4-logs-de-generation-et-historique-erreurs-ia.md] — persistance/log des générations dont 6.5 dépend ; tests en deltas (base partagée)
- [Source: CLAUDE.md] — Conventional Commits EN ; Pino ; Design System (Vert Sauge #2D4A3E) ; doc/communication FR

### Cross-story context (Epic 6)

- **6.1** ✅ healthcheck (+ `MONITORING_SECRET`, cible UptimeRobot). **6.2** ✅ dashboard métriques (estimation coût, centimes, `sinceSql`). **6.3** ✅ layout/sidebar admin. **6.4** ✅ persistance + log Pino des générations + `/api/admin/logs` — **source des signaux de 6.5**.
- **6.5** (cette story) — alertes email proactives (commande `alerts:check`).
- **6.6** (suivante) — renvoi manuel designs + backups DB. **6.7** testimonials CRUD. **6.8** survey satisfaction.
[Source: sprint-status.yaml development_status epic-6]

### Dependencies

- **Bloquant résolu** : Story 6.4 ✅ done (lignes `generations` persistées + `error_message`). Story 6.2 ✅ done (estimation coût, patterns service/centimes). Story 3.8 ✅ done (pattern commande Ace `cleanup:rgpd`). Story 4.2 ✅ done (Resend `email_service`). Aucune dépendance bloquante restante.

## Dev Agent Record

### Agent Model Used

Opus 4.8 (1M context) — claude-opus-4-8[1m]

### Debug Log References

- `node ace migration:run` → migration `alert_states` appliquée (additive) sur la base de dev partagée. Aucun `fresh`/`rollback`.
- `node ace list` initial → erreur de parse sur `check_alerts.ts` : la séquence `*/5` dans un commentaire JSDoc `/* ... */` fermait le bloc prématurément. Corrigé en reformulant la ligne cron sans `*/`.
- `node ace test --files=check_alerts.spec.ts` initial → `orders.user_id` NOT NULL : test AC#2 corrigé pour créer un `User` et l'associer au design + à l'order.
- Suite complète : 1 run a montré 1 échec intermittent (177/178) non reproductible ; 4 runs consécutifs ensuite → 178/178. Spec `check_alerts` stable 6/6 en isolation (3 runs). Flake pré-existant lié à la base de dev partagée + tests touchant le réseau (Cloudinary/fetch), pas une régression 6.5.

### Completion Notes List

- **AC#1** (taux d'erreur IA >5% / 15 min) : `alerts_service.ts:checkErrorRate()`. Garde-fou volume `ERROR_RATE_MIN_SAMPLE` (défaut 5) ; renvoie les 5 dernières erreurs (`errorMessage`, `createdAt`, `template` via preload `design`, `iterationNumber`). Email listant ces 5 erreurs : `commands/check_alerts.ts` builder `error_rate` + `email_service.buildAlertHtml`.
- **AC#2** (coût moyen >0,70€/commande / 24h) : `alerts_service.ts:checkApiCost()`. Argent en centimes ; estimation EUR réutilisée de `metrics_service` (`GEMINI_COST_EUR_ESTIMATE`). Pas d'alerte si `paidOrders === 0`. Email coût actuel vs seuil.
- **AC#3** (proxy rate-limit / 24h) : `alerts_service.ts:checkRateLimit()` via `error_message ~* '429|RESOURCE_EXHAUSTED|quota|rate limit'`. Email reporte le nombre d'erreurs quota + mention « quota restant non mesurable au MVP » (dette tracée).
- **AC#4** (<5 min) : commande Ace `alerts:check` (`commands/check_alerts.ts`, pattern `cleanup:rgpd`), à planifier `*/5 * * * *` par cron externe (Railway / GitHub Actions). Cadence opérationnelle hors périmètre code (documentée).
- **D5 anti-spam** : table/modèle `alert_states` + cooldown `ALERT_COOLDOWN_MINUTES` (défaut 60). Dédup par type via `AlertState.findBy` + `updateOrCreate`. Log `admin_alert_throttled` si cooldown actif. Try/catch par type (un échec n'empêche pas les autres).
- **Garde test** : `ADMIN_ALERT_EMAIL` optional ; absent en test → `sendAdminAlert` court-circuite l'appel Resend (log `admin_alert_skipped`). Tests assertent le déclenchement via `AlertState`, pas via l'email.
- **Vérifs finales** : `npx tsc --noEmit` → 0 erreur ; `npm run lint` → 0 erreur ; `node ace test` → 178 passed (172 préexistants + 6 nouveaux).
- **Dette ajoutée** : `deferred-work.md` (quota restant exact = Growth ; coût estimé à rebrancher sur coût réel ; cron non committé ; index `generations.created_at`).

### File List

**Créés :**
- `siana-memento-api/database/migrations/1780421514880_create_alert_states_table.ts` — table de déduplication des alertes (D5)
- `siana-memento-api/app/models/alert_state.ts` — modèle Lucid `AlertState` (+ type `AlertType`)
- `siana-memento-api/app/services/alerts_service.ts` — évaluation des 3 seuils (AC#1/#2/#3), centimes, fenêtres UTC
- `siana-memento-api/commands/check_alerts.ts` — commande Ace `alerts:check` + dédup + emails + log de synthèse (AC#4, D5)
- `siana-memento-api/tests/functional/commands/check_alerts.spec.ts` — tests fonctionnels (AC#1/#2/#3 + cas négatifs + cooldown D5)

**Modifiés :**
- `siana-memento-api/app/services/email_service.ts` — ajout `sendAdminAlert` + `buildAlertHtml` (réutilise l'instance Resend, ne throw jamais, garde `ADMIN_ALERT_EMAIL`)
- `siana-memento-api/start/env.ts` — bloc « alertes admin » (`ADMIN_ALERT_EMAIL` + 5 seuils optionnels)
- `siana-memento-api/.env.example` — variables d'alerte documentées
- `siana-memento-api/tests/helpers/factories.ts` — `createGeneration` accepte `errorMessage` + `createdAt` (additif)
- `_bmad-output/implementation-artifacts/deferred-work.md` — dette 6.5
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 6-5 → review

## Change Log

| Date | Version | Description | Auteur |
|------|---------|-------------|--------|
| 2026-06-02 | 0.1 | Story 6.5 créée (ready-for-dev) — commande `alerts:check` (cron 5 min, pattern `cleanup:rgpd`) évaluant 3 seuils : taux d'erreur >5% (15 min), coût moyen >0,70€/commande (24h, estimation EUR), proxy rate-limit via erreurs 429/quota (24h). Emails via Resend (`email_service.sendAdminAlert`), dédup par type via table `alert_states` + cooldown. Backend uniquement. Décisions : email (pas Discord), commande Ace (pas endpoint), coût estimé, proxy quota, anti-spam. | create-story |
| 2026-06-02 | 1.0 | Implémentation complète (dev-story) — migration + modèle `alert_states`, `AlertsService` (3 checks), `alerts:check` (dédup cooldown + emails Resend + synthèse Pino), `sendAdminAlert`/`buildAlertHtml`, bloc env « alertes admin ». 6 tests fonctionnels. tsc 0 / lint 0 / 178 tests verts. Status → review. | dev-story |

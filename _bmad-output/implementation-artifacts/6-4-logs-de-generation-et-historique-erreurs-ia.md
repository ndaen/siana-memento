---
baseline_commit: 77465d7a3ca2ff88480e1b91e44d9d14df2ada46
---

<!-- Story 6.4 — générée par create-story (BMad). Contexte-complet pour dev-story. -->

# Story 6.4: Logs de Génération et Historique Erreurs IA

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'admin Aldo,
je veux consulter les logs de toutes les générations et l'historique des erreurs IA,
afin de diagnostiquer rapidement les problèmes et optimiser les coûts API.

## Acceptance Criteria

1. **Given** Aldo authentifié sur `/admin/logs` **When** il consulte la liste des générations **Then** chaque entrée affiche : date/heure, user ID, template, durée (ms), coût Gemini API estimé (€), statut (FR34, NFR-R8).
2. **Given** la table des logs **When** Aldo filtre par « échecs seulement » **Then** il voit l'historique des erreurs avec le message complet et le contexte (payload, timestamp) (FR35, NFR-I4).
3. **Given** le backend AdonisJS **When** une génération est lancée ou échoue **Then** l'événement est loggé via Pino en JSON structuré (timestamp, user_id, template, durée, coût_api_estimate) (NFR-R8).

[Source: epics.md#Story-6.4 L995-1013 — user story + 3 AC verbatim]

## Tasks / Subtasks

### A. Backend — Persister chaque génération (AC: #1, #2) — *prérequis : sans lignes en base, rien à lister*

- [x] **Refactorer `app/services/generation_service.ts::generateDesignImage`** pour remonter à l'appelant ce qui doit être persisté/loggé, sans casser le flux : retourner un objet `{ imageDataUrl, attempts, durationMs, promptUsed, geminiModel }` au lieu du seul data-URL.
  - [x] Mesurer `durationMs` autour de la boucle d'appels Gemini (`Date.now()` avant / après — ⚠️ `Date.now()` est interdit dans les workflows BMad, **pas** dans le code applicatif : ici c'est du code runtime normal, autorisé).
  - [x] Exposer le `promptUsed` réellement envoyé (colonne `prompt_used` est `NOT NULL`) et le `geminiModel` (`gemini-2.5-flash-image`).
  - [x] Remonter `attempts` = nombre de tentatives réellement effectuées (la boucle 1→3 existe déjà mais le compteur est perdu).
- [x] **Persister une ligne `Generation` par appel `generate`** dans `app/controllers/designs_controller.ts::generate` (orchestration — le service ne voit pas le `design`) :
  - [x] **UNE seule** ligne par appel (pas une par tentative interne) → `attempts` porte le nombre de tentatives. (Idempotence : sinon `generationsCount` du dashboard 6.2 serait gonflé.)
  - [x] Champs : `designId`, `iterationNumber`, `promptUsed`, `feedback?`, `status`, `geminiModel`, `cloudinaryPublicId`/`cloudinaryUrl` (succès), `generationDurationMs`, `errorMessage` (échec, **tronqué à 500**), `attempts`. **Ne PAS écrire `geminiCostUsd`** (voir décision coût).
  - [x] Succès → `status='completed'` + champs Cloudinary ; échec → `status='failed'` + `errorMessage`.
  - [x] **Défensif** : l'écriture de la ligne `Generation` ne doit JAMAIS faire échouer une génération réussie (try/catch autour de l'insert, ne pas perdre l'image si l'insert échoue).
  - [x] Préserver : `iterationsUsed` incrémenté **uniquement en succès** (comportement actuel `designs_controller.ts:282`).

### B. Backend — Logging Pino structuré (AC: #3)

- [x] Dans le flux `generate`, logger via le singleton `import logger from '@adonisjs/core/services/logger'`, pattern maison `logger.<niveau>({ event, ...ctx }, 'message')` :
  - [x] Succès : `logger.info({ event: 'generation_succeeded', designId, userId, template, iterationNumber, attempts, durationMs, costEurEstimate }, 'Generation completed')`.
  - [x] Échec : `logger.error({ event: 'generation_failed', designId, userId, template, iterationNumber, attempts, durationMs, error: String(err) }, 'Generation failed')`.
  - [x] ⚠️ **Ne JAMAIS logger** : base64 des photos, `promptUsed` complet, data-URL d'image (aucune `redaction` configurée dans `config/logger.ts` → risque de fuite + volume). Logger seulement des métadonnées sûres.

### C. Backend — Endpoint `GET /api/admin/logs` paginé + filtre (AC: #1, #2)

- [x] Créer `app/services/logs_service.ts` (classe `@inject()`, conventions de `metrics_service.ts`) : requête paginée des générations, jointure `generation → design (template, user_id)`, estimation du coût € par génération, mapping de sortie (exposer le contexte mais **pas** le `prompt_used` brut en entier si volumineux — tronquer).
- [x] Ajouter l'action `async logs({ request, auth, response })` dans `app/controllers/admin_controller.ts` :
  - [x] Query params : `page` (déf. 1), `perPage` (déf. 20, **borné ≤ 100**), `status=failed` (filtre « échecs seulement » ; absent = toutes).
  - [x] Tri `created_at DESC` (récent d'abord).
  - [x] Pagination via Lucid `.paginate(page, perPage)` (⚠️ **aucun précédent dans le repo** — premier usage).
  - [x] Réponse `{ success: true, data: { meta: { total, perPage, currentPage, lastPage }, items: [...] } }` ; chaque item : `id, createdAt, status, iterationNumber, attempts, durationMs, geminiModel, costEurCents, costEstimated:true, errorMessage, template, userId` (+ contexte `promptUsed`/`feedback` tronqués pour AC#2).
  - [x] `logger.info({ event: 'admin_logs_viewed', userId }, ...)` comme les autres actions admin.
- [x] Ajouter la route dans le groupe protégé : `router.get('/logs', [AdminController, 'logs'])` (`start/routes.ts`, dans `.prefix('/api/admin').use([auth(), admin()])`).
- [x] *(Optionnel propre)* Ajouter `@belongsTo(() => User)` sur `app/models/design.ts` pour preload l'utilisateur, sinon jointure SQL `leftJoin('users', ...)`.

### D. Frontend — Page `/admin/logs` (remplace le placeholder) (AC: #1, #2)

- [x] Ajouter le composant shadcn `table` : `npx shadcn@latest add table` (style new-york → `src/components/ui/table.tsx`). ⚠️ **Nouveau composant UI copié** (pas une dépendance npm) — `table` était absent (noté en 6.2). Fallback : liste de `Card` (moins sémantique).
- [x] Ajouter `getAdminLogs(params)` + types `GenerationLog` / `GenerationLogsResult` dans `src/lib/api/admin.ts` (pattern existant : `fetch` `credentials:'include'`, `NEXT_PUBLIC_API_URL`, enveloppe `{success,...}` / `NETWORK_ERROR`). Aligner le contrat **exactement** sur la réponse de la tâche C (noms de champs, **coût en centimes** → `/100` à l'affichage).
- [x] Créer `src/components/siana/AdminGenerationLogs.tsx` (`'use client'`) — pattern `AdminDashboard.tsx` :
  - [x] **Fragment** rendu dans le `<main>` du shell — **PAS** de `<main>`, **PAS** de garde `getMe` (centralisé dans `AdminShell`).
  - [x] Table responsive (`<table>` sémantique, `<th scope="col">`) : Date/heure (`toLocaleString('fr-FR')`), User ID, Template, Durée (ms), Coût (€) (centimes/100 → `formatEur`), Statut (`Badge` `destructive`=échec).
  - [x] Toggle « Échecs seulement » (`Checkbox` + `<label>` associé) → refetch avec `status=failed`. **État local** (`useState`), pas d'URL/`Suspense` (cohérent dashboard).
  - [x] Lignes en échec : détail expansible (ou colonne dédiée) montrant `errorMessage` + contexte (timestamp, template, iteration, attempts).
  - [x] Pagination simple (Précédent/Suivant + indicateur page), état local.
  - [x] États : loading (skeleton `animate-pulse` + `aria-busy="true"`) ; vide bienveillant (« Aucune génération » / « Aucun échec sur la période » en mode filtre) ; erreur réseau → `toast.error` + état réessayable.
  - [x] ⚠️ Le shell limite à `max-w-4xl` — table potentiellement large : prévoir `overflow-x-auto` sur mobile.
- [x] Remplacer dans `src/app/admin/logs/page.tsx` : `<AdminComingSoon title="Logs de génération" />` → `<AdminGenerationLogs />` (conserver `export const metadata` noindex).

### E. Tests (AC: #1, #2, #3)

- [x] **Backend** `siana-memento-api/tests/functional/admin/logs.spec.ts` : 401 anonyme, 403 non-admin (`loginAs({isAdmin:false})`), 200 admin ; `meta.total` en **deltas** (base de dev partagée) ; filtre `status=failed` (créer générations `failed`/`completed` via factory `createGeneration(designId,{status})`) ; pagination (page=2). Suivre `tests/functional/admin/metrics.spec.ts` + `tests/helpers/auth.ts` + `factories.ts`.
- [~] **Backend** (persistance) : test que `generate` crée bien une ligne `Generation` (succès et échec mockés). **DÉFÉRÉ** : nécessite de mocker `generateDesignImage`/`GoogleGenAI` (fonction plate, pas d'injection) — non outillé dans la suite Japa actuelle. Le **chemin d'échec** de `generate` est déjà exercé par les tests existants (échec de chargement photo → logs `generation_failed` visibles dans le run de test) ; la persistance/wiring est validée par revue de code + les 5 tests de l'endpoint `/api/admin/logs` (qui lisent de vraies lignes `Generation`). Tracé dans `deferred-work.md`.
- [x] **Frontend e2e** `siana-memento-web/e2e/admin-logs.spec.ts` (Playwright) : réutiliser le helper `mockSession` de `admin-layout.spec.ts` + `context.route('**/api/admin/logs**', ...)`. Cas : table avec colonnes attendues ; toggle « échecs seulement » → query `status=failed` + lignes filtrées + message/contexte visibles ; coût formaté € fr-FR ; état vide ; erreur API → toast/état d'erreur sans crash ; pagination (clic Suivant → `page=2`).

## Dev Notes

### Contexte & périmètre

Story 6.4 = 4ᵉ story d'Epic 6. **Full-stack**. C'est la story qui **rend enfin observable le pipeline de génération** : aujourd'hui aucune ligne n'est écrite dans `generations` (le service ne persiste rien) et rien n'est loggé. Elle (a) persiste chaque génération, (b) la loggue via Pino, (c) expose un endpoint admin paginé, (d) remplace le placeholder `/admin/logs` (créé en Story 6.3) par une vraie table de logs. ⚠️ **Renumérotation** : cette story était l'« ancienne 6.3 » avant l'insertion du layout admin (correct-course 2026-06-01). [Source: epics.md#Story-6.4 ; sprint-change-proposal-2026-06-01.md]

### 🔑 Décision — Coût API = **estimation** (ne pas toucher `gemini_cost_usd`)

- La colonne `generations.gemini_cost_usd` (`decimal(10,6)`, nullable) est **réservée au coût réel** (en **USD**, cf. son nom). Mais **aucun prix unitaire Gemini ni taux USD→EUR n'existe** dans le code/env (vérifié). Introduire un coût réel = scope creep + arbitrage produit non tranché.
- **Décision 6.4** : laisser `gemini_cost_usd = null` ; afficher/logger un **coût estimé en €** = `GEMINI_COST_EUR_ESTIMATE` (~0,50€, déjà dans `start/env.ts`) par génération, avec un flag `costEstimated: true`. **Strictement cohérent avec `metrics_service.ts`** (qui estime déjà ainsi et documente `gemini_cost_usd` comme « non renseigné »). [Source: metrics_service.ts:6-7,34-44 ; start/env.ts:93 ; generation.ts:39]
- L'AC parle explicitement de « coût **estimé** » (AC#1) et « coût_api_**estimate** » (AC#3) → l'estimation satisfait l'AC. Le coût réel reste une dette tracée (`deferred-work.md`, 6.2).

### 🔑 Décision — Persistance dans le controller, refactor minimal du service

- `generateDesignImage` est une **fonction plate** qui ne voit pas le `design` ; elle ne peut pas créer la ligne. **Orchestration dans `designs_controller.ts::generate`** (qui a `design.id`, `userId`, template, `iterationNumber`, upload Cloudinary). Le service est refactoré pour **remonter** `{ imageDataUrl, attempts, durationMs, promptUsed, geminiModel }`. [Source: generation_service.ts ; designs_controller.ts:162-307]
- **UNE ligne `Generation` par appel** (pas par tentative). `attempts` = compteur. Idempotence importante pour le `generationsCount` du dashboard. [Source: rapport backend — pièges]

### État du code backend (vérifié)

- **Table `generations` + modèle `app/models/generation.ts` = déjà COMPLETS, AUCUNE migration nécessaire.** Colonnes : `id, design_id (FK→designs CASCADE), iteration_number, prompt_used (NOT NULL text), feedback?, status enum(pending|generating|completed|failed) def 'pending', gemini_model?, cloudinary_public_id?, cloudinary_url?, generation_duration_ms?, gemini_cost_usd decimal(10,6)?, error_message varchar(500)?, attempts def 1, timestamps`. Relations `Generation.belongsTo(Design)` + `Design.hasMany(Generation)` présentes. [Source: migration 1771677000200 ; generation.ts ; design.ts:63-64]
- **`generation_service.ts`** : fonctions plates, `generateDesignImage(...)`, modèle `gemini-2.5-flash-image`, `MAX_ATTEMPTS=3`, backoff 2/4/8s. **N'écrit RIEN en base, ne mesure pas la durée, ne calcule pas le coût, ne loggue pas, ne retourne ni `attempts` ni `promptUsed`.** Clé via `process.env.GEMINI_API_KEY!` (hors `env.ts` — ne pas « corriger » ici). [Source: generation_service.ts:205-345,293]
- **`designs_controller.ts::generate`** (`POST /api/designs/:id/generate`) : `userId = auth.user?.id ?? null` (auth optionnelle), template via `design.template`, `iterationNumber = design.iterationsUsed + 1`, upload Cloudinary après génération, `iterationsUsed` incrémenté **en succès uniquement**. Enveloppe `{success,data}`/`{success,error:{code,message}}`. [Source: designs_controller.ts:162-307,282]
- **`template` et `user_id` sont sur `designs`**, PAS sur `generations`. Chaîne : `generations.design_id → designs.id`, `designs.user_id → users.id` (nullable, SET NULL), `designs.template` enum. `Design` n'a pas encore `belongsTo(User)`. `users.full_name` nullable → identifiant fiable = `users.id`. [Source: designs migration ; design.ts ; user.ts]
- **Pino** : `config/logger.ts` (logger `'app'`, pretty en dev, JSON stdout en prod, **pas de redaction**). Usage maison : `import logger from '@adonisjs/core/services/logger'` puis `logger.info({ event:'...', ...ctx }, 'msg')`. Exemples : `email_service.ts:119-128`, `stripe_service.ts:85-94`, `health_controller.ts:51`. [Source: rapport backend §3-4]
- **`admin_controller.ts`** : `@inject()` + `MetricsService`, `response.ok({success:true,data})`, vérif admin 100% middleware (pas dans le controller), `logger.info({event,userId})`. **`.paginate()` utilisé nulle part** → premier usage. [Source: admin_controller.ts:27-40 ; metrics_service.ts]
- **Tests** : `tests/functional/admin/*.spec.ts` (`metrics.spec.ts`, `export_csv.spec.ts`), helper `loginAs(client,{isAdmin})` (`tests/helpers/auth.ts`), `withGlobalTransaction`, factory `createGeneration(designId,{status,iterationNumber})` (`factories.ts:124-141`). **Tests en deltas** (base de dev partagée avec données résiduelles — découverte 6.2). [Source: rapport backend §6 ; 6-2 Debug Log]

### État du frontend (vérifié)

- **Pattern route fine + composant `siana/`** : `logs/page.tsx` (Server Component, garde `metadata` noindex) → `<AdminGenerationLogs/>`. La page rend un **fragment** dans le `<main>` du shell (`AdminShell` : garde centralisé + `<main className="mx-auto max-w-4xl …">`). Ne PAS remettre `<main>`/garde. [Source: AdminShell.tsx ; admin/dashboard/page.tsx ; AdminDashboard.tsx:35-36]
- **Pattern data-fetch** (`AdminDashboard.tsx`) : `'use client'`, `useState` data/loading/error, `useEffect` fetch, `toast.error` sur échec système, skeleton `animate-pulse`, `formatEur` (`toLocaleString('fr-FR',{style:'currency',currency:'EUR'})`), `const SAGE='#2D4A3E'`. **Argent en centimes** côté API → `/100` avant `formatEur` (cf. commit `20cceab`). [Source: AdminDashboard.tsx:9-14,38-84]
- **shadcn dispo** : `badge` (variant `destructive` pour échec), `select`, `checkbox`, `skeleton`, `button`, `card`, `alert`, `dialog`, `input`, `label`. **PAS de `table`** → ajouter via `npx shadcn@latest add table`. Style new-york, lucide. [Source: rapport frontend §5 ; components.json]
- **Pagination/filtre** : aucune pagination n'existe dans le front. `useSearchParams` existe (login, sous `<Suspense>`). **Reco MVP : état local `useState`** pour `failedOnly`+`page` (évite le boilerplate Suspense, cohérent avec le dashboard). [Source: rapport frontend §6]
- **e2e** : réutiliser `mockSession` de `e2e/admin-layout.spec.ts` (route `**/auth/me`) + `context.route('**/api/admin/logs**', ...)`. [Source: admin-layout.spec.ts:18-32]

### Garde-fous anti-erreurs

- ❌ Ne PAS créer de migration (table `generations` déjà complète).
- ❌ Ne PAS écrire `gemini_cost_usd` ni introduire un taux USD→EUR / prix Gemini (scope creep) — coût = **estimation €** au read-time + Pino.
- ❌ Ne PAS créer plusieurs lignes `Generation` par appel `generate` (une seule ; `attempts` = compteur) — sinon le `generationsCount` du dashboard est faussé.
- ❌ Ne PAS faire échouer une génération réussie si l'insert/log échoue (écriture défensive).
- ❌ Ne PAS logger photos/`promptUsed` complet/data-URL via Pino (pas de redaction).
- ❌ Ne PAS remettre `<main>` ni garde `getMe` dans la page (centralisés dans `AdminShell`).
- ❌ Ne PAS afficher `0` pour un coût non calculable → cohérence avec la règle N/A du dashboard (mais ici le coût est toujours estimable → `GEMINI_COST_EUR_ESTIMATE`).
- ❌ Ne PAS modifier le comportement de `iterationsUsed` (incrément en succès uniquement).

### ⚠️ Impact cross-story (à signaler, pas une régression)

En persistant des lignes `generations`, le `generationsCount` de `metrics_service` (Story 6.2) deviendra **non-nul** → le **coût API estimé et la marge du dashboard 6.2 changeront** (aujourd'hui ~0 car aucune génération persistée ; le CSV affiche « Coût API = 0,00 »). C'est une **amélioration de justesse** (le dashboard reflètera enfin l'activité réelle), pas une régression. La Story 6.5 (alertes : taux d'erreur >5%, coût >0,70€/commande) **consommera** ces lignes. [Source: deferred-work.md (6.2) ; metrics_service.ts:69-84 ; epics.md#Story-6.5]

### Project Structure Notes

- **NEW backend** : `app/services/logs_service.ts` ; `tests/functional/admin/logs.spec.ts` (+ éventuel `logs_service.spec.ts`).
- **UPDATE backend** : `app/services/generation_service.ts` (signature de retour + mesure durée/attempts/prompt) ; `app/controllers/designs_controller.ts` (persistance `Generation` + logs Pino) ; `app/controllers/admin_controller.ts` (action `logs`) ; `start/routes.ts` (route `/api/admin/logs`) ; *(optionnel)* `app/models/design.ts` (`belongsTo(User)`).
- **NEW frontend** : `src/components/siana/AdminGenerationLogs.tsx` ; `src/components/ui/table.tsx` (shadcn) ; `e2e/admin-logs.spec.ts`.
- **UPDATE frontend** : `src/app/admin/logs/page.tsx` (placeholder → composant) ; `src/lib/api/admin.ts` (`getAdminLogs` + types).
- **READ-FOR-CONTEXT** : `app/services/metrics_service.ts`, `app/controllers/admin_controller.ts`, `config/logger.ts`, `tests/functional/admin/metrics.spec.ts`, `tests/factories.ts`, `src/components/siana/AdminDashboard.tsx`, `src/components/siana/AdminShell.tsx`, `src/lib/api/admin.ts`.
- **NE PAS TOUCHER** : `gemini_cost_usd` (réservé coût réel) ; le mécanisme de retry Gemini (logique inchangée, on l'instrumente seulement) ; les autres endpoints `/api/admin`.

### References

- [Source: epics.md#Story-6.4] (L995-1013) — user story + 3 AC verbatim (FR34, FR35, NFR-R8, NFR-I4)
- [Source: epics.md#Epic-6] (L902-907) — objectif epic, FR34/FR35, NFR-R8
- [Source: prd.md] — FR34 (logs génération), FR35 (historique erreurs IA), NFR-R8 (logs Pino JSON structuré), NFR-I4 (contexte d'erreur)
- [Source: code vérifié — backend] — `generation_service.ts` (flux, retry, n'écrit rien), `designs_controller.ts:162-307` (orchestration generate), `generation.ts`/migration `1771677000200` (schéma complet), `config/logger.ts` (Pino), `admin_controller.ts`/`metrics_service.ts` (patterns API admin), `start/routes.ts:80-88` (groupe admin), `tests/functional/admin/*` + `factories.ts` (tests/factories)
- [Source: code vérifié — frontend] — `AdminDashboard.tsx` (pattern fetch/format/skeleton), `AdminShell.tsx` (garde + `<main>` centralisés), `admin.ts` (helpers), `components.json` (pas de `table`)
- [Source: deferred-work.md] — coût API réel non persisté (dette 6.2) ; `gemini_cost_usd` réservé
- [Source: CLAUDE.md] — Pino + retry (3 tentatives, backoff 2→4→8s), Design System (Vert Sauge, badges statut), Frontend Conventions (toasts erreurs système, `sr-only`), WCAG AA

### Cross-story context (Epic 6)

- **6.1** ✅ done — healthcheck. **6.2** ✅ done — dashboard métriques (estime le coût ; sera enrichi par les lignes que 6.4 persiste). **6.3** ✅ done — layout/sidebar admin + placeholder `/admin/logs` (remplacé ici).
- **6.5** (Alertes) — consommera ces logs (taux d'erreur, coût) ; dépendance.
- **6.6/6.7/6.8** — autres surfaces admin.
[Source: sprint-status.yaml L86-95]

### Dependencies

- Story 6.2 ✅ done (auth admin `is_admin` + middleware, patterns API/service, dashboard). Story 6.3 ✅ done (layout admin + placeholder à remplacer). Epic 3 ✅ done (pipeline génération + table `generations`). Aucune dépendance bloquante. **Débloque la justesse du coût/marge du dashboard 6.2** et alimente la Story 6.5 (alertes).

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Claude Opus 4.8, 1M context)

### Debug Log References

- API `npm run typecheck` → exit 0.
- API `node ace test` → **171 passed** (dont 5 nouveaux `admin/logs`). 1 flake transitoire observé (`cleanup:rgpd`, collision `session_token` `Date.now()` — pré-existant, non lié) → **171/171 au re-run**.
- Le run de test a affiché en pratique les logs Pino structurés `event: 'generation_failed'` (chemin d'échec de `generate` exercé par les tests photo-fail existants) — preuve AC#3.
- Web `tsc --noEmit` → exit 0 ; `eslint` (fichiers story) → exit 0. ESLint a attrapé 2× la règle React 19 `set-state-in-effect` (mes effets) → corrigé sans suppression (`setLoading` dans les handlers, reset d'erreur dans le `.then`).
- Web e2e Playwright → **25/26** (5 `admin-logs` ✓, AC#5 `admin-layout` mis à jour ✓) ; seul échec = `home › hero` (« 15 minutes ») **préexistant et hors story**. Faux 500 Docker (cache Turbopack stale lisant `admin.ts` avant fin d'édit) diagnostiqué/résolu par recompile.

### Completion Notes List

- ✅ **AC#1** — `GET /api/admin/logs` (admin, paginé) renvoie chaque génération : `createdAt`, `userId`, `template`, `durationMs`, `apiCostCents` (+`costEstimated`), `status`. Page `/admin/logs` affiche la table (date, user, template, durée, coût €, statut badge).
- ✅ **AC#2** — filtre `failedOnly=true` (toggle « Échecs seulement ») → uniquement les `failed` ; détail expansible par ligne en échec : `errorMessage` complet + contexte (itération, tentatives, modèle, timestamp, payload `promptUsed`, feedback).
- ✅ **AC#3** — logging Pino JSON structuré dans le flux `generate` : `generation_succeeded` / `generation_failed` (`{ event, designId, userId, template, iterationNumber, attempts, durationMs, costEurEstimate, error }`). **Aucune** donnée sensible loggée (pas de photos/prompt/data-URL).
- **Persistance** — `generate` crée UNE ligne `Generation` par appel (succès `completed` + Cloudinary ; échec `failed` + `errorMessage` tronqué 500), via refactor de `generateDesignImage` (retourne `GenerationOutcome { success, imageDataUrl?, error?, attempts, durationMs, promptUsed, geminiModel }`, ne throw plus). Écriture **défensive** (`recordGeneration` try/catch — ne casse jamais une génération réussie). `iterationsUsed` toujours incrémenté en succès uniquement.
- **Coût = estimation EUR** (`GEMINI_COST_EUR_ESTIMATE`, flag `costEstimated:true`) ; `gemini_cost_usd` laissé null (réservé). Aucune migration. Aucun taux USD→EUR introduit.
- **Filtre** : choix de `failedOnly=true` (toggle binaire, aligné UI/e2e) plutôt que `status=failed` (déviation mineure assumée vs le draft de la story).
- **Test de persistance** non automatisé (mock Gemini non outillé) — voir item `[~]` Task E + `deferred-work.md`.
- ⚠️ **Effet cross-story attendu** : `generate` persiste maintenant des lignes `generations` → le `generationsCount` du dashboard 6.2 devient non-nul, donc coût API/marge passent de ~0 à des valeurs estimées réelles (amélioration de justesse).
- **Test e2e 6.3 mis à jour** : `admin-layout.spec.ts` AC#5 cliquait « Logs » (désormais implémenté) → bascule sur « Testimonials » (encore placeholder).

### File List

**NEW — backend**
- `siana-memento-api/app/services/logs_service.ts`
- `siana-memento-api/tests/functional/admin/logs.spec.ts`

**UPDATE — backend**
- `siana-memento-api/app/services/generation_service.ts` (retourne `GenerationOutcome` ; mesure durée/attempts, expose prompt/modèle ; ne throw plus)
- `siana-memento-api/app/controllers/designs_controller.ts` (persistance `Generation` + logs Pino dans `generate` ; helper `recordGeneration`)
- `siana-memento-api/app/controllers/admin_controller.ts` (injection `LogsService` + action `logs`)
- `siana-memento-api/start/routes.ts` (route `GET /api/admin/logs`)

**NEW — frontend**
- `siana-memento-web/src/components/siana/AdminGenerationLogs.tsx`
- `siana-memento-web/src/components/ui/table.tsx` (shadcn)
- `siana-memento-web/e2e/admin-logs.spec.ts`

**UPDATE — frontend**
- `siana-memento-web/src/app/admin/logs/page.tsx` (placeholder → `AdminGenerationLogs`)
- `siana-memento-web/src/lib/api/admin.ts` (`getAdminLogs` + types `GenerationLog`/`GenerationLogsData`)
- `siana-memento-web/e2e/admin-layout.spec.ts` (AC#5 : Logs → Testimonials, Logs étant désormais implémentée)

## Change Log

| Date | Version | Description | Auteur |
|------|---------|-------------|--------|
| 2026-06-02 | 0.1 | Story 6.4 créée (ready-for-dev) — persistance + logging Pino des générations, endpoint admin `/api/admin/logs` paginé + filtre échecs, page front remplaçant le placeholder. Coût = estimation € (gemini_cost_usd réservé). | create-story |
| 2026-06-02 | 1.0 | Implémentation 6.4 : refactor `generation_service` (GenerationOutcome) + persistance/log Pino dans `generate`, `LogsService` + `GET /api/admin/logs` (paginé, filtre `failedOnly`), page `/admin/logs` (table shadcn, toggle échecs, détail erreur, pagination). API 171/171 (5 tests logs) ; web tsc+eslint+25/26 e2e (1 préexistant). Coût estimé EUR ; persistance test déférée (mock Gemini). | Amelia (dev-story) |

## Review Findings

Revue de code adversariale (Blind Hunter + Edge Case Hunter + Acceptance Auditor), 2026-06-02. Les 3 ACs sont **satisfaites** et toutes les contraintes dures (ne pas écrire `gemini_cost_usd`, `errorMessage` tronqué à 500, une seule ligne `Generation` par appel, insert défensif, `iterationsUsed` incrémenté en succès uniquement, log Pino structuré) sont respectées.

### Patch

- [x] [Review][Patch] `page`/`perPage` non numériques (`?page=abc`) passent en `NaN` jusqu'à `paginate()` — `Number('abc')=NaN` (`admin_controller.ts:120-121`) et le clamp `Math.max(1, Math.trunc(NaN))=NaN` (`logs_service.ts:49-50`) ne récupère pas le `NaN` → `LIMIT/OFFSET NaN`. Coercer vers la valeur par défaut quand non fini. **Corrigé** : helper `sanitizeInt` (repli sur défaut si `!Number.isFinite`) + test fonctionnel `?page=abc&perPage=xyz` → page 1 / perPage 20. [siana-memento-api/app/services/logs_service.ts:49]
- [x] [Review][Patch] Data-URL malformé `base64,undefined` possible en succès — `if (part.inlineData)` (`generation_service.ts:342`) ne vérifie pas `.data` ; ligne 345 interpole `part.inlineData.data` qui peut être `undefined` → image corrompue uploadée vers Cloudinary comme un succès. Garder `if (part.inlineData?.data)`. **Corrigé** : garde `part.inlineData?.data`. [siana-memento-api/app/services/generation_service.ts:342]
- [x] [Review][Patch] Tri de pagination sans départage déterministe — `orderBy('created_at', 'desc')` seul (`logs_service.ts:53`) : deux lignes au même timestamp peuvent réapparaître ou être sautées entre pages adjacentes. Ajouter un tiebreaker `.orderBy('id', 'desc')`. **Corrigé** : `.orderBy('id', 'desc')` ajouté. [siana-memento-api/app/services/logs_service.ts:53]

### Defer

- [x] [Review][Defer] Échecs d'infrastructure non persistés en ligne `Generation` — Le `catch` du pipeline (`designs_controller.ts:360-372`) journalise `generation_failed` via Pino mais n'appelle pas `recordGeneration` ; seuls les échecs Gemini créent une ligne `failed`. Échec d'upload Cloudinary post-génération ou de chargement photo absent de la table admin. **Reporté (décision Aldo)** : AC2 vise l'historique des erreurs IA (Gemini) ; les erreurs infra sont suffisamment tracées par Pino — à revoir si le volume d'échecs upload le justifie. [siana-memento-api/app/controllers/designs_controller.ts:360]
- [x] [Review][Defer] Course concurrente sur `iterationsUsed` (double-spend d'itération) — deux appels `generate` simultanés sur le même design lisent la même valeur et passent tous deux en `generating`. Pré-existant : non introduit par la 6.4 (la 6.4 n'ajoute que le logging). [siana-memento-api/app/controllers/designs_controller.ts:215]
- [x] [Review][Defer] État vide filtré (« Aucun échec ») non couvert par e2e — le composant branche bien le message sur `failedOnly` (`AdminGenerationLogs.tsx:118-119`) mais `admin-logs.spec.ts` n'assert que le cas non filtré. Lacune de couverture de test, pas un défaut de comportement. [siana-memento-web/e2e/admin-logs.spec.ts]
- [x] [Review][Defer] Test write-side de `recordGeneration` (mapping des champs) — déféré et déjà tracé dans `deferred-work.md` (mock `generateDesignImage`/`GoogleGenAI` requis). [siana-memento-api/app/controllers/designs_controller.ts:193]

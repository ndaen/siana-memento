---
baseline_commit: 7bb1427
---

# Story 6.2: Dashboard Métriques Business et Export CSV

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'**admin Aldo**,
je veux **consulter les métriques essentielles et exporter les données en CSV**,
afin de **surveiller la santé financière du service et prendre des décisions marketing**.

## Acceptance Criteria

> Repris **verbatim** depuis `epics.md` (Story 6.2, lignes 937-960). Ne pas reformuler.

1. **Given** Aldo authentifié sur `/admin/dashboard`
   **When** il consulte la page
   **Then** il voit pour les 30 derniers jours : revenus totaux (€), nombre de commandes, coût API moyen par commande, marge brute estimée, taux de conversion (FR33)

2. **Given** le dashboard admin
   **When** Aldo consulte la section CAC
   **Then** il voit le coût d'acquisition client par canal (organique, paid, social, referral) si les données UTM sont disponibles (FR51)

3. **Given** Aldo sur le dashboard
   **When** il clique "Exporter CSV"
   **Then** un fichier CSV est téléchargé avec toutes les commandes de la période : date, montant, statut, coût API, marge (FR39)

4. **Given** un utilisateur non-admin tentant d'accéder à `/admin`
   **When** sa requête arrive
   **Then** il reçoit une redirection 401/403 — aucune donnée admin accessible (NFR-S10)

[Source: epics.md#Story-6.2-Dashboard-Métriques-Business-et-Export-CSV (lignes 937-960) — user story L939-941, AC1 L945-947, AC2 L949-951, AC3 L953-955, AC4 L957-959]

## Tasks / Subtasks

### A. Backend — Autorisation admin (AC: #4) — *fondation, à faire en premier*

- [x] **Task 1 — Rôle admin sur `User`**
  - [x] Migration NEW `..._add_is_admin_to_users_table.ts` : `table.boolean('is_admin').notNullable().defaultTo(false)`. (Décision : `is_admin` booléen plutôt que `ADMIN_EMAILS` env ou table de rôles — cf. Dev Notes § Décision auth admin. **À confirmer par Aldo.**)
  - [x] `app/models/user.ts` : ajouter `@column() declare isAdmin: boolean`.
  - [x] Promouvoir le compte d'Aldo : `UPDATE users SET is_admin=true WHERE email='daennoah@gmail.com'` (migration data ou commande ace de seed). ✅ email confirmé.
  - [x] Exposer `isAdmin` dans les réponses auth : `auth_controller.ts` → `me()` (L119-130), `login()`, `register()` ajoutent `isAdmin: user.isAdmin` au bloc `data.user`. **Ne pas** exposer d'autres champs sensibles. ⚠️ Sans cette étape le garde frontend est aveugle (il lit `getMe()` → `data.user.isAdmin`).
  - [x] Étendre `tests/helpers/factories.ts` pour permettre de créer un user `isAdmin: true` (nécessaire aux tests admin, Task 10).

- [x] **Task 2 — Middleware `admin` + groupe de routes protégé** (AC: #4)
  - [x] NEW `app/middleware/admin_middleware.ts` (pattern `auth_middleware.ts`) : suppose `auth` déjà passé ; si `!ctx.auth.user?.isAdmin` → `response.forbidden({ success:false, error:{ code:'FORBIDDEN', message:'Accès refusé' }})` (enveloppe standard projet). Sinon `next()`.
  - [x] `start/kernel.ts` : enregistrer `admin: () => import('#middleware/admin_middleware')` dans `router.named({...})`.
  - [x] `start/routes.ts` : nouveau groupe `router.group(() => { … }).prefix('/api/admin').use([middleware.auth(), middleware.admin()])`. **L'ordre importe** : `auth()` d'abord (peuple `auth.user`), `admin()` ensuite. La vraie barrière NFR-S10 est ICI (côté serveur), pas côté frontend.

### B. Backend — Métriques & coût API (AC: #1)

- [x] **Task 3 — Modèle `Generation` manquant + lecture du coût**
  - [x] NEW `app/models/generation.ts` (la migration `1771677000200` existe déjà avec `gemini_cost_usd decimal(10,6)`, `generation_duration_ms`, `status`, `design_id`…). `belongsTo(() => Design)`. `app/models/design.ts` : ajouter `@hasMany(() => Generation)`.
  - [x] **Ne PAS** modifier `generation_service.ts` ici (la persistance réelle du coût Gemini relève de la **Story 6.3** — voir Dev Notes § Coût API). Cette story se contente de **lire** `gemini_cost_usd` s'il est renseigné, sinon **estimer**.

- [x] **Task 4 — `MetricsService` (agrégation 30 jours)** (AC: #1)
  - [x] NEW `app/services/metrics_service.ts`. Une requête agrégée Postgres avec `FILTER (WHERE …)` sur `orders` (fenêtre `created_at >= now() - INTERVAL '30 days'`) :
    - `revenue` = `SUM(amount) FILTER (WHERE status='paid')` (en **centimes**, convertir en € à l'affichage).
    - `ordersCount` = `COUNT(*) FILTER (WHERE status='paid')`.
    - `avgApiCost` = coût API total / `ordersCount` (cf. coût ci-dessous).
    - `grossMargin` = `revenue − coûts API totaux`.
    - `conversionRate` = `ordersCount(paid) / designsCount(30j)` — proxy : pas de tracking visiteurs en base. **`designsCount` doit être borné sur la MÊME fenêtre 30j** (`designs.created_at >= now()-30d`), sinon ratio biaisé (commandes 30j / designs all-time). Si dénominateur 0 → `null` (afficher N/A, **jamais** 0).
  - [x] **Coût API** : la colonne `generations.gemini_cost_usd` est en **USD** mais (a) jamais renseignée aujourd'hui et (b) la persistance réelle est en 6.3. **Décision MVP simplificatrice** : ignorer la conversion USD→EUR (source de taux non fiable) et **estimer directement en EUR** : `coût total = GEMINI_COST_EUR_ESTIMATE (~0,50€) × nombre de générations` de la période. Si/quand 6.3 persiste un coût EUR fiable, basculer dessus. Ne PAS introduire de `USD_EUR_RATE` (sur-ingénierie pour une colonne vide). Documenter « estimation MVP » en commentaire.
  - [x] Montants en **centimes (integer)** côté DB ; conversion en € (2 décimales) uniquement à la sérialisation. Jamais de float pour l'argent.
  - [x] **Migration index** (NEW) : `(orders.created_at, orders.status)` pour la fenêtre temporelle + filtre statut (NFR-SC3, jusqu'à 10K commandes sans refactoring). À faire, pas optionnel.
  - [x] **Colonne de filtrage temporel** : utiliser `created_at` pour la cohérence (commande créée dans les 30j). *Alternative défendable : `paid_at` pour ne compter que les revenus encaissés dans la fenêtre — à trancher ; par défaut `created_at` partout pour rester simple et cohérent entre métriques et CSV.*

- [x] **Task 5 — Section CAC (dégradation propre)** (AC: #2)
  - [x] Les **données UTM sont absentes** en base (vérifié). Conformément à l'AC2 (« si les données UTM sont disponibles ») : renvoyer le CAC par canal en **`N/A`** (jamais `0`) avec un libellé « Données UTM non collectées ».
  - [x] **Ne PAS** ajouter de colonnes UTM ni de table `marketing_spend` dans cette story (scope creep — relève d'une story de tracking dédiée). Juste exposer la structure CAC avec valeurs `null`/`N/A` pour les 4 canaux **de l'AC2** : organique, paid, social, referral. ⚠️ **Nomenclature** : FR51 (prd.md L1592) emploie `Google Ads / Facebook / Organic / Referral` ; la story se cale sur l'AC2 (organique/paid/social/referral) — quand le tracking arrivera (story future), normaliser ces deux listes.

### C. Backend — Export CSV (AC: #3)

- [x] **Task 6 — Endpoint export CSV**
  - [x] Route `GET /api/admin/metrics/export-csv` (dans le groupe admin protégé ; pas de rate limiter strict, ou `downloadThrottle` léger).
  - [x] `AdminController.exportCsv()` : récupère **toutes les commandes de la période** ; colonnes **exactes de l'AC3** : `date, montant, statut, coût API, marge`. Preload `design.generations` (relation `hasMany` créée en Task 3) pour le coût par commande — `OrdersController` ne preload aujourd'hui que `design`, étendre la requête ici.
  - [x] Génération **en mémoire** (volume MVP modeste — pas de streaming). Utiliser **`@fast-csv/format`** (décision Aldo) pour le quoting RFC 4180 → `npm i @fast-csv/format` (nouvelle dépendance **validée**). En-têtes : `Content-Type: text/csv; charset=utf-8` + `Content-Disposition: attachment; filename="commandes-<YYYY-MM-DD>.csv"`. Préfixer un **BOM UTF-8** pour Excel FR.
  - [x] **Statut inclus dans le CSV** : exporter **toutes** les commandes de la période, tous statuts confondus (`pending`/`paid`/`failed`) — utile à l'audit ; la colonne `statut` les distingue. ⚠️ Le « nombre de commandes » du dashboard (Task 4) ne compte que `paid` → le CSV aura potentiellement **plus de lignes** que ce compteur ; c'est voulu (documenter pour éviter la confusion).
  - [x] **Anti-injection CSV** : sanitizer tout champ texte d'origine utilisateur commençant par `= + - @`, TAB, CR (préfixe `'`). Ici les colonnes sont surtout numériques/dates/statuts (faible risque), mais appliquer la règle si un champ libre est inclus.

- [x] **Task 7 — `AdminController` + route métriques** (AC: #1, #2)
  - [x] NEW `app/controllers/admin_controller.ts` (`@inject()` `MetricsService`). `metrics()` → `response.ok({ success:true, data:{ revenue, ordersCount, avgApiCost, grossMargin, conversionRate, cac } })` (enveloppe standard projet). `exportCsv()` (Task 6).
  - [x] Route `GET /api/admin/metrics` dans le groupe admin.
  - [x] Logger chaque accès admin : `logger.info({ event:'admin_metrics_view'|'admin_csv_export', userId })`.

### D. Frontend — Page dashboard + garde admin (AC: #1, #2, #3, #4)

- [x] **Task 8 — Garde admin côté frontend**
  - [x] `src/lib/api/auth.ts` : ajouter `isAdmin?: boolean` à l'interface `User`. ⚠️ `getMe()` lit déjà `json.data.user` → **ne pas modifier `getMe()`** ; il suffit d'ajouter le champ à l'interface (et le backend l'expose via Task 1). Le statut admin transite par le cookie session + `/auth/me`, jamais par localStorage.
  - [x] NEW `src/lib/api/admin.ts` : `getAdminMetrics()` (fetch `/api/admin/metrics`, `credentials:'include'`) + helper d'URL pour l'export CSV.
  - [x] Garde : route group `src/app/(admin)/` + `layout.tsx` (ou page guard façon `OrdersPage` : `getMe()` en `useEffect` → si `!success` redirect `/login` ; si `success` mais `!isAdmin` redirect `/orders`). **Rappel sécurité** : ce garde est UX seulement — la vraie protection est l'API (Task 2). Ne **jamais** stocker le statut admin en localStorage.

- [x] **Task 9 — Page `/admin/dashboard`** (AC: #1, #2, #3)
  - [x] NEW `src/app/(admin)/dashboard/page.tsx` (wrapper minimal) + composant `src/components/siana/AdminDashboard.tsx`.
  - [x] **Cartes métriques** (KPI) via `Card`/`CardContent` shadcn (déjà dispo) — pas besoin de `table` shadcn pour les KPI : revenus €, nb commandes, coût API moyen €, marge brute €, taux de conversion %. Afficher **N/A** proprement quand `null`.
  - [x] **Section CAC** : 4 canaux, valeurs `N/A` + libellé « Données UTM non collectées » (conforme AC2).
  - [x] **Bouton « Exporter CSV »** : déclenche le download (lien direct vers l'endpoint protégé avec cookie, ou fetch→blob). Le navigateur enregistre via `Content-Disposition`.
  - [x] Design system : Vert Sauge `#2D4A3E`, fonts ClashDisplay/Satoshi, WCAG AA. Interface **simple** (PRD : « pas fancy » ; pas de graphiques temporels — Growth). États : loading (skeleton), vide (aucune commande → message neutre), erreur (toast `sonner` pour erreur système).
  - [~] *(Optionnel, NON retenu)* installer `table` shadcn — non nécessaire : dashboard en cartes KPI (`Card`) + bouton export, pas de tableau de commandes. `table` shadcn non installé.

### E. Tests (AC: #1, #2, #3, #4)

- [x] **Task 10 — Tests backend (Japa)**
  - [x] `tests/functional/admin/metrics.spec.ts` : 200 + structure métriques pour un admin ; **403** pour un user non-admin ; **401** non authentifié. (Helper : créer un user `isAdmin:true` via factory + login.)
  - [x] `tests/functional/admin/export_csv.spec.ts` : 200 + `Content-Type: text/csv` + `Content-Disposition` attachment pour admin ; 403 non-admin. Vérifier colonnes d'en-tête (`date,montant,statut,coût API,marge`).
  - [x] *(si MetricsService a une logique d'agrégation non triviale)* `tests/functional/admin/metrics_service.spec.ts` : revenus/marge/conversion sur jeu de commandes seedé ; conversion `null` si 0 design.

## Dev Notes

### Contexte
Story 6.2 = 2ᵉ story d'Epic 6. Crée le **premier espace admin** du produit (aucune surface admin n'existe encore). Full-stack : autorisation admin (backend + frontend), agrégation de métriques, export CSV. Interface volontairement **basique** (PRD : dashboard « simple, pas fancy » ; graphiques temporels & analytics avancés = **Growth**, hors scope). [Source: epics.md#Epic-6 L902-907 ; #Story-6.2 L937-960 ; prd.md MVP Feature 6]

### 🔑 Compte admin à promouvoir — ✅ `daennoah@gmail.com` (décision Aldo, 2026-05-31)
Seed/promotion : `UPDATE users SET is_admin=true WHERE email='daennoah@gmail.com'`. C'est le compte qui aura accès à `/admin`. (À exécuter via une migration data ou une commande ace de seed ; le compte doit exister en base — sinon créer/se connecter une première fois puis promouvoir.)

### 🔑 Décision ACTÉE (Aldo, 2026-05-31) — Autorisation admin = `is_admin` booléen en DB
- ✅ **`is_admin` (colonne `users`, default false)** + middleware `admin` AdonisJS — propre, persistant, testable, pas de redéploiement pour changer d'admin. (Alternatives écartées : `ADMIN_EMAILS` env = couplé au déploiement ; table `roles` = sur-ingénierie pour 1 admin.)
- Le JWT/session de l'archi mentionne un champ `role` mais **rien n'est implémenté** (`User` n'a ni `role` ni `is_admin` — vérifié). [Source: code `app/models/user.ts` ; architecture.md silence — § conflits ; tech research]
**Sécurité (NFR-S10)** : vérifier l'admin **côté serveur sur chaque requête** (middleware `admin`). Le garde frontend est cosmétique. Ne jamais se fier au seul middleware Next.js (CVE-2025-29927) ni au client (cf. [[project_localstorage_security_bug]]).

### 🔑 Décision — Coût API & marge (dépendance Story 6.3)
- La colonne `generations.gemini_cost_usd decimal(10,6)` **existe** (migration `1771677000200`) **mais** : (a) pas de modèle `generation.ts`, (b) `generation_service.ts` **n'écrit jamais** ce coût, (c) c'est en **USD**, (d) le lien au coût par commande passe par `order → design → generations`.
- **La persistance réelle du coût Gemini relève de la Story 6.3** (« Logs de Génération et Historique Erreurs IA », logue `coût_api_estimate`). Pour ne pas bloquer 6.2 : **lire** `gemini_cost_usd` si présent (convertir USD→EUR via constante env), **sinon estimer** via `GEMINI_COST_EUR_ESTIMATE` (~0,50€/génération). Documenter « estimation MVP ».
- ⚠️ Le PRD parle de **~0,50€/génération** (cible ≤0,60€/commande), pas de la fourchette « 0,31–0,55€ » du CLAUDE.md (qui n'apparaît pas dans le PRD). Utiliser ~0,50€ comme défaut d'estimation.
- **Marge brute = revenus − coûts API** (définition PRD). Montants en **centimes**, calcul en SQL, conversion € à l'affichage.

### 🔑 Décision — Taux de conversion & CAC (données partielles)
- **Conversion** : pas de tracking visiteurs/sessions en base. Proxy MVP = `commandes payées / designs créés` sur 30j. Si dénominateur 0 → `null` → afficher **N/A** (jamais 0). [Source: backend analysis ; tech research]
- **CAC (FR51)** : **données UTM absentes** → afficher **N/A** par canal (« Données UTM non collectées »). Conforme à l'AC2 (« si les données UTM sont disponibles »). **Ne pas** ajouter de colonnes UTM ni table `marketing_spend` ici (scope creep).
- **Règle d'or** : une métrique sans données fiables affiche **N/A**, jamais une valeur calculée sur un dénominateur nul.

### État du code (vérifié)
- **`orders`** (`app/models/order.ts`) : `id, userId, designId, stripeSessionId?, stripePaymentIntentId?, amount (centimes, default 1990), status ('pending'|'paid'|'failed'), paidAt?, emailSentAt?, createdAt, updatedAt`. `belongsTo(User)`, `belongsTo(Design)`. → source des revenus/commandes/CSV.
- **`generations`** (migration, pas de modèle) : `design_id, iteration_number, prompt_used, feedback?, status, gemini_model?, cloudinary_*?, generation_duration_ms?, gemini_cost_usd decimal(10,6)?, error_message?, attempts, timestamps`.
- **`user`** : `id, fullName?, email, provider, providerId?, password?(serializeAs:null), timestamps` — **aucun** champ admin.
- **Auth** : `auth_middleware.ts` (`authenticateUsing`) ; `start/kernel.ts` named middleware `guest`/`auth`/`silentAuth` ; `/auth/me` (`auth_controller.ts` L119-130) renvoie `{id,email,fullName}`.
- **Conventions** : ESM, alias `#…`, services plats `app/services/`, controllers `*_controller.ts` (`@inject()`), enveloppe `{success,data}` / `{success,error:{code,message}}`, erreurs mappées dans `app/exceptions/handler.ts`. Voir [[project_api_stack_testing]].

### État du frontend (vérifié)
- **Next.js 16.1.6 / React 19**, App Router sous **`src/app/`** (groupes `(auth)`, `(public)`, `design-system`, `orders`). Composants `src/components/ui/` (shadcn) + `src/components/siana/`. API helpers `src/lib/api/{auth,orders,designs,upload}.ts`. Store Zustand `src/stores` (génération uniquement).
- **Auth client** : cookie session AdonisJS ; `getMe()` → `/auth/me` avec `credentials:'include'`. Page protégée type = `OrdersPage` (`getMe()` en `useEffect` + `router.replace`). **Pas d'auth store** : `getMe()` appelé au mount.
- **shadcn dispo** : button, card, input, label, dropdown-menu, checkbox, select, textarea, alert, badge, progress, skeleton, dialog, form. **PAS de `table`** → l'installer si besoin, sinon Card grid.
- **CSV download** : lien direct vers l'endpoint protégé (cookie) ou fetch→blob ; le navigateur enregistre via `Content-Disposition`.
- **`NEXT_PUBLIC_API_URL`** pour joindre l'API.

### Nouvelle dépendance (à valider)
Export CSV : `@fast-csv/format` (ou `papaparse`) recommandé pour le quoting RFC 4180 plutôt que concaténation manuelle. ⚠️ **Ajout de dépendance** → le dev doit le signaler/valider (règle workflow : nouvelles deps = approbation). Alternative sans dépendance : petit util CSV maison + sanitization manuelle (acceptable vu le faible nombre de colonnes).

### UX (cadrage minimal)
La spec UX **ne contient pas** de section dédiée au dashboard admin (vérifié — l'admin n'a pas reçu de traitement UX). Seul cadrage : un diagramme « Parcours Support (Aldo Admin) » (Dashboard → Monitoring Coûts & Erreurs ; Dashboard → Historique Commandes → renvoi manuel si delivery fail). Réutiliser les patterns transverses : shadcn/Radix/Tailwind, états vides bienveillants, erreurs en toast, WCAG AA, Vert Sauge sur Blanc Glace. **Ne pas inventer** de sidebar/cartes/polling depuis l'UX spec. [Source: ux-design-specification.md § Parcours Support (Aldo Admin)]

### ⚠️ Conflits inter-sources (signalés, ne pas propager)
1. **Auth admin** : archi muette sur le mécanisme (seul indice : `role` dans le JWT, non implémenté) alors que AC4 + NFR-S10 l'exigent → décision prise ici (`is_admin`).
2. **Persistance du coût API** : coût seulement en logs Pino dans l'archi, mais CSV/marge par commande exigent un coût joignable → lecture `gemini_cost_usd` + estimation fallback, persistance réelle = 6.3.
3. **Canal d'alerte (email vs Discord)** : hors scope 6.2 (relève de 6.4) — ne rien implémenter d'alerting ici.
4. **Excel** : FR39 dit « CSV, Excel » mais l'AC3 ne demande que **CSV** → CSV uniquement.
5. **« Temps réel »** : PRD évoque temps réel mais SSE/WebSocket exclus du MVP → recalcul au chargement de page, pas de polling.

### Garde-fous anti-erreurs
- ❌ Ne pas protéger l'admin uniquement côté frontend (la barrière = middleware API).
- ❌ Ne pas afficher `0` pour une métrique non calculable → `N/A`.
- ❌ Ne pas utiliser de float pour l'argent (centimes integer, conversion à l'affichage).
- ❌ Ne pas modifier `generation_service.ts` (persistance coût = 6.3).
- ❌ Ne pas ajouter colonnes UTM / table marketing_spend (hors scope).
- ❌ Ne pas implémenter de graphiques temporels / analytics avancés (Growth).
- ❌ Ne pas casser les routes/endpoints existants ; le groupe `/api/admin` est additif.

### Project Structure Notes
- **NEW backend** : migration `is_admin` ; `app/models/generation.ts` ; `app/middleware/admin_middleware.ts` ; `app/controllers/admin_controller.ts` ; `app/services/metrics_service.ts` ; `tests/functional/admin/*.spec.ts`.
- **UPDATE backend** : `app/models/user.ts` (+`isAdmin`) ; `app/models/design.ts` (+`hasMany Generation`) ; `app/controllers/auth_controller.ts` (`me`/`login`/`register` exposent `isAdmin`) ; `start/kernel.ts` (named `admin`) ; `start/routes.ts` (groupe `/api/admin`) ; `start/env.ts` (+`GEMINI_COST_EUR_ESTIMATE`, et taux USD→EUR si retenu) ; `package.json` (dép CSV si retenue).
- **NEW frontend** : `src/lib/api/admin.ts` ; `src/app/(admin)/layout.tsx` ; `src/app/(admin)/dashboard/page.tsx` ; `src/components/siana/AdminDashboard.tsx`.
- **UPDATE frontend** : `src/lib/api/auth.ts` (+`isAdmin` sur `User`).
- **READ-FOR-CONTEXT** : `app/middleware/auth_middleware.ts`, `app/controllers/orders_controller.ts` (preload/serialize), `app/models/order.ts`, `src/components/siana/OrdersPage.tsx` (garde), `src/components/siana/SiteHeader.tsx` (getMe), `src/lib/api/orders.ts` (fetch+credentials), `src/components/ui/card.tsx`.

### References
- [Source: epics.md#Story-6.2] (L937-960) — user story + 4 AC verbatim
- [Source: epics.md#Epic-6] (L902-907) — objectif epic, NFR-S10/NFR-SC3
- [Source: prd.md] — FR33 (dashboard métriques), FR39 (export CSV/Excel), FR51 (CAC par canal), NFR-S10 (admin protégé), NFR-SC3 (10K commandes), MVP Feature 6 (dashboard basique, Google Sheets OK), exclusions Growth (graphiques/analytics avancés)
- [Source: prd.md — définitions chiffrées] — prix 19,90€ ; coût Gemini ~0,50€/génération (cible ≤0,60€/commande) ; marge brute = revenus − coûts API ; conversion = commandes/visiteurs (objectif ≥5%) ; seuil alerte coût 0,70€/commande (→ 6.4)
- [Source: architecture.md] — `AnalyticsService` + requêtes SQL agrégées + CSV export (pas de service tiers) ; observabilité Pino+Discord+UptimeRobot ; conflits auth admin & persistance coût signalés
- [Source: code vérifié] — `orders`/`generations`/`user` schémas, `auth_middleware`, `/auth/me`, frontend `src/app` + `getMe()` pattern, shadcn sans `table`
- Recherche tech (2025) : `is_admin` vs roles ; middleware AdonisJS admin après auth ; agrégation Postgres `FILTER (WHERE)` + argent en centimes + index `(created_at,status)` ; CSV en mémoire + RFC 4180 + BOM UTF-8 + anti-injection CSV (OWASP) ; CAC → N/A si UTM absents ; défense en profondeur Next.js (CVE-2025-29927)

### Cross-story context (Epic 6)
- **6.1** ✅ done — pose le pattern de protection admin (NFR-S10) ; la 6.2 introduit le **vrai** mécanisme d'auth admin réutilisable par 6.3/6.5/6.6.
- **6.3** — Logs génération & coûts IA : **persiste le coût Gemini réel** (`coût_api_estimate`) que la 6.2 ne fait qu'estimer/lire. Dépendance forte.
- **6.4** — Alertes seuils (taux erreur >5%, coût >0,70€/commande) : réutilise les métriques de la 6.2.
- **6.5** — Renvoi manuel + backups : autres surfaces du même espace admin.
[Source: epics.md L963-1033]

### Dependencies
- Story 6.1 ✅ done (pattern protection admin). Story 4.1 ✅ done (table `orders`). Epic 2 ✅ done (auth). Story 1.2 ✅ done (Postgres/Railway).
- **Dépendance douce sur 6.3** pour le coût API réel (contournée par estimation au MVP).

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Claude Opus 4.8, 1M context)

### Debug Log References

- `node ace migration:run --force` → 3 migrations appliquées (is_admin, index orders, promotion admin). `migration:status` → toutes `completed`.
- `npm run typecheck` (API) → OK ; `tsc --noEmit` (web) → OK.
- Lint des fichiers de la story (API + web) → propre. (Le `npm run lint` global du web remonte des erreurs **préexistantes** hors story : `ThemeToggle.tsx` setState-in-effect, `<img>` warnings, `_user` unused — non touchées.)
- `node ace test` → **165 passed (165)** dont 10 admin (4 metrics endpoint, 3 export CSV, 4 metrics_service — variation). 0 régression.
- 🔎 **Découverte** : la base de dev partagée (port 5435) contient des données committées résiduelles ; `withGlobalTransaction` isole les insertions du test mais pas le préexistant → tests d'agrégation écrits en **deltas** (avant/après) plutôt qu'en totaux absolus.

### Completion Notes List

- ✅ **AC#1** — `GET /api/admin/metrics` (admin) → 200 `{ revenue, ordersCount, avgApiCost, grossMargin, conversionRate, apiCostEstimated, cac }` sur 30j. Revenus/commandes = `status='paid'` via `FILTER (WHERE)`, argent en centimes → €.
- ✅ **AC#2** — CAC : UTM absentes → `utmAvailable:false` + 4 canaux `null` (affichés **N/A**, jamais 0). Aucune colonne UTM ajoutée (scope respecté).
- ✅ **AC#3** — `GET /api/admin/metrics/export-csv` → CSV `@fast-csv/format`, colonnes `Date, Montant (€), Statut, Coût API (€), Marge (€)`, **toutes** les commandes de la période, `Content-Disposition: attachment`, BOM UTF-8, anti-injection formule.
- ✅ **AC#4** — groupe `/api/admin` = `middleware.auth()` puis `middleware.admin()` → **401** anonyme, **403** non-admin (vérif serveur, barrière réelle) + garde frontend cosmétique.
- **Coût API = estimation MVP** (`GEMINI_COST_EUR_ESTIMATE` ~0,50€ × nb générations) ; persistance réelle = **Story 6.3** (`apiCostEstimated:true`). `generation_service.ts` non modifié.
- **Conversion** = commandes payées / designs créés (même fenêtre 30j) ; `null`→N/A si 0 design.
- **Promotion admin** : migration `1775900000200` → `UPDATE users SET is_admin=true WHERE email='daennoah@gmail.com'` (idempotente, `this.defer`).
- **Déviations assumées** : route sous `src/app/admin/dashboard/` (URL conforme) au lieu d'un group `(admin)` ; garde dans le composant (pattern `OrdersPage`), pas de `layout.tsx`/`middleware.ts` Next ; `table` shadcn non installé ; tests en deltas.

### File List

**NEW — backend**
- `siana-memento-api/database/migrations/1775900000000_add_is_admin_to_users_table.ts`
- `siana-memento-api/database/migrations/1775900000100_add_index_to_orders_created_status.ts`
- `siana-memento-api/database/migrations/1775900000200_promote_admin_user.ts` *(rendue inerte post-review — promotion via commande ace)*
- `siana-memento-api/commands/admin_promote.ts` *(post-review P7)*
- `siana-memento-api/app/models/generation.ts`
- `siana-memento-api/app/middleware/admin_middleware.ts`
- `siana-memento-api/app/services/metrics_service.ts`
- `siana-memento-api/app/controllers/admin_controller.ts`
- `siana-memento-api/tests/functional/admin/metrics.spec.ts`
- `siana-memento-api/tests/functional/admin/export_csv.spec.ts`
- `siana-memento-api/tests/functional/admin/metrics_service.spec.ts`

**UPDATE — backend**
- `siana-memento-api/app/models/user.ts` (+`isAdmin`)
- `siana-memento-api/app/models/design.ts` (+`hasMany(Generation)`)
- `siana-memento-api/app/controllers/auth_controller.ts` (`me`/`login`/`register` exposent `isAdmin`)
- `siana-memento-api/start/kernel.ts` (named middleware `admin`)
- `siana-memento-api/start/routes.ts` (groupe `/api/admin`)
- `siana-memento-api/start/env.ts` (+`GEMINI_COST_EUR_ESTIMATE`)
- `siana-memento-api/tests/helpers/auth.ts` (`loginAs` supporte `isAdmin`)
- `siana-memento-api/.env` / `.env.example` (+`GEMINI_COST_EUR_ESTIMATE`)
- `siana-memento-api/package.json` / `package-lock.json` (+`@fast-csv/format`)

**NEW — frontend**
- `siana-memento-web/src/lib/api/admin.ts`
- `siana-memento-web/src/app/admin/dashboard/page.tsx`
- `siana-memento-web/src/components/siana/AdminDashboard.tsx`

**UPDATE — frontend**
- `siana-memento-web/src/lib/api/auth.ts` (+`isAdmin?` sur `User`)

## Change Log

| Date | Version | Description | Auteur |
|------|---------|-------------|--------|
| 2026-05-31 | 0.1 | Story 6.2 créée (ready-for-dev) — dashboard métriques + export CSV + auth admin. | create-story |
| 2026-05-31 | 1.0 | Implémentation 6.2 : `is_admin` + middleware admin, `/api/admin/metrics` (30j, FILTER WHERE, centimes), export CSV `@fast-csv` (BOM + anti-injection), page `/admin/dashboard` (KPI + N/A CAC), 10 tests admin. 165/165 verts. Coût API estimé (réel → 6.3). | Amelia (dev-story) |
| 2026-05-31 | 1.1 | Corrections post-review (P1–P7) : argent en centimes (CSV), `login()` expose `isAdmin`, garde frontend distingue panne réseau, fenêtre 30j en UTC déterministe, double colonne marge (réelle/prévisionnelle), commande `ace admin:promote` idempotente (migration de promotion inerte), test coût/marge avec générations. 167/167 verts. | Amelia (review-fixes) |

### Review Findings

> Code review adversariale (3 couches : Blind Hunter / Edge Case Hunter / Acceptance Auditor) — 2026-05-31, baseline `7bb1427..4f0ae42`. Les 4 AC sont SATISFAITS ; findings ci-dessous = qualité/robustesse/sémantique. Aucun finding ne bloque les AC.

**Decision-needed** (résolues par Aldo, 2026-05-31) :

- [x] [Review][Decision→Defer] Sémantique coût API / marge brute / coût moyen — **Résolu : différé à la Story 6.3.** Aujourd'hui le coût est 0 partout (générations non persistées) → aucune donnée réelle pour trancher. Re-statuer quand 6.3 persiste le coût réel. [metrics_service.ts:82-84]
- [x] [Review][Decision→Patch] CSV — commandes non payées : montant plein + marge positive — **Résolu : design à deux colonnes de marge** (voir P6). `Marge réelle = (paid ? montant : 0) − coût` ; `Marge prévisionnelle = montant − coût`. [admin_controller.ts:56-67]
- [x] [Review][Decision→Patch] Bootstrap admin en production — **Résolu : commande `ace` idempotente** `admin:promote <email>` (voir P7), rejouable, qui log le nb de promotions (WARN si 0). Migration de promotion retirée/inerte. [1775900000200_promote_admin_user.ts:12-16]

**Patch** (correctif non ambigu) — ✅ **tous appliqués 2026-05-31** :

- [x] [Review][Patch] P1 — `exportCsv` : calculs d'argent passés en **centimes integer** (`centsToEur()` à l'affichage), plus de float. [admin_controller.ts]
- [x] [Review][Patch] P2 — `login()` expose désormais `isAdmin` (aligné avec `register()`/`me()`). [auth_controller.ts]
- [x] [Review][Patch] P3 — Garde admin frontend : `NETWORK_ERROR` → état d'erreur dédié (`authError` + toast), plus de redirection `/login` sur panne réseau. [AdminDashboard.tsx]
- [x] [Review][Patch] P4 — Fenêtre 30j déterministe `.toUTC().toSQL({ includeOffset: false })` dans `metrics_service.ts` ET `admin_controller.ts`.
- [x] [Review][Patch] P5 — Helper `createGeneration()` ajouté + test « subtracts estimated API cost per generation » (coût/marge avec générations non nulles). [factories.ts, metrics_service.spec.ts]
- [x] [Review][Patch] P6 — CSV : colonnes `Marge réelle (€)` (`(paid ? montant : 0) − coût`) + `Marge prévisionnelle (€)` (`montant − coût`), calcul en centimes. [admin_controller.ts]
- [x] [Review][Patch] P7 — Commande `node ace admin:promote <email>` idempotente (log nb promotions, WARN si 0) ; migration `1775900000200` rendue **inerte** (no-op). [commands/admin_promote.ts]

**Defer** (réel mais non actionnable maintenant) :

- [x] [Review][Defer] D1 — Sémantique coût/marge (coût toutes générations vs revenu payé) [metrics_service.ts:82-84] — deferred, à statuer avec le coût réel persisté en Story 6.3

- [x] [Review][Defer] Coût API réel non persisté → CSV coût=0,00 / marge=montant aujourd'hui [admin_controller.ts:57] — deferred, dépend de Story 6.3 (documenté)
- [x] [Review][Defer] Index manquants sur `generations.created_at` et `designs.created_at` (seul `orders` indexé) [1775900000100 migration] — deferred, scalabilité NFR-SC3, non bloquant au MVP
- [x] [Review][Defer] Export CSV généré en mémoire sans pagination (~10K commandes × preload generations) [admin_controller.ts:49-52] — deferred, scalabilité, non bloquant au MVP
- [x] [Review][Defer] Download CSV via `<a href>` affiche le JSON brut si la session a expiré (pas de toast) [AdminDashboard.tsx + admin.ts] — deferred, UX mineure, approche `<a href>` autorisée par la spec

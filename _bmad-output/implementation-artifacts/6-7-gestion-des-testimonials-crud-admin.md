---
baseline_commit: c6e4602
---
<!-- Story 6.7 — générée par create-story (BMad). Contexte-complet pour dev-story. -->

# Story 6.7: Gestion des Testimonials (CRUD Admin)

Status: ready-for-review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'admin Aldo,
je veux gérer les testimonials de la landing page (ajouter, modifier, activer, supprimer),
afin de contrôler la preuve sociale présentée aux visiteurs sans redéploiement.

## Acceptance Criteria

1. **Given** Aldo sur `/admin/testimonials` **When** il crée un nouveau testimonial **Then** le formulaire accepte : prénom client, texte du témoignage, statut actif/inactif (FR50).
2. **Given** un testimonial actif **When** Aldo le désactive **Then** il disparaît immédiatement de la landing page sans redéploiement (flag `is_active`) (FR50).
3. **Given** un testimonial activé depuis le dashboard **When** un visiteur recharge la landing page **Then** le testimonial apparaît dans la section Story 5.3 sans redéploiement Vercel.
4. **Given** Aldo souhaitant supprimer définitivement un testimonial **When** il confirme la suppression **Then** le testimonial est supprimé de la base de données (FR50).

[Source: epics.md#Story-6.7 L1069-1091 — user story + 4 AC verbatim ; prd.md FR50 L1586]

## 🔑 Décisions structurantes (lire avant de coder)

### D1 — Modèle de données = **prénom + texte + is_active UNIQUEMENT** (pas de `rating`/`stars`)
Les ACs (FR50, epic 6.7 L1077-1079) ne mentionnent que **prénom client, texte du témoignage, statut actif/inactif**. La section landing 5.3 affiche des `stars` (4-5★) MAIS c'est une **donnée hardcodée décorative** (Story 5.3, `page.tsx:63-82`), jamais portée par un FR. → Le modèle `Testimonial` n'aura **PAS** de colonne `rating`. Pour préserver le visuel existant (étoiles), la section landing affichera **5★ en dur** pour chaque testimonial (déjà la valeur pour 2/3 des hardcodés). Un champ rating éditable = **Growth** (à tracer dans `deferred-work.md`). [Source: epics.md L1077-1079 ; prd.md L1586 ; 5-3-temoignages-clients.md L70-76 (stars MVP non variable) ; page.tsx:63-82]

### D2 — AC#3/#2 « sans redéploiement Vercel » = la landing **fetch l'API à la requête** (pas de données buildées en statique)
Aujourd'hui `page.tsx` est un **Server Component statique** avec un tableau `testimonials` **hardcodé** (5.3, approche MVP explicitement temporaire : « Quand 6-6 sera fait, on branchera sur l'API », 5-3 L55-58). Tant que les données sont hardcodées/buildées, activer/désactiver depuis l'admin **n'apparaîtra qu'après un redéploiement** → viole AC#2 et AC#3. → 6.7 doit :
- exposer un endpoint **public lecture seule** `GET /api/testimonials` retournant uniquement les testimonials `is_active = true` (ordonnés `display_order` puis `created_at`) ;
- remplacer le tableau hardcodé de `page.tsx` par un **fetch serveur à la requête** (`fetch(..., { cache: 'no-store' })` ou `export const dynamic = 'force-dynamic'` / `export const revalidate = 0`) afin qu'un rechargement reflète immédiatement l'état admin **sans rebuild Vercel**.
- ⚠️ Conserver l'AC#2 de la Story 5.3 : **si 0 testimonial actif → la section entière est masquée** (`return null` / rendu conditionnel `length > 0`), pas d'espace vide. [Source: 5-3-temoignages-clients.md L13-19,55-68 ; page.tsx:187 (`testimonials.length > 0 &&`) ; Next.js App Router data fetching]

### D3 — Endpoints admin = **groupe `/api/admin` existant** (auth + admin middleware), CRUD REST
Réutiliser **exactement** le pattern du groupe `router.group(...).prefix('/api/admin').use([middleware.auth(), middleware.admin()])` (`routes.ts:82-89`). Les routes CRUD :
- `GET    /api/admin/testimonials` — liste **toutes** (actives + inactives) pour la gestion ;
- `POST   /api/admin/testimonials` — créer (AC#1) ;
- `PATCH  /api/admin/testimonials/:id` — modifier (texte, prénom, **toggle is_active** → AC#2) ;
- `DELETE /api/admin/testimonials/:id` — suppression **définitive** (hard delete, AC#4).
L'endpoint **public** `GET /api/testimonials` (D2) est **hors** du groupe admin (aucune auth) — le déclarer à part comme `/api/health/live`. [Source: routes.ts:42-43,80-89 ; admin_middleware.ts ; admin_controller.ts]

### D4 — Suppression = **hard delete** (DELETE physique), pas soft-delete
AC#4 dit explicitement « supprimé de la **base de données** ». Pas de colonne `deleted_at`. La désactivation (`is_active=false`, AC#2) est le mécanisme « retirer sans perdre » ; la suppression est définitive. [Source: epics.md L1089-1091]

### D5 — Contrôleur = **`TestimonialsController` dédié** (PAS dans `admin_controller.ts`)
`admin_controller.ts` est centré métriques/logs (lecture seule, services `MetricsService`/`LogsService`). Un CRUD à 5 actions (4 admin + 1 public) mérite son **propre contrôleur** `app/controllers/testimonials_controller.ts` pour ne pas surcharger `AdminController`. Les actions admin restent protégées par le **groupe** de routes (middleware), pas par le contrôleur. Pattern de contrôleur REST : voir `orders_controller.ts` (index/store/show). [Source: admin_controller.ts ; orders_controller.ts]

### D6 — Front admin = **composant client `AdminTestimonials`** rendu par la route placeholder existante
La route `src/app/admin/testimonials/page.tsx` rend aujourd'hui `<AdminComingSoon title="Testimonials" />` (placeholder posé par 6.3). → La **remplacer** par `<AdminTestimonials />` (nouveau composant client), exactement comme `admin/logs/page.tsx` rend `<AdminGenerationLogs />`. L'accès est déjà garanti par `AdminShell` (layout `/admin`) — le composant suppose un admin authentifié et ne re-vérifie pas l'auth. Le lien sidebar « Testimonials » existe déjà (`AdminSidebar.tsx`). [Source: admin/testimonials/page.tsx ; admin/logs/page.tsx ; AdminShell.tsx ; AdminSidebar.tsx]

### D7 — UI suppression/toggle avec les composants **déjà installés**
`src/components/ui/` contient : `dialog`, `input`, `textarea`, `checkbox`, `button`, `label`, `table`, `badge`, `form`, `sonner`. **PAS de `alert-dialog` ni de `switch`.** → Confirmation de suppression (AC#4) via `Dialog` (modal de confirmation), **pas** `AlertDialog`. Toggle actif/inactif via `Checkbox` (ou un `Button` qui PATCH `is_active`) — **pas** `Switch`. Ne PAS installer de nouveaux composants shadcn sans nécessité. [Source: ls src/components/ui/]

## Tasks / Subtasks

### A. Backend — Migration `testimonials` (AC: #1, #2, #4)

- [x] Créer la migration `database/migrations/<timestamp>_create_testimonials_table.ts` (pattern **exact** de `1780421514880_create_alert_states_table.ts` — `BaseSchema`, `this.schema.createTable`, `table.increments('id')`, `table.timestamp('created_at').notNullable()`, `table.timestamp('updated_at').nullable()`) :
  - [x] `id` increments PK
  - [x] `author_name` varchar(100) notNullable — prénom client (AC#1)
  - [x] `content` text notNullable — texte du témoignage (AC#1)
  - [x] `is_active` boolean notNullable defaultTo(true) — flag d'affichage (AC#2)
  - [x] `display_order` integer notNullable defaultTo(0) — ordre d'affichage stable sur la landing (évite un ordre aléatoire ; tri secondaire `created_at`)
  - [x] `created_at` / `updated_at`
  - [x] Index sur `is_active` (le `GET /api/testimonials` public filtre `where is_active = true` à **chaque** requête de landing — fréquent).
- [x] ⚠️ **Colonnes en snake_case** (convention DB `architecture.md` L1659-1664). `tableName = 'testimonials'`.
- [x] ⚠️ Vérifier le **format de préfixe timestamp** des migrations existantes avant de nommer le fichier (ex. `1780xxxxxxxxx_...`).

### B. Backend — Modèle `Testimonial` (AC: #1, #2, #4)

- [x] Créer `app/models/testimonial.ts` (pattern **exact** de `app/models/alert_state.ts` — `BaseModel`, `@column`, `@column.dateTime({autoCreate})`, `@column.dateTime({autoCreate, autoUpdate})`). Pas de relation.
  - [x] `@column declare authorName: string`
  - [x] `@column declare content: string`
  - [x] `@column declare isActive: boolean`
  - [x] `@column declare displayOrder: number`
  - [x] `createdAt` / `updatedAt`
- [x] ⚠️ Lucid mappe automatiquement `authorName` ↔ `author_name`, `isActive` ↔ `is_active` (camelCase modèle ↔ snake_case colonne — convention établie, cf. `AlertState.alertType`/`alert_type`). Ne PAS surcharger `serializeAs`/columnName sauf nécessité.

### C. Backend — Validator (AC: #1)

- [x] Créer `app/validators/testimonial_validator.ts` (pattern **exact** de `order_validator.ts` — `import vine from '@vinejs/vine'`, `vine.compile(vine.object({...}))`) :
  - [x] `createTestimonialValidator` : `authorName` string `trim().minLength(1).maxLength(100)`, `content` string `trim().minLength(1).maxLength(2000)`, `isActive` boolean optional (défaut `true` appliqué côté contrôleur si absent), `displayOrder` number optional.
  - [x] `updateTestimonialValidator` : tous les champs **optionnels** (PATCH partiel — permet le toggle `is_active` seul). Mêmes bornes.
- [x] ⚠️ Bornes de longueur = garde-fou anti-payload abusif + cohérence affichage (texte landing). `maxLength(2000)` raisonnable pour un témoignage.

### D. Backend — `TestimonialsController` (AC: #1, #2, #3, #4)

- [x] Créer `app/controllers/testimonials_controller.ts`. Pattern de réponse **uniforme** du projet : succès `response.ok({ success: true, data })` ; erreur `{ success: false, error: { code, message } }` (cf. `admin_controller`, `admin_middleware` `FORBIDDEN`). Log Pino `logger.info({ event, userId }, '...')` sur les mutations (cf. `admin_controller` `admin_metrics_view`).
  - [x] **`publicIndex`** (AC#3) — public, lecture seule : `Testimonial.query().where('is_active', true).orderBy('display_order','asc').orderBy('created_at','asc')`. Retourne `{ success: true, data: [...] }` avec **seulement** `id`, `authorName`, `content` (ne pas exposer `is_active`/timestamps au public — sérialisation explicite). ⚠️ **Aucune donnée admin/PII** : les testimonials sont déjà publics par nature, pas de fuite.
  - [x] **`index`** (admin) — `Testimonial.query().orderBy('display_order','asc').orderBy('created_at','asc')` (toutes, actives + inactives, pour la gestion). Log `admin_testimonials_view`.
  - [x] **`store`** (AC#1) — `await request.validateUsing(createTestimonialValidator)`, `Testimonial.create({...})` (`isActive` défaut `true` si absent). `response.created(...)`. Log `admin_testimonial_create`.
  - [x] **`update`** (AC#2) — `findOrFail(params.id)`, `validateUsing(updateTestimonialValidator)`, `merge(payload).save()`. Le **toggle `isActive`** passe par ici (PATCH `{ isActive: false }`). Log `admin_testimonial_update` (inclure `isActive` final).
  - [x] **`destroy`** (AC#4) — `findOrFail(params.id)`, `await testimonial.delete()` (**hard delete**, D4). `response.ok({ success: true })`. Log `admin_testimonial_delete`.
  - [x] ⚠️ `findOrFail` lève 404 → gérer le mapping en réponse `{ success:false, error }` cohérente (vérifier comment les autres contrôleurs gèrent le 404 — `orders_controller.show` ; AdonisJS exception handler peut déjà transformer en 404, mais retourner le format `{success:false}` est plus cohérent : `find` + garde explicite si besoin).

### E. Backend — Routes (AC: #1, #2, #3, #4)

- [x] Dans `start/routes.ts` :
  - [x] **Endpoint public** (hors groupe admin, comme `/api/health/live`) :
    `router.get('/api/testimonials', [TestimonialsController, 'publicIndex'])` — **aucune** auth, **pas** de throttle agressif (lecture publique appelée par la landing ; un throttle léger optionnel est acceptable mais non requis).
  - [x] **Endpoints admin** — **ajouter dans le groupe `/api/admin` existant** (`routes.ts:82-89`, `.use([middleware.auth(), middleware.admin()])`) :
    - `router.get('/testimonials', [TestimonialsController, 'index'])`
    - `router.post('/testimonials', [TestimonialsController, 'store'])`
    - `router.patch('/testimonials/:id', [TestimonialsController, 'update'])`
    - `router.delete('/testimonials/:id', [TestimonialsController, 'destroy'])`
  - [x] Ajouter le lazy import `const TestimonialsController = () => import('#controllers/testimonials_controller')` en tête (pattern des autres contrôleurs `routes.ts:14-20`).
- [x] ⚠️ **Ordre du groupe admin** : `auth()` PUIS `admin()` (auth peuple `auth.user`, admin vérifie `isAdmin` → 403). Ne pas inverser. [Source: routes.ts:81]

### F. Frontend — Client API `testimonials` (AC: #1, #2, #3, #4)

- [x] Créer `src/lib/api/testimonials.ts` (pattern **exact** de `src/lib/api/admin.ts` — `const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''`, `fetch(..., { credentials: 'include' })`, type de retour discriminé `{ success: true, ... } | { success: false, errorCode, message }`, catch réseau → `NETWORK_ERROR`).
  - [x] `export interface Testimonial { id: number; authorName: string; content: string; isActive: boolean }` (le public n'expose pas `isActive` mais le type admin oui — prévoir un type public `PublicTestimonial = Pick<...,'id'|'authorName'|'content'>`).
  - [x] `getAdminTestimonials()` → `GET /api/admin/testimonials`
  - [x] `createTestimonial(payload)` → `POST /api/admin/testimonials`
  - [x] `updateTestimonial(id, payload)` → `PATCH /api/admin/testimonials/:id` (utilisé aussi pour le toggle `{ isActive }`)
  - [x] `deleteTestimonial(id)` → `DELETE /api/admin/testimonials/:id`
  - [x] `getPublicTestimonials()` → `GET /api/testimonials` (utilisé par la landing — voir Task H). ⚠️ Appelé **côté serveur** (Server Component) : `fetch(..., { cache: 'no-store' })` pour refléter l'état admin sans rebuild (D2). Pas de `credentials:'include'` nécessaire (public).

### G. Frontend — Composant admin `AdminTestimonials` (AC: #1, #2, #4)

- [x] Créer `src/components/siana/AdminTestimonials.tsx` (`'use client'`, pattern **exact** d'état/fetch/erreur de `AdminGenerationLogs.tsx` : `useState` data/loading/error, `useEffect` avec garde `active`, `toast.error(result.message)` sur échec réseau/API). Commentaire en tête : « accès garanti par AdminShell ».
  - [x] **Titre** : `<h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Testimonials</h1>` + sous-titre `text-muted-foreground` (pattern `AdminGenerationLogs`).
  - [x] **Liste** : `Table` (`@/components/ui/table`) — colonnes Prénom, Témoignage (tronqué), Statut (`Badge` actif/inactif), Actions. OU cards si plus lisible — rester cohérent avec le style admin (border/bg-card). Afficher actives **et** inactives.
  - [x] **Créer** (AC#1) : bouton « Ajouter » ouvrant un `Dialog` avec `Input` (prénom, `Label` + `aria-describedby`), `Textarea` (témoignage), `Checkbox` (« Actif », défaut coché). Submit → `createTestimonial` → toast succès + refetch liste. **Erreurs de validation champ** → message inline `<p>` sous le champ (`aria-describedby`) ; **erreur système/réseau** → `toast.error` (convention CLAUDE.md Forms/Toasts).
  - [x] **Modifier** (AC#2 texte/prénom) : même `Dialog` pré-rempli → `updateTestimonial(id, payload)`.
  - [x] **Toggle actif/inactif** (AC#2) : `Checkbox`/`Button` par ligne → `updateTestimonial(id, { isActive })` → refetch. Feedback toast/optimiste.
  - [x] **Supprimer** (AC#4) : `Dialog` de **confirmation** (D7 — PAS `AlertDialog`, non installé) → `deleteTestimonial(id)` → toast + refetch. Mention « définitif ».
  - [x] **États** : skeleton/loading (pattern `bg-muted animate-pulse`), état d'erreur réessayable, **état vide** (« Aucun testimonial — ajoutez-en un »).
  - [x] **A11y** : headings `font-display` ; labels reliés (`htmlFor`/`id`) ; boutons d'action avec `aria-label` explicite si icône seule ; focus géré dans le `Dialog` (shadcn le gère). Navigation clavier (NFR-A2).
- [x] **Remplacer** le contenu de `src/app/admin/testimonials/page.tsx` : `import AdminTestimonials` à la place de `AdminComingSoon`, rendre `<AdminTestimonials />` (garder `export const metadata` / `robots: noindex`). [Source: admin/logs/page.tsx]

### H. Frontend — Brancher la landing sur l'API (AC: #2, #3)

- [x] Modifier `src/app/page.tsx` :
  - [x] **Supprimer** le tableau `testimonials` hardcodé (L63-82).
  - [x] Rendre le composant `Home` **async** et fetcher `getPublicTestimonials()` côté serveur, OU extraire la section testimonials dans un sous-composant serveur async dédié si `Home` ne peut pas être async sans casser les autres sections (vérifier : `page.tsx` est un Server Component ; le passer `async` est OK tant qu'aucun hook client n'y est appelé — les composants `ScrollFloat`/`ScrollReveal`/`HeroSection` sont importés et rendus, pas exécutés comme hooks).
  - [x] Forcer le rendu **dynamique** : `export const dynamic = 'force-dynamic'` (ou `export const revalidate = 0`) sur `page.tsx`, sinon Next sert une page statique buildée et l'AC#3 (« sans redéploiement Vercel ») échoue. ⚠️ **Décision/impact** : cela retire la landing du rendu statique — acceptable au MVP (volume faible) mais à acter (léger coût LCP/serveur ; alternative Growth = ISR `revalidate: 60`, mais « immédiat sans redéploiement » de l'AC#3 favorise `no-store`). Documenter dans le résumé de complétion.
  - [x] **Conserver l'AC#2 de 5.3** : `testimonials.length > 0 &&` (section masquée si 0 actif). Si le fetch **échoue** (API down), **ne pas crasher la landing** : `try/catch` → tableau vide → section masquée (dégradation gracieuse, la landing reste servie).
  - [x] **Affichage** : réutiliser le markup existant (article/card, blockquote, prénom). Étoiles = **5★ en dur** (D1, plus de champ `stars`). Conserver `role="img" aria-label="5 étoiles sur 5"`, `aria-hidden` sur chaque `Star` (a11y 5.3).
- [x] ⚠️ **Régression à éviter** : la section testimonials est positionnée **entre la galerie d'exemples et le CTA secondaire** (5.3 L62-68). Ne pas déplacer. Garder `id="testimonials"`, `aria-labelledby="testimonials-heading"`, classes existantes.

### I. Tests (AC: #1, #2, #3, #4)

- [x] **Backend** `tests/functional/testimonials/testimonials_admin.spec.ts` (pattern des specs fonctionnelles existantes : `testUtils.db().withGlobalTransaction()`, helpers `tests/helpers/factories.ts`, login admin via le helper d'auth existant — **vérifier** comment les tests admin 6.2/6.4 authentifient un admin, ex. création d'un `User` `isAdmin=true` + session) :
  - [x] **AC#1** : POST `/api/admin/testimonials` (admin) avec prénom+texte → 201 + ligne créée `is_active=true` par défaut. Validation : prénom/texte vides → 422.
  - [x] **AC#2** : PATCH `/api/admin/testimonials/:id` `{ isActive: false }` → la ligne passe inactive ; GET public ne la retourne plus.
  - [x] **AC#3** : GET `/api/testimonials` (public, **sans auth**) → ne retourne que les `is_active=true`, triées par `display_order`. ⚠️ N'expose pas `isActive`/timestamps.
  - [x] **AC#4** : DELETE `/api/admin/testimonials/:id` → 200, ligne **absente** de la base (hard delete).
  - [x] **Sécurité (NFR-S10)** : un non-admin (ou anonyme) sur les routes admin → **403/401** (cf. `admin_middleware`). Tester au moins POST/DELETE.
  - [x] ⚠️ **Tests en deltas** (base de dev partagée, données résiduelles — découverte 6.2/6.4/6.5) : créer les testimonials dans la transaction et asserter sur **leur** présence/état, pas sur des totaux globaux.
- [x] **Frontend e2e (optionnel/léger)** : si la suite Playwright couvre l'admin, un parcours create→toggle→delete. Sinon, au minimum vérifier que `npm run build` rend la landing avec fetch dynamique sans erreur. ⚠️ Le test e2e `home.spec.ts:12` (« 15 minutes » dans le hero) est un **échec préexistant connu** non lié à 6.7 — ne pas le « réparer » dans cette story.
- [x] Lancer `npx tsc --noEmit` (0 erreur, **front + back**), `npm run lint` (0 erreur), `node ace test` (suite verte hors flakes connus : `cleanup:rgpd` intermittent, `home hero` e2e préexistant — cf. Debug Log 6.4/6.5).

### Review Findings

Code review adversariale (bmad-code-review, 3 couches : Blind Hunter / Edge Case Hunter / Acceptance Auditor) — 2026-06-03, worktree `feat/admin-testimonials`, diff working-tree vs baseline `main` (c6e4602). Mode autonome (review-only : findings écrits, aucun patch appliqué).

**Verdict : prête à merger (oui avec une réserve mineure).** Les 4 ACs sont satisfaits et testés (11/11 specs fonctionnelles vertes), suite API complète 189/189 sans régression, typecheck front+back 0 erreur, lint 0 erreur sur les fichiers touchés. Les décisions structurantes D1–D7 sont respectées.

- [ ] [Review][Patch] `displayOrder` accepte les flottants/négatifs → risque de 500 sur la colonne `integer` [siana-memento-api/app/validators/testimonial_validator.ts:13,26] — `vine.number()` (POST `store` + PATCH `update`) n'interdit ni les décimales ni les valeurs négatives ; écrire `1.5` dans la colonne `display_order` (type `integer`) lèverait une erreur Postgres → 500 non géré. Surface limitée (admin authentifié uniquement, aucun champ UI n'expose `displayOrder` aujourd'hui — atteignable seulement via un appel API forgé), d'où sévérité mineure. Correctif : chaîner `.withoutDecimals().min(0)` sur `displayOrder` dans les deux validators (create + update).

- [x] [Review][Defer] Endpoint public non throttlé + landing `force-dynamic`/`no-store` = une requête DB non cachée par affichage de la landing [siana-memento-api/start/routes.ts:46 ; siana-memento-web/src/app/page.tsx ; siana-memento-web/src/lib/api/testimonials.ts:getPublicTestimonials] — déféré, compromis MVP assumé et déjà tracé dans `deferred-work.md` (compromis LCP D2, throttle optionnel). Growth : ISR `revalidate` court + throttle léger sur `GET /api/testimonials`.

- [x] [Review][Defer] `aria-labelledby="testimonials-heading"` sans élément `id` correspondant [siana-memento-web/src/app/page.tsx:181] — déféré, **préexistant sur `main`** (présent avant 6.7, non introduit par cette story). À corriger hors périmètre 6.7 (donner l'`id` au heading `ScrollFloat` ou retirer l'attribut).

**Dismiss (bruit / par conception, non écrits comme action items) :** (1) `getPublicTestimonials` ramène `[]` sur réponse HTTP non-OK — comportement voulu (dégradation gracieuse D2/AC#3). (2) `update` exécute le `find`/404 avant la validation → un payload invalide sur un id absent renvoie 404 plutôt que 422 — ordre défendable (existence d'abord).

## Dev Notes

### Contexte & périmètre

Story 6.7 = **7ᵉ story d'Epic 6** et **la première du dashboard admin avec une surface d'écriture (CRUD)** : toutes les stories admin précédentes (6.2 métriques, 6.4 logs) étaient **lecture seule**. Elle **finalise FR50** : la Story 5.3 affichait des testimonials **hardcodés** (MVP temporaire, dette explicite « on branchera l'API quand Epic 6 sera fait »), 6.7 fournit le **modèle DB + CRUD admin + endpoint public** et **rebranche la landing dessus** pour que activer/désactiver/ajouter/supprimer prenne effet **sans redéploiement** (AC#2/#3). Périmètre **full-stack** : migration + modèle + validator + contrôleur + routes (back) ; client API + composant admin + rebranchement landing (front). [Source: epics.md#Story-6.7 ; 5-3-temoignages-clients.md L55-58 ; prd.md FR50]

### État du code vérifié

- **Routes admin** : groupe `router.group(...).prefix('/api/admin').use([middleware.auth(), middleware.admin()])` (`routes.ts:82-89`) avec `metrics`, `metrics/export-csv`, `logs`. **Ajouter les 4 routes CRUD testimonials ici.** Endpoint public déclaré à part comme `/api/health/live` (`routes.ts:43`). [Source: routes.ts]
- **`admin_middleware.ts`** : 403 `{ success:false, error:{ code:'FORBIDDEN', ... } }` si `!user || !user.isAdmin`. À chaîner **après** `auth()`. C'est la **vraie** barrière (NFR-S10) — le garde front (`AdminShell`) est cosmétique. [Source: admin_middleware.ts ; AdminShell.tsx]
- **Format de réponse** : succès `response.ok({ success:true, data })` / `response.created(...)` ; erreur `{ success:false, error:{ code, message } }`. Log Pino `logger.info({ event, userId }, 'msg')` sur les vues/mutations admin. [Source: admin_controller.ts:39-45,116-126 ; admin_middleware.ts]
- **Modèle pattern** : `app/models/alert_state.ts` (BaseModel, `@column`, `@column.dateTime({autoCreate})`, mapping camelCase↔snake_case auto, type union exporté). **Modèle le plus proche** pour `Testimonial`. [Source: alert_state.ts]
- **Migration pattern** : `1780421514880_create_alert_states_table.ts` (`BaseSchema`, `createTable`, `increments`, `string(n)`, `boolean`, `timestamp('created_at').notNullable()` + `updated_at.nullable()`, commentaires FR). **Modèle exact** pour la migration testimonials. [Source: alert_states migration]
- **Validator pattern** : `app/validators/order_validator.ts` (`vine.compile(vine.object({...}))`, contraintes chaînées). [Source: order_validator.ts]
- **Contrôleur REST pattern** : `orders_controller.ts` (index/store/show, `findOrFail`, `validateUsing`). [Source: orders_controller.ts]
- **Front client API** : `src/lib/api/admin.ts` — `API_URL`, `fetch({credentials:'include'})`, type retour discriminé, catch `NETWORK_ERROR`. **Modèle exact** pour `testimonials.ts`. [Source: admin.ts]
- **Front composant admin** : `AdminGenerationLogs.tsx` (`'use client'`, useState data/loading/error, useEffect garde `active`, `toast.error`, `Table`/`Badge`/`Button`/`Checkbox`, formatage fr-FR). **Modèle exact** pour `AdminTestimonials`. [Source: AdminGenerationLogs.tsx]
- **Route admin testimonials** : `src/app/admin/testimonials/page.tsx` rend `<AdminComingSoon title="Testimonials" />` (placeholder 6.3) — **à remplacer**. Le lien sidebar « Testimonials » existe déjà (`AdminSidebar.tsx`, icône `MessageSquareQuote`). [Source: admin/testimonials/page.tsx ; AdminSidebar.tsx]
- **Layout admin** : `AdminShell` (`admin/layout.tsx`) protège **toutes** les routes `/admin` (auth + isAdmin) et fournit sidebar + drawer mobile. `AdminTestimonials` n'a **pas** à re-vérifier l'auth. [Source: AdminShell.tsx ; admin/layout.tsx]
- **UI installés** : `dialog, input, textarea, checkbox, button, label, table, badge, form, sonner, alert, select, skeleton, sheet, ...`. **Absents : `alert-dialog`, `switch`** → confirmation via `Dialog`, toggle via `Checkbox`/`Button` (D7). [Source: ls src/components/ui/]
- **Landing testimonials (5.3)** : `page.tsx` Server Component statique, tableau `testimonials` hardcodé `{ name, text, stars }` (L63-82), section conditionnée `testimonials.length > 0` (L187) entre galerie et CTA, étoiles `Star` (lucide) `role="img"`/`aria-hidden`. **À rebrancher sur l'API + rendu dynamique.** [Source: page.tsx:63-82,185-235 ; 5-3-temoignages-clients.md]
- **Fetch front→API** : `process.env.NEXT_PUBLIC_API_URL`. Pour le fetch serveur de la landing, la même base URL est utilisable côté serveur (vérifier que `NEXT_PUBLIC_API_URL` est résolu au runtime serveur ; sinon ajouter une var serveur). [Source: admin.ts:1 ; orders.ts:1]

### Garde-fous anti-erreurs

- ❌ Ne PAS ajouter de colonne `rating`/`stars` au modèle — hors AC (D1). Étoiles landing = 5★ en dur. Rating éditable = Growth (deferred-work).
- ❌ Ne PAS laisser la landing en **statique buildée** — sinon AC#2/#3 (« sans redéploiement Vercel ») échouent. Rendu **dynamique** + `fetch no-store` (D2).
- ❌ Ne PAS supprimer la garde « 0 actif → section masquée » de 5.3 (régression AC#2 de 5.3). Section masquée aussi si le fetch échoue (dégradation gracieuse, pas de crash landing).
- ❌ Ne PAS mettre les actions CRUD **hors** du groupe `/api/admin` (perte de la protection `auth+admin`, NFR-S10). L'endpoint **public** `GET /api/testimonials` est le **seul** sans auth, et ne renvoie **que** les actifs + champs publics.
- ❌ Ne PAS exposer `is_active`/timestamps/PII dans la réponse publique — sérialisation explicite des champs publics.
- ❌ Ne PAS surcharger `admin_controller.ts` — contrôleur dédié `TestimonialsController` (D5).
- ❌ Ne PAS installer `alert-dialog`/`switch` — utiliser `Dialog`/`Checkbox` déjà présents (D7).
- ❌ Ne PAS re-vérifier l'auth dans `AdminTestimonials` — `AdminShell` le fait déjà (éviter double appel `/auth/me`).
- ❌ Ne PAS faire de soft-delete — AC#4 = suppression DB définitive (D4).
- ❌ Pas de magic strings dispersés pour les codes d'erreur — format `{ success:false, error:{ code, message } }` cohérent.
- ❌ Tests : asserter en **deltas** (base partagée), pas sur des totaux globaux (découverte 6.2/6.4/6.5).
- ❌ Ne PAS « réparer » le flake e2e `home.spec.ts` (« 15 minutes ») — échec préexistant hors périmètre.

### ⚠️ Impact cross-story (à signaler, pas une régression)

- **Boucle FR50 fermée** : 5.3 (affichage hardcodé) → 6.7 (CRUD + API + rebranchement). La modif de `page.tsx` change la source des données de la section testimonials (hardcodé → API dynamique) ; tout test/snapshot de 5.3 reposant sur le contenu hardcodé doit être ajusté (vérifier `home.spec.ts` / specs landing). [Source: 5-3 ; page.tsx]
- **Passage de la landing en rendu dynamique** : impacte potentiellement le LCP (NFR perf landing). MVP acceptable ; si LCP régresse, envisager ISR `revalidate` court en Growth (compromis « immédiateté AC#3 » vs cache). À acter dans la complétion.
- **Donnée d'amorçage** : après migration, la table est **vide** → la section testimonials de la landing **disparaît** (0 actif) tant qu'Aldo n'a pas créé de testimonials via l'admin. C'est conforme à l'AC#2 de 5.3, mais c'est un **changement visible** de la landing. Option : un **seeder** réinjectant les 3 testimonials hardcodés actuels (Claire & Maxime, Manon & Romain, Julie & Alexandre) pour continuité visuelle — **recommandé** (créer `database/seeders/testimonial_seeder.ts` si un pattern de seeder existe ; sinon, Aldo les recrée via l'UI). À trancher : seeder de continuité **recommandé**.

### Project Structure Notes

- **NEW backend** :
  - `siana-memento-api/database/migrations/<timestamp>_create_testimonials_table.ts`
  - `siana-memento-api/app/models/testimonial.ts`
  - `siana-memento-api/app/validators/testimonial_validator.ts`
  - `siana-memento-api/app/controllers/testimonials_controller.ts`
  - `siana-memento-api/tests/functional/testimonials/testimonials_admin.spec.ts`
  - (optionnel recommandé) `siana-memento-api/database/seeders/testimonial_seeder.ts` (continuité des 3 testimonials actuels)
- **UPDATE backend** :
  - `siana-memento-api/start/routes.ts` (1 route publique + 4 routes admin + lazy import)
- **NEW frontend** :
  - `siana-memento-web/src/lib/api/testimonials.ts`
  - `siana-memento-web/src/components/siana/AdminTestimonials.tsx`
- **UPDATE frontend** :
  - `siana-memento-web/src/app/admin/testimonials/page.tsx` (rendre `AdminTestimonials` au lieu de `AdminComingSoon`)
  - `siana-memento-web/src/app/page.tsx` (retirer le hardcodé, fetch API serveur + rendu dynamique, garder masquage si 0 actif)
- **UPDATE docs** :
  - `_bmad-output/implementation-artifacts/deferred-work.md` (rating éditable = Growth ; éventuel compromis LCP rendu dynamique)
- **READ-FOR-CONTEXT** : `app/models/alert_state.ts` + sa migration (modèle/migration), `app/validators/order_validator.ts` (validator), `app/controllers/orders_controller.ts` + `admin_controller.ts` (contrôleur, format réponse), `app/middleware/admin_middleware.ts` (sécurité), `start/routes.ts` (groupe admin + endpoint public), `src/lib/api/admin.ts` (client API), `src/components/siana/AdminGenerationLogs.tsx` (composant admin client), `src/components/siana/AdminShell.tsx`/`AdminSidebar.tsx` (layout/nav), `src/app/page.tsx` (landing), `5-3-temoignages-clients.md` (section testimonials).
- **NE PAS TOUCHER** : `admin_controller.ts` (contrôleur dédié à la place), `AdminShell`/`AdminSidebar` (déjà OK pour testimonials), les autres endpoints `/api/admin`, le pipeline de génération.

### Conventions du projet (CLAUDE.md)

- **Commits** : Conventional Commits, **anglais**, une ligne, **pas** de body/footer, **pas** de `Co-Authored-By`. Ex. `feat: add admin testimonials crud`.
- **Toasts/Forms** : `toast.error()` (sonner, `<Toaster>` global) pour erreurs système/réseau ; erreurs de validation champ → `<p>` inline sous l'input avec `aria-describedby`. Succès qui change l'UI → état inline.
- **A11y** : WCAG 2.1 AA, navigation clavier, contraste ≥4.5:1, headings `font-display` (Clash Display), tokens Tailwind (`text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `text-primary`).
- **Doc/communication** : **français**. Code/identifiants : anglais.
- **Argent** : N/A ici (pas de montant). DB colonnes snake_case, modèles camelCase.

### References

- [Source: epics.md#Story-6.7] (L1069-1091) — user story + 4 AC verbatim (FR50)
- [Source: epics.md#Epic-6] (L902-907) — objectif epic, FR50 (CRUD admin)
- [Source: prd.md FR50] (L1586) — admin gère les testimonials (ajouter/modifier/supprimer/activer-désactiver)
- [Source: 5-3-temoignages-clients.md] — section testimonials landing (hardcodé MVP, masquage si 0 actif, position, a11y stars), dette « brancher l'API quand Epic 6 fait »
- [Source: architecture.md] (L53, L2886 — Testimonials CRUD ; L1659-1664 — conventions DB snake_case / `is_active`)
- [Source: code vérifié — backend] `start/routes.ts:42-43,80-90`, `app/middleware/admin_middleware.ts`, `app/controllers/admin_controller.ts`, `app/controllers/orders_controller.ts`, `app/models/alert_state.ts`, `database/migrations/1780421514880_create_alert_states_table.ts`, `app/validators/order_validator.ts`
- [Source: code vérifié — frontend] `src/lib/api/admin.ts`, `src/components/siana/AdminGenerationLogs.tsx`, `src/components/siana/AdminShell.tsx`, `src/components/siana/AdminSidebar.tsx`, `src/components/siana/AdminComingSoon.tsx`, `src/app/admin/testimonials/page.tsx`, `src/app/admin/logs/page.tsx`, `src/app/page.tsx:63-82,185-235`, `src/components/ui/` (composants disponibles)
- [Source: 6-5-alertes-automatiques-admin.md] — patterns récents Epic 6 (tests en deltas, flakes connus, structure story)
- [Source: CLAUDE.md] — Conventional Commits EN, Toasts/Forms, a11y, design system, doc FR

### Cross-story context (Epic 6)

- **6.1** ✅ healthcheck. **6.2** ✅ dashboard métriques (lecture seule, format réponse admin, centimes). **6.3** ✅ layout/sidebar admin (`AdminShell`, lien « Testimonials » déjà posé, placeholder `AdminComingSoon`). **6.4** ✅ logs génération (`AdminGenerationLogs` — modèle de composant admin client). **6.5** ✅ alertes email. **6.6** ⏳ backlog (renvoi manuel + backups — indépendant de 6.7).
- **6.7** (cette story) — **première surface d'écriture admin** : CRUD testimonials + endpoint public + rebranchement landing 5.3.
- **6.8** ⏳ survey satisfaction.
[Source: sprint-status.yaml development_status epic-6]

### Dependencies

- **Résolues** : 6.3 ✅ (`AdminShell` + sidebar + route placeholder testimonials), 6.2/6.4 ✅ (patterns contrôleur/réponse/middleware admin, composant admin client), 5.3 ✅ (section landing à rebrancher). Aucune dépendance bloquante. 6.6 (backlog) est **indépendante** — 6.7 peut être implémentée sans attendre 6.6.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (1M context) — dev-story (autonome, worktree feat/admin-testimonials)

### Debug Log References

- `node ace migration:run` → migration `testimonials` appliquée (DB dev port 5435).
- API `npx tsc --noEmit` → 0 erreur.
- API `node ace test --files=tests/functional/testimonials/testimonials_admin.spec.ts` → 11/11 passés.
- API `node ace test` (suite complète) → **189/189 passés**, aucune régression.
- Web `npx tsc --noEmit` → 0 erreur.
- Web `eslint` sur les 4 fichiers modifiés/créés → 0 erreur/warning. (Les 5 erreurs lint du repo sont préexistantes dans des fichiers non touchés : `design-system/page.tsx`, `OrdersPage.tsx`, `ResultView.tsx`, `ThemeToggle.tsx`.)
- Web `npm run build` → **échec environnemental** : Turbopack rejette le `node_modules` symlinké hors de la racine du worktree (« Symlink node_modules is invalid, it points out of the filesystem root »). Limitation de l'environnement worktree (node_modules partagé), pas un défaut de code — la correction du code est validée par typecheck + lint.

### Completion Notes List

- Décisions structurantes D1–D7 respectées intégralement.
- **Seeder de continuité créé** (`testimonial_seeder.ts`, idempotent) réinjectant les 3 testimonials historiques (Claire & Maxime, Manon & Romain, Julie & Alexandre). Non exécuté automatiquement par la migration ; à lancer via `node ace db:seed` côté déploiement pour la continuité visuelle de la landing.
- **Landing en rendu dynamique** : `export const dynamic = 'force-dynamic'` + `getPublicTestimonials()` en `cache: 'no-store'`. Dégradation gracieuse : si l'API échoue, `[]` → section masquée, la landing ne crashe pas.
- **Garde 0 actif conservée** : `testimonials.length > 0 &&` maintenu (AC#2 de la Story 5.3). Position de la section (entre galerie et CTA), `id`/`aria-labelledby` inchangés. Étoiles 5★ en dur (D1).
- **404 cohérent** : `update`/`destroy` utilisent `find` + garde explicite renvoyant `{ success:false, error:{ code:'TESTIMONIAL_NOT_FOUND' } }` (plus cohérent que le 404 exception handler).
- Réponse publique sérialisée explicitement (id/authorName/content uniquement — pas de `isActive`/timestamps), testé.

### File List

**NEW (backend) — `siana-memento-api/`**
- `database/migrations/1780500000000_create_testimonials_table.ts`
- `app/models/testimonial.ts`
- `app/validators/testimonial_validator.ts`
- `app/controllers/testimonials_controller.ts`
- `database/seeders/testimonial_seeder.ts`
- `tests/functional/testimonials/testimonials_admin.spec.ts`

**UPDATE (backend) — `siana-memento-api/`**
- `start/routes.ts` (lazy import + 1 route publique + 4 routes admin)

**NEW (frontend) — `siana-memento-web/`**
- `src/lib/api/testimonials.ts`
- `src/components/siana/AdminTestimonials.tsx`

**UPDATE (frontend) — `siana-memento-web/`**
- `src/app/admin/testimonials/page.tsx` (rend `AdminTestimonials` au lieu de `AdminComingSoon`)
- `src/app/page.tsx` (retrait hardcodé → fetch API serveur + rendu dynamique, masquage si 0 actif)

**UPDATE (docs)**
- `_bmad-output/implementation-artifacts/deferred-work.md` (rating Growth, compromis LCP, e2e admin)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (6.7 → ready-for-review)

## Change Log

| Date | Version | Description | Auteur |
|------|---------|-------------|--------|
| 2026-06-02 | 0.1 | Story 6.7 créée (ready-for-dev) — CRUD admin testimonials full-stack : migration/modèle/validator/`TestimonialsController` + 4 routes `/api/admin/testimonials` (auth+admin) + endpoint public `GET /api/testimonials` ; front `AdminTestimonials` (Dialog create/edit/delete, Checkbox toggle) remplaçant le placeholder, client API `testimonials.ts` ; rebranchement de la landing 5.3 (retrait hardcodé → fetch API rendu dynamique, masquage si 0 actif). Décisions : pas de rating (D1), landing dynamique no-store pour « sans redéploiement » (D2), contrôleur dédié (D5), hard delete (D4), Dialog/Checkbox (pas alert-dialog/switch, D7), seeder de continuité recommandé. | create-story |

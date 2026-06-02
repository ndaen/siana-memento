---
baseline_commit: 56cdfc3eb12b4d5d09754649ff3cc4245eab1027
---

<!-- Story 6.3 — générée par create-story (BMad). Contexte-complet pour dev-story. -->

# Story 6.3: Layout & Navigation Admin

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'admin Aldo,
je veux une coquille de navigation commune à toutes les pages d'administration (sidebar + protection centralisée),
afin de circuler facilement entre les sections admin sans réimplémenter le garde d'accès et la mise en page sur chaque page.

## Acceptance Criteria

1. **Given** Aldo authentifié sur n'importe quelle page sous `/admin` **When** la page s'affiche **Then** une sidebar de navigation persistante liste les sections : Dashboard, Logs, Commandes, Testimonials — avec mise en évidence de la section active (FR33, NFR-A2).
2. **Given** un layout admin partagé (`/admin/layout`) **When** une page admin (dashboard, logs, commandes, testimonials) est rendue **Then** elle hérite de la sidebar et du contrôle d'accès commun, sans dupliquer le garde dans chaque page (refactor de la garde de Story 6.2).
3. **Given** un utilisateur non authentifié ou non-admin accédant à toute route `/admin` **When** sa requête arrive **Then** il est redirigé (non connecté → `/login` ; connecté non-admin → `/orders`) — contrôle centralisé dans le layout, cohérent avec la protection serveur NFR-S10 (Story 6.2).
4. **Given** la navigation admin sur mobile **When** Aldo consulte une page admin sur un écran < 768px **Then** la sidebar reste utilisable (repliable/drawer) et tous les liens sont accessibles au clavier (Tab/Enter, NFR-A2).
5. **Given** un lien de la sidebar pointant vers une section non encore implémentée (Logs, Commandes, Testimonials avant leurs stories) **When** Aldo clique dessus **Then** la navigation fonctionne et la page affiche un état neutre « bientôt disponible » (pas d'erreur) jusqu'à l'implémentation de la story correspondante.

[Source: epics.md#Story-6.3 L963-991 — user story + 5 AC verbatim]

## Tasks / Subtasks

### A. Layout partagé + garde admin centralisé (AC: #2, #3) — *fondation, à faire en premier*

- [x] Créer `src/app/admin/layout.tsx` — layout fin (Server Component), exporte `metadata` avec `robots: { index: false, follow: false }` et rend `<AdminShell>{children}</AdminShell>`. NE PAS y mettre de logique client (pas de `getMe`/hooks) ; le layout délègue au shell client.
- [x] Créer `src/components/siana/AdminShell.tsx` (`'use client'`) — garde + chrome admin :
  - [x] Garde via `getMe()` (cf. pattern `AdminDashboard.tsx` L45-65 actuel à transposer) : `!result.success` + `errorCode === 'NETWORK_ERROR'` → afficher état « Connexion impossible » + `toast.error(...)`, **ne pas rediriger** ; `!result.success` (autre) → `router.replace('/login?redirect=' + pathname)` ; `result.user.isAdmin === false` → `router.replace('/orders')` ; sinon `setAuthChecked(true)`.
  - [x] Utiliser `usePathname()` pour le paramètre `redirect` (retour à la page d'origine après login, pas figé sur `/admin/dashboard`).
  - [x] Pendant `!authChecked` : rendre un skeleton (réutiliser le motif `animate-pulse` de l'AdminDashboard actuel) — éviter tout flash de contenu admin.
  - [x] Une fois admin confirmé : rendre un conteneur flex `<aside><AdminSidebar/></aside>` + **un unique** `<main>` contenant `{children}` (conteneur `mx-auto max-w-4xl px-4 py-10 sm:py-16` déplacé ici depuis AdminDashboard).
- [x] **Refactor `src/components/siana/AdminDashboard.tsx`** (AC#2) : SUPPRIMER le `useEffect` de garde (L45-65), les états `authChecked`/`authError`, les branches de rendu `authError`/`!authChecked`, et le wrapper `<main className="mx-auto max-w-4xl …">`. Conserver UNIQUEMENT : chargement des métriques (`getAdminMetrics`), états `loading`/`error`, et le rendu du contenu (titre + bouton CSV + grilles). Le contenu devient un fragment rendu DANS le `<main>` du shell.
  - [x] Le chargement métriques ne dépend plus de `authChecked` : le shell garantit déjà l'accès admin → déclencher `getAdminMetrics()` au mount (`useEffect(..., [])`).
- [x] ⚠️ **Un seul `<main>` par page** : le root `layout.tsx` enveloppe déjà `{children}` dans `<div id="main-content">` (cible du skip-link). Le `<main>` du shell ne doit PAS reprendre `id="main-content"`. Les pages admin (dashboard + placeholders) ne rendent JAMAIS leur propre `<main>` (sinon double-`<main>` = régression a11y).

### B. Sidebar de navigation (AC: #1, #4)

- [x] Créer `src/components/siana/AdminSidebar.tsx` (`'use client'`) :
  - [x] Définir les sections : `[{ href:'/admin/dashboard', label:'Dashboard', icon:LayoutDashboard }, { href:'/admin/logs', label:'Logs', icon:FileText }, { href:'/admin/orders', label:'Commandes', icon:ShoppingBag }, { href:'/admin/testimonials', label:'Testimonials', icon:MessageSquareQuote }]` (icônes `lucide-react`).
  - [x] `<nav aria-label="Navigation admin">` avec `<Link>` (next/link). Section active via `usePathname()` : `pathname === item.href || pathname.startsWith(item.href + '/')` → style actif (`aria-current="page"`, Vert Sauge `#2D4A3E` / fond accent). Contraste ≥ 4.5:1 (WCAG AA).
- [x] **Desktop (≥ 768px)** : sidebar fixe à gauche (`<aside>` largeur ~`w-56`), visible en permanence.
- [x] **Mobile (< 768px)** : drawer repliable.
  - [x] Ajouter le composant shadcn `sheet` : `npx shadcn@latest add sheet` (style new-york, copié dans `src/components/ui/sheet.tsx`). ⚠️ **Nouveau composant UI copié** (pas une dépendance npm) — s'appuie sur le paquet `radix-ui` déjà présent ; signaler l'ajout. Alternative sans `sheet` : réutiliser `dialog.tsx` existant en drawer latéral.
  - [x] Bouton hamburger (icône `Menu` lucide, `aria-label="Ouvrir la navigation admin"`) visible uniquement `< md`, ouvre le `Sheet` (côté gauche) contenant la même liste de liens.
  - [x] Fermer le drawer après navigation (au clic sur un lien).
- [x] **Clavier (NFR-A2)** : tous les liens focusables et activables Tab/Enter ; focus visible ; le `Sheet` shadcn gère focus-trap + Échap nativement. Vérifier l'ordre de tabulation.

### C. Pages placeholder « bientôt disponible » (AC: #5)

- [x] Créer `src/components/siana/AdminComingSoon.tsx` — état neutre réutilisable (prop `title`), pattern « empty state bienveillant » (cf. états vides de l'AdminDashboard) : titre de section + message « Bientôt disponible » + sous-texte. Pas d'erreur, pas de toast.
- [x] Créer les routes placeholder (fragments, **sans `<main>`**), remplacées par leurs stories respectives :
  - [x] `src/app/admin/logs/page.tsx` → `<AdminComingSoon title="Logs de génération" />` *(remplacée par Story 6.4)*
  - [x] `src/app/admin/orders/page.tsx` → `<AdminComingSoon title="Commandes" />` *(remplacée par Story 6.6 — renvoi manuel)*
  - [x] `src/app/admin/testimonials/page.tsx` → `<AdminComingSoon title="Testimonials" />` *(remplacée par Story 6.7 — CRUD testimonials)*
  - [x] Chaque `page.tsx` exporte `metadata` avec `robots: { index: false, follow: false }` (cohérent avec le dashboard).

### D. Tests e2e (AC: #1, #2, #3, #4, #5)

- [x] Créer `e2e/admin-layout.spec.ts` (Playwright, `testDir: ./e2e`, baseURL `http://localhost:3000`) :
  - [x] **AC#3** — visiteur anonyme sur `/admin/dashboard` → redirigé vers `/login` (URL contient `redirect=/admin/dashboard`).
  - [x] **AC#3** — utilisateur connecté non-admin → redirigé vers `/orders` (nécessite un compte non-admin seedé / connecté).
  - [x] **AC#1/#2** — admin sur `/admin/dashboard` → sidebar visible avec les 4 sections ; lien Dashboard marqué actif (`aria-current="page"`).
  - [x] **AC#5** — clic « Logs » → URL `/admin/logs`, texte « Bientôt disponible » visible, aucune erreur console/page.
  - [x] **AC#4** — viewport < 768px → sidebar masquée, hamburger ouvre le drawer, liens navigables au clavier (Tab/Enter), Échap referme.
- [x] ⚠️ Les e2e admin nécessitent la stack Docker up + un compte admin connecté. Si l'auth e2e (login programmatique / storageState) n'est pas encore outillée, livrer **au minimum** le test AC#3-anonyme (sans auth) + AC#5, et documenter en Completion Notes les cas couverts manuellement. Suivre le style des specs existantes `e2e/home.spec.ts` / `e2e/generate-flow.spec.ts`.

### Review Findings

<!-- Ajouté par code-review (BMad) le 2026-06-02 — commits 56cdfc3..HEAD ; 3 couches : Blind Hunter, Edge Case Hunter, Acceptance Auditor -->

**Decision needed**

- [x] [Review][Decision] Changements hors File List + `UserMenu` contredit une Dev Note — `UserMenu.tsx` masque « Mes commandes » sous `/admin` alors que les Dev Notes (L101) imposent « ne pas masquer le header (hors scope, risque de régression) ». De plus `login/page.tsx`, `app/admin/page.tsx` et `.gitignore` ne figurent pas dans le File List déclaré. Décider : conserver ces changements (et mettre à jour File List + Change Log) ou réaligner sur le spec.

**Patch**

- [x] [Review][Patch] Drawer mobile ne se ferme pas sur navigation non-clic (bouton retour navigateur / redirect / deep-link) [siana-memento-web/src/components/siana/AdminSidebar.tsx:87]
- [x] [Review][Patch] État `authError` sans bouton « Réessayer » + `hasChecked` (ref) bloque tout re-check tant que le shell reste monté [siana-memento-web/src/components/siana/AdminShell.tsx:51]
- [x] [Review][Patch] Skeleton de chargement en forme de dashboard (5 cartes métriques) affiché sur toutes les sous-routes admin (Logs, Commandes, Testimonials) [siana-memento-web/src/components/siana/AdminShell.tsx:64]
- [x] [Review][Patch] `safeInternalPath` ne neutralise pas les caractères de contrôle (`\t\n\r`) → durcir le filtre anti open-redirect [siana-memento-web/src/app/(auth)/login/page.tsx:11]
- [x] [Review][Patch] `SheetContent` sans `SheetDescription`/`aria-describedby` → warning a11y Radix Dialog [siana-memento-web/src/components/siana/AdminSidebar.tsx:98]
- [x] [Review][Patch] Double `<nav aria-label="Navigation admin">` (sidebar desktop + drawer mobile) → libellés de landmark non uniques (WCAG) [siana-memento-web/src/components/siana/AdminSidebar.tsx:47]

**Deferred**

- [x] [Review][Defer] `SiteHeader` déclenche son propre `getMe()` en plus du garde du shell → 2 appels `/auth/me` par page admin [siana-memento-web/src/components/siana/SiteHeader.tsx:41] — deferred, pre-existing (SiteHeader non modifié par cette story)

**Résolution (review-fixes, 2026-06-02)**

- **Decision** → changements **conservés** (demandés par Aldo : retour visuel #1 + décision sur le redirect post-login). Précision : seul le **raccourci « Mes commandes »** est masqué sous `/admin`, pas le header lui-même (logo, menu déconnexion, thème restent) — le garde-fou « ne pas masquer le header » n'est donc pas enfreint. `.gitignore` ajouté au File List (la règle `logs/` masquait `admin/logs/page.tsx` → négation ciblée).
- **Patch 1** ✅ drawer mobile : `Sheet` non-contrôlé + `key={pathname}` → fermeture sur toute navigation (clic, retour, redirect, deep-link).
- **Patch 2** ✅ état réseau réessayable : bouton « Réessayer » (reset + re-check) ; `runAuthCheck` mémorisé, garde `checking` ref (un seul appel, pas de setState synchrone en effet).
- **Patch 3** ✅ skeleton neutre (plus en forme de dashboard) dans le shell, route-agnostique, sans flash de sidebar avant confirmation admin.
- **Patch 4** ✅ `safeInternalPath` rejette les caractères de contrôle (`charCodeAt < 0x20 || === 0x7f`).
- **Patch 5** ✅ `SheetContent` doté d'un `SheetDescription` (sr-only) → plus de warning a11y Radix.
- **Patch 6** ✅ libellés de landmark distincts (`Navigation admin` / `Navigation admin (mobile)`). NB : faux positif au runtime (l'`aside` desktop est `display:none` en mobile → exclu de l'arbre a11y, une seule instance exposée), corrigé par prudence.
- **Deferred** : double `getMe()` `SiteHeader` — pré-existant, tracé dans `deferred-work.md`.
- Validation : `tsc` + `eslint` verts ; **20/21 e2e** (10 admin, dont retry réseau + anti open-redirect) ; seul échec = `home › hero` préexistant.

## Dev Notes

### Contexte & périmètre

Story 6.3 = **coquille de navigation** ajoutée a posteriori (correct-course 2026-06-01) car aucune story d'Epic 6 ne prévoyait la navigation entre les **4 pages `/admin`** (dashboard, logs, commandes, testimonials). C'est une story **frontend pure** : layout partagé + sidebar + refactor d'un garde existant + pages placeholder. **Aucune modification backend** — la vraie barrière d'accès (middleware API `admin`, NFR-S10) existe déjà depuis la 6.2 et reste inchangée. Jouée **avant** 6.4 pour que les pages suivantes se branchent sur le layout au lieu de recréer leur nav. [Source: sprint-change-proposal-2026-06-01.md ; epics.md#Story-6.3 L963-991]

### 🚨 Piège de renumérotation (lire impérativement avant la story 6-2)

La story **6-2** (`6-2-dashboard-metriques-business-et-export-csv.md`) a été écrite **avant** l'insertion de cette story. Toutes ses mentions de « **Story 6.3** » (ex. « persistance du coût Gemini = Story 6.3 », « dépendance 6.3 ») désignent l'**ANCIENNE** 6.3 = **Logs de Génération**, désormais renumérotée **Story 6.4**. La **nouvelle 6.3** (celle-ci) = **Layout & Navigation Admin**. Ne pas confondre : cette story ne touche NI au coût API, NI aux logs, NI à `generation_service.ts`. [Source: sprint-change-proposal-2026-06-01.md §4.1 ; sprint-status.yaml L38]

### État du code admin actuel (vérifié)

- **Route unique aujourd'hui** : `src/app/admin/dashboard/page.tsx` (route fine) → rend `<AdminDashboard />` (`src/components/siana/AdminDashboard.tsx`). C'est la seule surface admin. [Source: code vérifié ; obs 2146]
- **Garde actuel = inline dans `AdminDashboard.tsx` (L45-65)** : `getMe()` → si `!success && errorCode==='NETWORK_ERROR'` → `toast.error` + état `authError` (PAS de redirect, pour ne pas faux-déconnecter sur panne réseau, cf. [[project_localstorage_security_bug]]) ; sinon `!success` → `router.replace('/login?redirect=/admin/dashboard')` ; `!user.isAdmin` → `router.replace('/orders')` ; sinon `setAuthChecked(true)`. **C'est exactement cette logique à extraire dans le shell** (en généralisant `redirect` via `usePathname`). [Source: AdminDashboard.tsx L45-65]
- **`getMe()`** (`src/lib/api/auth.ts` L60-71) → `{ success:true, user }` | `{ success:false, errorCode }`. `User` (L42-47) : `{ id, email, fullName, isAdmin? }`. Cookie session AdonisJS, `credentials:'include'`. Pas d'auth store → `getMe()` appelé au mount. [Source: auth.ts]
- **Garde frontend = cosmétique** ; barrière réelle = middleware API `admin` (NFR-S10). Ne JAMAIS s'appuyer sur un `middleware.ts` Next pour l'autorisation (CVE-2025-29927). [Source: 6-2 Dev Notes L124]

### Refactor de la garde 6.2 (cœur de l'AC#2)

Après extraction dans `AdminShell`, `AdminDashboard.tsx` ne contient PLUS de garde : il suppose l'accès admin garanti par le layout et ne fait que charger/afficher les métriques. Le wrapper `<main className="mx-auto max-w-4xl px-4 py-10 sm:py-16">` migre vers le shell (qui devient le propriétaire du `<main>` unique). Comportement fonctionnel inchangé sur `/admin/dashboard` (pas de régression visible) — c'est un déplacement de responsabilité. Dette explicitement assumée par la 6.2. [Source: sprint-change-proposal §4.3 ; 6-2 Completion Notes L223]

### Patterns frontend à réutiliser (ne rien réinventer)

- **Pattern route fine + composant `siana/`** : `dashboard/page.tsx` (12 lignes, metadata + `<AdminDashboard/>`) → reproduire pour layout (`layout.tsx` → `<AdminShell>`) et placeholders. [Source: admin/dashboard/page.tsx]
- **Pattern Guard** : `src/components/siana/ConfigureGuard.tsx` — `useEffect` + `router.replace` + `return null` tant que non prêt. Modèle structurel du shell. [Source: ConfigureGuard.tsx]
- **`usePathname` pour l'état actif** : `SiteHeader.tsx` l'utilise déjà (scroll-spy ancres). Même approche pour surligner la section admin. [Source: SiteHeader.tsx L26-27]
- **Masquage chrome marketing** : `ConditionalFooter.tsx` masque DÉJÀ le footer sur `/admin/*` (`pathname.startsWith('/admin')`). **Rien à modifier** — le footer est déjà absent en admin. [Source: ConditionalFooter.tsx]
- **Le `SiteHeader` global reste rendu** sur `/admin` (logo + `UserMenu` avec déconnexion). Décision : **le conserver** (fournit le logout) ; la sidebar admin est la nav secondaire, sous le header. Pas de doublon : la nav d'ancres du header ne s'affiche que sur `/` (`isHome`). Ne pas masquer le header (hors scope, risque de régression). [Source: SiteHeader.tsx L26-28, L88-108 ; root layout.tsx L58]
- **shadcn dispo** (`src/components/ui/`) : button, card, input, label, dropdown-menu, checkbox, select, textarea, alert, badge, progress, skeleton, sonner, dialog, form. **PAS de `sheet` ni `sidebar`** → ajouter `sheet` pour le drawer (ou réutiliser `dialog`). `cn()` dispo dans `src/lib/utils.ts`. Style **new-york**, icônes **lucide**. [Source: components/ui/ ; components.json ; utils.ts]
- **Couleur de marque** : Vert Sauge `#2D4A3E` (déjà constante `SAGE` dans AdminDashboard) pour l'état actif / accent sidebar. [Source: AdminDashboard.tsx L11 ; CLAUDE.md Design System]

### Arborescence cible (Next.js App Router)

```
src/app/admin/
├── layout.tsx                 # NEW — fin, metadata noindex, rend <AdminShell>
├── dashboard/page.tsx         # inchangé (rend <AdminDashboard>, garde retirée du composant)
├── logs/page.tsx              # NEW placeholder (→ Story 6.4)
├── orders/page.tsx            # NEW placeholder (→ Story 6.6)
└── testimonials/page.tsx      # NEW placeholder (→ Story 6.7)

src/components/siana/
├── AdminShell.tsx             # NEW — 'use client', garde + sidebar + <main>{children}</main>
├── AdminSidebar.tsx           # NEW — 'use client', liens + actif + drawer mobile
├── AdminComingSoon.tsx        # NEW — état neutre « bientôt disponible »
└── AdminDashboard.tsx         # UPDATE — garde retirée, ne charge que les métriques

src/components/ui/
└── sheet.tsx                  # NEW (shadcn add sheet) — drawer mobile

e2e/
└── admin-layout.spec.ts       # NEW — Playwright
```

Note : route group `(admin)` NON retenu (la 6.2 a déjà acté `src/app/admin/` sans group, URL conforme). Rester cohérent. [Source: 6-2 Completion Notes L223]

### Routes & redirections (précisions)

- Sections sidebar → routes : Dashboard=`/admin/dashboard`, Logs=`/admin/logs`, Commandes=`/admin/orders`, Testimonials=`/admin/testimonials`. ⚠️ `/admin/orders` (admin) ≠ `/orders` (page client utilisateur, `src/app/orders/page.tsx`) — routes distinctes, pas de collision. [Source: sprint-change-proposal §1]
- Redirections (centralisées dans le shell) : anonyme → `/login?redirect={pathname}` ; connecté non-admin → `/orders` (route existante, cible déjà utilisée par le garde 6.2). [Source: AdminDashboard.tsx L56-61 ; app/orders/page.tsx]

### Accessibilité (NFR-A2, WCAG 2.1 AA)

- `<nav aria-label="Navigation admin">`, lien actif `aria-current="page"`, focus visible, navigation Tab/Enter complète, contraste ≥ 4.5:1. Le `Sheet` shadcn fournit focus-trap + fermeture Échap + restauration du focus. Hamburger avec `aria-label`. [Source: CLAUDE.md Accessibilité ; epics.md AC1/AC4]

### Garde-fous anti-erreurs

- ❌ Ne PAS toucher au backend / middleware API admin (barrière déjà en place, NFR-S10).
- ❌ Ne PAS introduire de `src/middleware.ts` Next pour l'auth (CVE-2025-29927) — garde client cosmétique uniquement.
- ❌ Ne PAS laisser de garde résiduel dans `AdminDashboard.tsx` après refactor (sinon double-vérif + double-redirect possible).
- ❌ Ne PAS rendre deux `<main>` (shell + page) — le shell possède l'unique `<main>`, les pages rendent des fragments.
- ❌ Ne PAS rediriger sur `NETWORK_ERROR` (préserver le comportement anti-faux-logout de la 6.2).
- ❌ Ne PAS faire des placeholders qui jettent une erreur / 404 — état neutre « bientôt disponible » (AC#5).
- ❌ Ne PAS surcharger l'UX (pas de polling, pas de breadcrumb/topbar inventés) — la spec UX ne décrit pas la nav admin ; rester sobre, patterns transverses (shadcn, Vert Sauge, états neutres). [Source: 6-2 Dev Notes L155 ; sprint-change-proposal §2 UX]

### Testing

- **Frontend e2e = Playwright** (seul framework de test du web). `testDir: ./e2e`, `baseURL: http://localhost:3000`, `webServer` configuré ; specs existantes : `e2e/home.spec.ts`, `e2e/generate-flow.spec.ts`. Pas de framework unitaire (vitest/jest) côté web. [Source: package.json scripts ; playwright.config.ts L4-20]
- Couvrir AC#3 (redirections), AC#1/#2 (sidebar + actif), AC#5 (placeholder), AC#4 (drawer mobile + clavier). Auth admin e2e nécessite stack Docker + compte admin (`daennoah@gmail.com`, promu via `node ace admin:promote`). Si l'outillage login e2e manque, livrer au minimum les cas sans-auth + documenter le reste en Completion Notes. [Source: 6-2 Dev Notes L118-119]
- `tsc --noEmit` (web) doit rester vert. `npm run lint` du web a des warnings **préexistants hors story** (ThemeToggle, `<img>`) — ne pas les « corriger » ici, ne pas en ajouter. [Source: 6-2 Debug Log L209-210]

### Project Structure Notes

- **NEW frontend** : `src/app/admin/layout.tsx` ; `src/app/admin/logs/page.tsx` ; `src/app/admin/orders/page.tsx` ; `src/app/admin/testimonials/page.tsx` ; `src/components/siana/AdminShell.tsx` ; `src/components/siana/AdminSidebar.tsx` ; `src/components/siana/AdminComingSoon.tsx` ; `src/components/ui/sheet.tsx` (shadcn) ; `e2e/admin-layout.spec.ts`.
- **UPDATE frontend** : `src/components/siana/AdminDashboard.tsx` (retrait garde + wrapper main).
- **READ-FOR-CONTEXT** : `src/app/admin/dashboard/page.tsx`, `src/components/siana/ConfigureGuard.tsx`, `src/components/siana/SiteHeader.tsx`, `src/components/siana/ConditionalFooter.tsx`, `src/app/layout.tsx`, `src/lib/api/auth.ts`, `src/components/ui/card.tsx`, `e2e/home.spec.ts`.
- **NE PAS TOUCHER** : tout `siana-memento-api/**` ; `src/lib/api/admin.ts` ; le contenu métriques d'AdminDashboard (hors retrait garde/wrapper).
- Alignement structure : conforme (route fine + composant `siana/`, alias `@/` → `src/`, `'use client'` pour interactivité). Aucun conflit détecté.

### References

- [Source: epics.md#Story-6.3] (L963-991) — user story + 5 AC verbatim + note correct-course
- [Source: epics.md#Epic-6] (L902-907) — objectif epic, FR33, NFR-S10, NFR-A2
- [Source: sprint-change-proposal-2026-06-01.md] — justification de la story, tableau des 4 pages `/admin`, renumérotation, refactor garde 6.2, séquencement avant 6.4
- [Source: 6-2-dashboard-metriques-business-et-export-csv.md] — auth admin `is_admin` + middleware (L121-124), garde frontend cosmétique, pattern `OrdersPage`/`getMe`, déviation route `src/app/admin/` sans group (L223), compte admin `daennoah@gmail.com` (L118-119)
- [Source: code vérifié] — `AdminDashboard.tsx` (garde L45-65, SAGE L11), `auth.ts` (`getMe`/`User`), `ConfigureGuard.tsx`, `SiteHeader.tsx` (`usePathname`), `ConditionalFooter.tsx`, root `layout.tsx`, `components.json` (new-york/lucide), `utils.ts` (`cn`), `playwright.config.ts`
- [Source: architecture.md L1987] — `Sidebar.tsx` esquissé dans l'arborescence projetée (sans AC) — concrétisé par cette story
- [Source: CLAUDE.md] — Design System (Vert Sauge #2D4A3E, Clash Display/Satoshi), Frontend Conventions (Toaster global, toasts pour erreurs système, `sr-only`), Accessibilité WCAG AA

### Cross-story context (Epic 6, après renumérotation)

- **6.1** ✅ done — healthcheck (NFR-S10 pattern initial).
- **6.2** ✅ done — dashboard métriques + **vrai mécanisme d'auth admin** (`is_admin` + middleware) réutilisé ici via `getMe().user.isAdmin`. Cette story refactore le garde frontend de la 6.2.
- **6.4** (ex-6.3) — Logs génération & coûts IA → remplacera `/admin/logs` (placeholder).
- **6.6** (ex-6.5) — Renvoi manuel + backups → remplacera `/admin/orders` (placeholder).
- **6.7** (ex-6.6) — CRUD testimonials → remplacera `/admin/testimonials` (placeholder).
[Source: sprint-status.yaml L86-95 ; sprint-change-proposal §4.1]

### Dependencies

- Story 6.2 ✅ done (auth admin `is_admin`, `/admin/dashboard`, `getMe().isAdmin`). Epic 2 ✅ done (auth/session). Aucune dépendance bloquante. Cette story DÉBLOQUE 6.4/6.6/6.7 (coquille de nav prête).

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Claude Opus 4.8, 1M context)

### Debug Log References

- `npx tsc --noEmit` (web) → **exit 0**, aucune erreur de type.
- `npx eslint` sur les 10 fichiers de la story (app/admin, AdminShell/Sidebar/ComingSoon/Dashboard, ui/sheet, e2e) → **exit 0**, propre.
- `npx playwright test admin-layout` → **5/5 passed** (8.9 s) : redirection anonyme→/login, non-admin→/orders, sidebar 4 sections + actif, placeholder « bientôt disponible », drawer mobile.
- `npx playwright test` (suite complète) → **15 passed / 1 failed**. L'unique échec = `e2e/home.spec.ts:12 › hero section` (`getByText('15 minutes')`). **Échec PRÉEXISTANT hors story** : `HeroSection.tsx` (non modifié par la 6.3) ne contient pas « 15 minutes » (sous-titre actuel = « Générez le Save the Date qui vous ressemble… ») — dérive de copie vs test figé au commit `e7b0853`. Présent dès le baseline `56cdfc3`, indépendant des changements admin. **Non corrigé (hors périmètre).**

### Completion Notes List

- ✅ **AC#1** — `AdminSidebar` : sidebar persistante listant Dashboard / Logs / Commandes / Testimonials, section active via `usePathname` (`aria-current="page"`, Vert Sauge `#2D4A3E`). Icônes lucide.
- ✅ **AC#2** — Layout partagé `src/app/admin/layout.tsx` (fin, metadata noindex) → `AdminShell` (`'use client'`) qui héberge garde + chrome + `<main>` unique. **Garde retirée de `AdminDashboard.tsx`** (plus de `useEffect` getMe ni états `authChecked`/`authError`) → centralisation effective, fin de la duplication de la 6.2.
- ✅ **AC#3** — Redirections centralisées dans `AdminShell` : anonyme → `/login?redirect={pathname}` (généralisé via `usePathname`, plus figé sur `/admin/dashboard`) ; non-admin → `/orders` ; `NETWORK_ERROR` → état « Connexion impossible » sans redirect (anti-faux-logout préservé). Barrière réelle = middleware API `admin` inchangé (NFR-S10).
- ✅ **AC#4** — `AdminMobileNav` : drawer (`Sheet` shadcn, côté gauche) ouvert par hamburger `< md`, focus-trap + Échap natifs Radix, liens Tab/Enter, fermeture après navigation. Sidebar desktop masquée `< md`.
- ✅ **AC#5** — `AdminComingSoon` + pages placeholder `/admin/logs`, `/admin/orders`, `/admin/testimonials` → état neutre « Bientôt disponible » (aucune erreur). Remplacées par 6.4 / 6.6 / 6.7.
- **Nouveau composant UI** : `src/components/ui/sheet.tsx` ajouté manuellement selon le style exact du projet (`import { Dialog as SheetPrimitive } from "radix-ui"`, calqué sur `dialog.tsx`) — pas de dépendance npm nouvelle (paquet `radix-ui` déjà présent). Pas de réseau requis.
- **Un seul `<main>` par page** respecté : le shell possède l'unique `<main>` ; `AdminDashboard` et les placeholders rendent des fragments (pas de double-`<main>`).
- **Aucun changement backend** ; `src/lib/api/admin.ts` et le contenu métriques d'`AdminDashboard` non modifiés (hors retrait garde/wrapper).

**Retours utilisateur (Aldo, 2026-06-01) — appliqués pendant la revue :**
- ✅ **Header en admin** — `UserMenu` masque le raccourci « Mes commandes » sous `/admin` (`usePathname` → `isAdminArea`) ; le lien reste affiché sur les pages non-admin. La déconnexion (menu Paramètres) et le logo → accueil restent disponibles.
- ✅ **`/admin` → dashboard** — nouvelle route serveur `src/app/admin/page.tsx` appelant `redirect('/admin/dashboard')` (avant exécution du garde client). L'auth reste assurée par `AdminShell` + middleware API.
- ✅ **Lisibilité onglet actif** — l'état actif passe de `color:#2D4A3E` codé en dur sur `bg-accent` (illisible en **dark mode** : sage foncé sur fond vert sombre) à `bg-primary text-primary-foreground font-semibold` (tokens thématisés : contraste élevé en clair **et** sombre, ~9.5:1 en clair). Constante `SAGE` supprimée.

**Revue adversariale (4 lentilles, workflow) — 4 findings confirmés / 5 :**
- ✅ **[medium, a11y] Focus ring invisible sur l'onglet actif** — `--ring` == `--primary` (clair ET sombre) + absence de `ring-offset` → l'anneau de focus clavier se confondait avec le fond `bg-primary` de l'item actif. Fix : `focus-visible:ring-offset-2 focus-visible:ring-offset-background` (aligne sur `TemplateSelector`/`Footer`). Régression introduite par le correctif #3.
- ✅ **[low] `getMe()` redondant** — la dépendance `[pathname]` de l'effet relançait `/auth/me` à chaque navigation entre sous-routes admin. Fix : flag `useRef` → une seule vérification au montage du layout partagé.
- ✅ **[low] Frontière de segment** — `startsWith('/admin')` (dans `UserMenu` **et** `ConditionalFooter`) matcherait un futur `/admin-help`. Fix : `=== '/admin' || startsWith('/admin/')`.
- ✅ **[medium] Redirect post-login non consommé** — (dette pré-existante depuis Story 6.2 ; décision Aldo : corriger maintenant) `login/page.tsx` consomme désormais `?redirect=` via `useSearchParams` (sous `<Suspense>`), **validé chemin interne uniquement** (`safeInternalPath` rejette URLs absolues + protocol-relative `//host` → anti open-redirect) et transmis à `LoginForm.onSuccess` + `GoogleButton.returnTo` (prop déjà supporté). +2 e2e (retour à la page admin demandée ; redirect externe ignoré). L'auth reste assurée par le middleware API (NFR-S10).

### File List

**NEW — frontend**
- `siana-memento-web/src/app/admin/layout.tsx`
- `siana-memento-web/src/app/admin/page.tsx` *(redirect /admin → /admin/dashboard — review feedback)*
- `siana-memento-web/src/app/admin/logs/page.tsx`
- `siana-memento-web/src/app/admin/orders/page.tsx`
- `siana-memento-web/src/app/admin/testimonials/page.tsx`
- `siana-memento-web/src/components/siana/AdminShell.tsx`
- `siana-memento-web/src/components/siana/AdminSidebar.tsx`
- `siana-memento-web/src/components/siana/AdminComingSoon.tsx`
- `siana-memento-web/src/components/ui/sheet.tsx`
- `siana-memento-web/e2e/admin-layout.spec.ts`

**UPDATE — frontend**
- `siana-memento-web/src/components/siana/AdminDashboard.tsx` (retrait garde + wrapper `<main>` ; ne charge plus que les métriques)
- `siana-memento-web/src/components/siana/UserMenu.tsx` (masque « Mes commandes » sous `/admin` — review feedback ; frontière de segment)
- `siana-memento-web/src/components/siana/ConditionalFooter.tsx` (frontière de segment `/admin/` — durcissement revue adversariale)
- `siana-memento-web/src/app/(auth)/login/page.tsx` (consomme `?redirect=` post-login + validation chemin interne anti open-redirect — review finding #4)

**UPDATE — racine**
- `.gitignore` (négation `!siana-memento-web/src/app/admin/logs/` — la règle `logs/` masquait la route `/admin/logs`)

## Change Log

| Date | Version | Description | Auteur |
|------|---------|-------------|--------|
| 2026-06-01 | 0.1 | Story 6.3 créée (ready-for-dev) — layout admin partagé + sidebar + refactor garde 6.2 + pages placeholder. | create-story |
| 2026-06-01 | 1.0 | Implémentation 6.3 : layout `/admin` + `AdminShell` (garde centralisé, redirections, drawer), `AdminSidebar` (sections + actif + Sheet mobile), `AdminComingSoon` + 3 pages placeholder, `ui/sheet.tsx`, refactor garde hors `AdminDashboard`. 5 e2e admin verts ; tsc + eslint OK ; 0 régression (1 échec home préexistant hors story). | Amelia (dev-story) |
| 2026-06-01 | 1.1 | Retours utilisateur (Aldo) : (1) « Mes commandes » masqué dans le header sous `/admin` (`UserMenu` + `usePathname`) ; (2) `/admin` → redirect serveur vers `/admin/dashboard` (`src/app/admin/page.tsx`) ; (3) onglet sidebar actif lisible en clair **et** sombre (tokens `bg-primary`/`text-primary-foreground` au lieu du sage codé en dur sur `bg-accent`). +2 e2e (7/7 admin verts) ; tsc + eslint OK. | Amelia (review-fixes) |
| 2026-06-01 | 1.2 | Revue adversariale (4 lentilles) → 3 findings en scope corrigés : (1) **focus ring invisible** sur l'onglet actif (`--ring`==`--primary`) → ajout `ring-offset-2 ring-offset-background` (WCAG 2.4.7/2.4.11) ; (2) `getMe()` redondant à chaque sous-route admin → flag ref, un seul appel au montage ; (3) `isAdminArea` / `ConditionalFooter` durcis en frontière de segment `/admin/`. tsc + eslint + 17 e2e (dont 7 admin) verts, 0 régression. Finding #4 (redirect post-login non consommé) = dette pré-6.2, soumise à décision. | Amelia (review-fixes) |
| 2026-06-01 | 1.3 | Finding #4 corrigé (décision Aldo) : `login/page.tsx` consomme `?redirect=` (`useSearchParams` sous `<Suspense>`) avec validation chemin interne (anti open-redirect) + transmission `GoogleButton.returnTo`. Le garde admin ramène désormais l'utilisateur sur la page demandée après login. +2 e2e (19/20 verts ; seul échec = `home › hero` préexistant). tsc + eslint OK. | Amelia (review-fixes) |
| 2026-06-02 | 1.4 | Code review formelle (3 couches) traitée : décision conservée (changements voulus, `.gitignore` ajouté au File List) + 6 patchs appliqués (drawer ferme sur toute nav via `key={pathname}` ; bouton Réessayer sur erreur réseau ; skeleton neutre ; `safeInternalPath` rejette les caractères de contrôle ; `SheetDescription` a11y ; libellés de landmark distincts). +1 e2e (retry réseau). tsc + eslint + 20/21 e2e verts (seul échec = `home › hero` préexistant). Deferred : double `getMe` `SiteHeader` (pré-existant). | Amelia (review-fixes) |
| 2026-06-02 | 1.5 | Story passée en `done` (review formelle résolue) et mergée sur `main`. | Aldo |

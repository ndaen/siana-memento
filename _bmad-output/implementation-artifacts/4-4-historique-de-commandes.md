# Story 4.4: Historique de Commandes

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'utilisateur connecté,
je veux consulter mes commandes passées,
afin de retrouver facilement mes designs achetés.

## Acceptance Criteria

1. **Given** un utilisateur connecté accédant à son espace personnel
   **When** il consulte la page "Mes commandes"
   **Then** il voit la liste de ses commandes avec date, aperçu miniature du design, statut (livré), et un bouton de re-téléchargement visible mais désactivé (implémentation en story 4-5) (FR6)

2. **Given** aucune commande passée
   **When** l'utilisateur accède à la page
   **Then** un état vide bienveillant s'affiche avec un CTA pour créer son premier design

3. **Given** un utilisateur non connecté
   **When** il tente d'accéder à `/orders`
   **Then** il est redirigé vers la page de login avec retour automatique après connexion

4. **Given** un utilisateur connecté avec des commandes
   **When** la page se charge
   **Then** les commandes sont affichées par ordre chronologique inverse (plus récente en premier)

5. **Given** un utilisateur connecté
   **When** il accède à la page depuis le menu utilisateur
   **Then** un lien "Mes commandes" est visible dans le UserMenu dropdown

## Tasks / Subtasks

### Backend — Endpoint liste des commandes

- [x] Task 1 : Créer `GET /api/orders` — liste des commandes de l'utilisateur (AC: #1, #4)
  - [x] Ajouter méthode `index()` dans `OrdersController` avec `auth.getUserOrFail()`
  - [x] Query : `Order.query().where('userId', user.id).where('status', 'paid').preload('design').orderBy('createdAt', 'desc')`
  - [x] Réutiliser `serializeOrderWithDesign()` pour chaque order (même format que show/showBySession)
  - [x] Réponse : `{ success: true, data: OrderData[] }`
  - [x] Ajouter route `GET /api/orders` dans `start/routes.ts` avec `middleware.auth()` — AVANT les routes paramétriques `/:id` et `/by-session/:sessionId`

### Frontend — Client API

- [x] Task 2 : Ajouter `listOrders()` dans `src/lib/api/orders.ts` (AC: #1)
  - [x] Fonction : `listOrders(): Promise<ListOrdersResult>`
  - [x] Appel : `GET /api/orders` avec credentials
  - [x] Type `ListOrdersResult = { success: true; data: OrderData[] } | { success: false; error: ... }`
  - [x] Réutiliser les types `OrderData` et `OrderDesign` existants

### Frontend — Page historique de commandes

- [x] Task 3 : Créer la page `/orders` (AC: #1, #2, #3, #4)
  - [x] Créer `src/app/orders/page.tsx` — Server Component avec metadata
  - [x] Créer `src/components/siana/OrdersPage.tsx` — Client Component principal (`'use client'`)
  - [x] Au mount : vérifier auth via `getMe()`, si non connecté → `router.replace('/login?redirect=/orders')`
  - [x] Appeler `listOrders()` et afficher la liste ou l'état vide
  - [x] Loading state : skeleton cards (pattern existant avec `animate-pulse`)

- [x] Task 4 : Créer le composant `OrderCard` (AC: #1)
  - [x] Dans `src/components/siana/OrderCard.tsx`
  - [x] Afficher : miniature design (`previewUrl` via Cloudinary), noms des partenaires, date de commande, template, statut
  - [x] Format montant : `19,90 €` (Intl.NumberFormat fr-FR)
  - [x] Format date : `15 février 2026` (Intl.DateTimeFormat fr-FR, { day: 'numeric', month: 'long', year: 'numeric' })
  - [x] Bouton re-téléchargement conditionnel (préparation story 4-5, disabled pour l'instant avec tooltip "Bientôt disponible")
  - [x] Utiliser shadcn `Card` component comme base
  - [x] Image miniature : `<img>` avec `previewUrl` de Cloudinary, aspect ratio 3:4, fallback placeholder si null
  - [x] Responsive : stack vertical sur mobile, horizontal sur desktop

- [x] Task 5 : Créer le composant empty state (AC: #2)
  - [x] État vide bienveillant avec mascotte Siana
  - [x] Message : "Pas encore de commande" + sous-texte encourageant
  - [x] CTA : bouton "Créer mon Save the Date" → `/generate/upload`
  - [x] Utiliser les couleurs du design system (Vert Sauge #2D4A3E pour le CTA)

### Frontend — Navigation

- [x] Task 6 : Ajouter lien dans UserMenu (AC: #5)
  - [x] Dans `src/components/siana/UserMenu.tsx`, ajouter item "Mes commandes" avec icône (lucide `ShoppingBag`)
  - [x] Lien vers `/orders`
  - [x] Positionner avant le bouton "Se déconnecter"

### Tests

- [x] Task 7 : Tests backend (AC: #1, #3, #4)
  - [x] Test : `GET /api/orders` retourne les commandes `paid` de l'utilisateur connecté
  - [x] Test : `GET /api/orders` ne retourne PAS les commandes d'un autre utilisateur (isolation)
  - [x] Test : `GET /api/orders` ne retourne PAS les commandes `pending` ou `failed`
  - [x] Test : `GET /api/orders` retourne un tableau vide si aucune commande
  - [x] Test : `GET /api/orders` retourne 401 sans authentification
  - [x] Test : les commandes sont triées par `createdAt` DESC
  - [x] Test : chaque order inclut les données design (template, partnerNames, previewUrl)
  - [x] `npx tsc --noEmit` — zéro erreur TypeScript (backend ET frontend)
  - [x] Full test suite — zéro régression

### Review Follow-ups (AI)

- [x] [AI-Review][MEDIUM] Gérer l'état d'erreur de l'API dans `OrdersPage.tsx` au lieu d'afficher l'état vide. [siana-memento-web/src/components/siana/OrdersPage.tsx:32]
- [x] [AI-Review][MEDIUM] Afficher le skeleton pendant le check d'auth au lieu de retourner `null` pour éviter le flash blanc. [siana-memento-web/src/components/siana/OrdersPage.tsx:43]
- [x] [AI-Review][LOW] Ajouter le middleware `ordersThrottle` sur la route `GET /api/orders` pour limiter le rate. [siana-memento-api/start/routes.ts:50]
- [x] [AI-Review][LOW] Grouper les skeletons de chargement dans un `<ul>` et `<li>` pour respecter la sémantique HTML du reste de la liste. [siana-memento-web/src/components/siana/OrdersPage.tsx:55]

## Dev Notes

### Architecture : Nouvelle page protégée

Cette story crée la PREMIÈRE page protégée (auth-required) du frontend en dehors du flow de génération. La route `/orders` est une page autonome, pas un ajout au flow `/generate/*`.

**Routing :** Créer `src/app/orders/page.tsx` directement (pas de route group `(protected)` nécessaire pour une seule page). La protection auth se fait côté composant client, comme dans `ResultView.tsx` (pattern `getMe()` + redirect).

### Endpoint `GET /api/orders` — Ce qui existe vs ce qui manque

**Existe déjà dans `OrdersController` :**
- `store()` — POST, crée order + session Stripe
- `show()` — GET /:id, retourne une order avec design
- `showBySession()` — GET /by-session/:sessionId

**À créer :** `index()` — GET /api/orders, liste les orders paid de l'utilisateur.

**Sérialisation :** Réutiliser `serializeOrderWithDesign()` (lignes 8-28 de `orders_controller.ts`) qui retourne :
```typescript
{
  id, designId, amount, status, paidAt, emailSentAt, createdAt,
  design: { id, template, partner1Name, partner2Name, weddingDate, previewUrl } | null
}
```

**Route ordering dans `start/routes.ts` :** La route `GET /api/orders` (index) DOIT être placée AVANT `GET /api/orders/by-session/:sessionId` et `GET /api/orders/:id` pour éviter les collisions de paramètres (AdonisJS matche dans l'ordre de déclaration).

### Ordre actuel des routes orders (routes.ts lignes 73-80) :
```typescript
router.group(() => {
  router.post('/', [OrdersController, 'store']).use(ordersThrottle)
  router.get('/by-session/:sessionId', [OrdersController, 'showBySession'])
  router.get('/:id', [OrdersController, 'show'])
}).prefix('/api/orders').use(middleware.auth())
```

**Ajouter `router.get('/', [OrdersController, 'index'])` EN PREMIER dans le group** (avant le POST ou juste après).

### Modèle Order — Colonnes pertinentes

```typescript
// app/models/order.ts
id: number
userId: number
designId: number
stripeSessionId: string | null (unique)
stripePaymentIntentId: string | null
amount: number (1990 = 19,90€ en centimes)
status: 'pending' | 'paid' | 'failed'
paidAt: DateTime | null
emailSentAt: DateTime | null
createdAt: DateTime
updatedAt: DateTime | null
```

Relations : `@belongsTo(() => User)`, `@belongsTo(() => Design)`

Index existant : `idx_orders_user_id` sur `user_id` → query `where userId` déjà optimisée.

### Frontend — Patterns à suivre

**Auth check (pattern ResultView.tsx lignes 68-70) :**
```typescript
useEffect(() => {
  getMe().then((result) => setIsLoggedIn(result.success))
}, [])
```
Si `!isLoggedIn` après check → `router.replace('/login?redirect=/orders')`

**API client (pattern orders.ts existant) :**
```typescript
export async function listOrders(): Promise<ListOrdersResult> {
  const res = await fetch(`${API_URL}/api/orders`, { credentials: 'include' })
  // ... pattern identique à getOrder/getOrderBySession
}
```

**Composants shadcn disponibles :** `Card`, `Button`, `Badge` (pour le statut), `Skeleton` (pour le loading).

**Image Cloudinary :** `previewUrl` contient déjà l'URL complète de l'image watermarquée. Utiliser directement en `src` d'un `<img>` ou `<Image>` Next.js. Préférer `<img>` standard (pas d'optimisation Next.js nécessaire pour des URLs Cloudinary).

### UX — Ton émotionnel & design

**État avec commandes :**
- Design épuré, minimaliste, galerie-d'art
- Cards avec miniature 3:4 du design, info clé, statut
- Couleurs : palette monochrome + Vert Sauge (#2D4A3E) pour les actions
- Typographie : Clash Display pour le titre page, Satoshi pour le contenu

**État vide :**
- Mascotte Siana (illustration SVG existante dans `/public/`)
- Message chaleureux et encourageant
- CTA primaire vers `/generate/upload`

**Pas de pagination :** MVP cible <100 commandes par utilisateur. Une simple liste suffit. La pagination peut être ajoutée en Growth phase si nécessaire.

### Préparation story 4-5 (re-téléchargement)

Le bouton re-téléchargement est AFFICHÉ mais DÉSACTIVÉ dans cette story. Il sera activé dans la story 4-5 qui implémentera :
- `GET /api/orders/:id/download` — endpoint de téléchargement HR
- Vérification de la fenêtre RGPD 7 jours (`paidAt` + 7 jours > now)
- Téléchargement via URL signée Cloudinary

Pour cette story, afficher le bouton avec :
- `disabled` si story 4-5 non implémentée (toujours disabled pour l'instant)
- Tooltip ou texte "Bientôt disponible"
- Cela évite un changement d'UI visible quand 4-5 sera implémentée

### Conventions existantes à respecter

**Frontend (Next.js / React) :**
- Client components : `'use client'` directive
- Composants custom : PascalCase (`OrdersPage.tsx`, `OrderCard.tsx`)
- shadcn/ui : lowercase (`card.tsx`, `badge.tsx`)
- Toasts : `toast()` de `sonner` pour les erreurs système/réseau
- API calls : fonctions dans `src/lib/api/` avec pattern `{ success, data/error }`
- Labels implicits visuellement : utiliser `sr-only` pour l'accessibilité

**Backend (AdonisJS 6) :**
- Controllers : PascalCase + suffix `Controller`
- Routes : RESTful, groupées par préfixe
- Réponse : `{ success: true, data: {...} }` / `{ success: false, error: { code, message } }`
- Auth : `middleware.auth()`, `auth.getUserOrFail()` dans le controller
- Tests : `@japa/runner`, `testUtils.db().withGlobalTransaction()`

### Fichiers à créer / modifier

```
Backend — Modifier :
siana-memento-api/
├── app/controllers/orders_controller.ts   (ajouter index())
└── start/routes.ts                        (ajouter GET /api/orders)

Backend — Créer :
siana-memento-api/
└── tests/functional/orders/history.spec.ts

Frontend — Créer :
siana-memento-web/
├── src/app/orders/page.tsx                (Server Component, metadata)
├── src/components/siana/OrdersPage.tsx    (Client Component principal)
└── src/components/siana/OrderCard.tsx     (Card individuelle)

Frontend — Modifier :
siana-memento-web/
├── src/lib/api/orders.ts                  (ajouter listOrders + types)
└── src/components/siana/UserMenu.tsx      (ajouter lien "Mes commandes")
```

### Previous Story Intelligence (4-3)

**Learnings de la story 4-3 :**
- `serializeOrderWithDesign()` est la fonction de sérialisation standard — la réutiliser pour la liste (DRY)
- Le modèle Design n'a PAS de champ `cloudinaryPreviewId` ni `templateName` — les vrais champs sont `previewUrl` et `template`
- Route ordering critique dans AdonisJS : les routes paramétriques (`/:id`) matchent avant les routes nommées si mal ordonnées
- Pattern de test fonctionnel : `testUtils.db().withGlobalTransaction()` pour isolation
- 126 tests passent en suite complète — ne pas casser de régressions
- `emailSentAt` peut servir d'indicateur "livré" pour le statut affiché

### Git Intelligence

Derniers commits pertinents (Epic 4) :
- `eca233e` feat(S4-3): post-purchase confirmation page with API verification
- `fdad52f` fix: sessionToken security — atomic claim verification + logout cleanup
- `f87d2ae` feat(S4-2): delivery email avec fichier haute résolution via Resend
- `c9ba59c` feat(S4-1): checkout Stripe avec webhook idempotent et bouton Commander

Conventions : commits conventionnels en anglais, préfixe `feat(S4-X):` pour les stories de l'epic 4.

### Points d'attention

1. **Pas d'image HR dans l'API** : `cloudinaryPublicId` = image originale sans watermark. N'utiliser que `previewUrl` pour les miniatures.
2. **Montant en centimes** : `amount` stocké comme `1990` (centimes). Formatter côté frontend : `(amount / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })`.
3. **Statut affiché** : Seules les commandes `paid` sont listées. Le statut affiché peut être "Livré" si `emailSentAt` est non-null, "En cours" sinon.
4. **Accessibilité** : Structure sémantique `<main>`, `<h1>`, liste `<ul>` ou grille avec `role="list"`. Images avec `alt` descriptif.

### Références

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.4] — User story + ACs originaux
- [Source: _bmad-output/planning-artifacts/prd.md#FR6] — Historique de commandes
- [Source: _bmad-output/planning-artifacts/prd.md#FR7] — Re-téléchargement 7 jours (préparation)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — Empty state pattern, design system
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Response-Format] — Pattern { success, data }
- [Source: siana-memento-api/app/controllers/orders_controller.ts:8-28] — serializeOrderWithDesign()
- [Source: siana-memento-api/app/models/order.ts] — Order model complet
- [Source: siana-memento-api/app/models/design.ts] — Design model (previewUrl, template)
- [Source: siana-memento-api/start/routes.ts:73-80] — Routes orders existantes
- [Source: siana-memento-web/src/lib/api/orders.ts] — Client API orders (getOrder, getOrderBySession existants)
- [Source: siana-memento-web/src/components/siana/UserMenu.tsx] — Menu utilisateur à enrichir
- [Source: siana-memento-web/src/components/siana/ResultView.tsx:68-70] — Pattern auth check
- [Source: _bmad-output/implementation-artifacts/4-3-page-de-confirmation-post-achat.md] — Story 4-3, patterns + learnings

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

- Pas de Tooltip shadcn installé → utilisation de `title` natif HTML pour le bouton re-téléchargement disabled
- `listOrders()` type result utilise `orders` (pluriel) au lieu de `data` pour cohérence avec le pattern frontend existant (`getOrder` retourne `order`)
- Empty state intégré directement dans `OrdersPage.tsx` plutôt qu'un composant séparé — complexité insuffisante pour justifier un fichier distinct
- Route `GET /api/orders` placée AVANT `POST /api/orders` et les routes paramétriques dans routes.ts

### Completion Notes List

- Task 1 : `index()` dans OrdersController — query paid orders + preload design + orderBy DESC + serializeOrderWithDesign mapping
- Task 2 : `listOrders()` dans lib/api/orders.ts — type `ListOrdersResult`, réutilise `OrderData`/`OrderDesign` existants
- Task 3 : Page `/orders` — Server Component (metadata) + Client Component (auth guard, data fetching, skeleton loading)
- Task 4 : `OrderCard` — shadcn Card, miniature 3:4, Intl formatage fr-FR (date + montant centimes), Badge statut, bouton disabled
- Task 5 : Empty state dans OrdersPage — mascotte siana-neutral.svg, message encourageant, CTA Vert Sauge vers /generate/upload
- Task 6 : UserMenu enrichi — lien "Mes commandes" avec icône ShoppingBag, positionné avant LogoutButton
- Task 7 : 7 tests fonctionnels (paid only, isolation user, no pending/failed, empty array, 401, DESC order, design data). 133/133 full suite.

### Change Log

- feat(S4-4): GET /api/orders endpoint — list paid orders for authenticated user
- feat(S4-4): listOrders() frontend API client with ListOrdersResult type
- feat(S4-4): /orders page with auth guard, skeleton loading, and order list
- feat(S4-4): OrderCard component with design thumbnail, status badge, disabled download button
- feat(S4-4): empty state with Siana mascot and CTA to create first design
- feat(S4-4): "Mes commandes" link in UserMenu with ShoppingBag icon
- test(S4-4): 7 tests history.spec.ts — isolation, filtering, sorting, auth, design data
- review(S4-4): Code review effectuée par Aldo. Action items ajoutés pour les problèmes mineurs d'UX et d'erreurs d'API. Statut mis à jour sur in-progress.
- fix(S4-4): Addressed 4 code review findings — error state with siana-error mascot, skeleton during auth check, ordersThrottle on GET, semantic ul/li for skeletons

### File List

**Backend — Modifiés :**
- `siana-memento-api/app/controllers/orders_controller.ts`
- `siana-memento-api/start/routes.ts`

**Backend — Créés :**
- `siana-memento-api/tests/functional/orders/history.spec.ts`

**Frontend — Créés :**
- `siana-memento-web/src/app/orders/page.tsx`
- `siana-memento-web/src/components/siana/OrdersPage.tsx`
- `siana-memento-web/src/components/siana/OrderCard.tsx`

**Frontend — Modifiés :**
- `siana-memento-web/src/lib/api/orders.ts`
- `siana-memento-web/src/components/siana/UserMenu.tsx`

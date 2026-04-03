# Story 4.5: Re-téléchargement dans les 7 Jours

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'utilisateur connecté ayant acheté un design,
je veux pouvoir le re-télécharger depuis mon espace personnel,
afin de récupérer mon fichier si l'email a été supprimé ou perdu.

## Acceptance Criteria

1. **Given** un utilisateur connecté dont le design a été acheté il y a moins de 7 jours
   **When** il clique sur "Re-télécharger" dans son historique
   **Then** le fichier haute résolution est téléchargé directement (FR7)

2. **Given** un design acheté il y a plus de 7 jours
   **When** l'utilisateur tente de le re-télécharger
   **Then** le bouton est désactivé et un message indique que le fichier n'est plus disponible (conformément à la politique RGPD)

## Tasks / Subtasks

### Backend — Endpoint de re-téléchargement

- [x] Task 1 : Créer `GET /api/orders/:id/download` — endpoint de téléchargement HR (AC: #1, #2)
  - [x] Ajouter méthode `download()` dans `OrdersController`
  - [x] Auth check : `auth.getUserOrFail()` + vérifier `order.userId === user.id`
  - [x] Vérifier `order.status === 'paid'` sinon 400
  - [x] Vérifier fenêtre RGPD 7 jours : `order.paidAt.plus({ days: 7 }) > DateTime.now()` sinon 410 Gone
  - [x] Preload design et vérifier `design.cloudinaryPublicId` non null
  - [x] Construire URL HR : `getOriginalDesignUrl(design.cloudinaryPublicId)` via cloudinary_service
  - [x] Retourner `{ success: true, data: { downloadUrl } }`
  - [x] Ajouter route dans `start/routes.ts` DANS le group orders existant, avec `ordersThrottle`

### Frontend — Client API download

- [x] Task 2 : Ajouter `downloadDesign(orderId)` dans `src/lib/api/orders.ts` (AC: #1)
  - [x] Type `DownloadResult = { success: true; downloadUrl: string } | { success: false; errorCode: string; message: string }`
  - [x] Appel : `GET /api/orders/${orderId}/download` avec credentials
  - [x] Gestion erreur réseau → `{ success: false, errorCode: 'NETWORK_ERROR', message: 'Service indisponible.' }`

### Frontend — Activation du bouton re-téléchargement

- [x] Task 3 : Modifier `OrderCard.tsx` pour activer le bouton download (AC: #1, #2)
  - [x] Calculer expiration : `paidAt + 7 jours > now` côté client pour état visuel
  - [x] Si non expiré et `emailSentAt` non null : bouton actif avec handler `handleDownload()`
  - [x] Si expiré : bouton disabled avec texte "Expiré" et tooltip "Fichier supprimé après 7 jours (RGPD)"
  - [x] Si `emailSentAt` null (livraison en cours) : bouton disabled avec texte "En cours..."
  - [x] Loading state pendant le téléchargement : spinner + disabled
  - [x] Appeler `downloadDesign(order.id)` → si success, déclencher download navigateur via `window.open(downloadUrl, '_blank')`
  - [x] Si erreur (expired, network) : `toast.error(result.message)`

### Frontend — Affichage expiration

- [x] Task 4 : Ajouter indicateur d'expiration sur OrderCard (AC: #2)
  - [x] Calculer jours restants : `Math.ceil((paidAt + 7j - now) / (1000*60*60*24))`
  - [x] Afficher sous le bouton : "Disponible encore X jour(s)" en text-muted-foreground text-xs
  - [x] Si expiré : afficher "Fichier expiré" en text-destructive text-xs
  - [x] Pluralisation : "1 jour" vs "X jours" (+ "Dernier jour" en amber-600)

### Tests

- [x] Task 5 : Tests backend endpoint download (AC: #1, #2)
  - [x] Test : `GET /api/orders/:id/download` retourne 200 avec `downloadUrl` pour order paid < 7 jours
  - [x] Test : `GET /api/orders/:id/download` retourne 410 Gone pour order paid > 7 jours
  - [x] Test : `GET /api/orders/:id/download` retourne 403 pour order d'un autre utilisateur
  - [x] Test : `GET /api/orders/:id/download` retourne 401 sans authentification
  - [x] Test : `GET /api/orders/:id/download` retourne 400 pour order non paid (pending/failed)
  - [x] Test : `GET /api/orders/:id/download` retourne 404 pour order inexistante
  - [x] Test : `GET /api/orders/:id/download` retourne 422 si design n'a pas de cloudinaryPublicId
  - [x] `npx tsc --noEmit` — zéro erreur TypeScript (backend ET frontend)
  - [x] Full test suite — zéro régression (140/140)

## Dev Notes

### Architecture : Endpoint download séparé

Le re-téléchargement est un endpoint **séparé** (`GET /api/orders/:id/download`) et non une extension du `show()` existant. Raisons :
- Séparation des responsabilités : consultation vs téléchargement
- Rate limiting distinct possible
- Logging spécifique des downloads pour analytics
- Le `cloudinaryPublicId` n'est JAMAIS exposé dans l'API publique — seul l'endpoint download construit l'URL

### URL haute résolution — Pattern existant

L'EmailService utilise déjà ce pattern pour construire l'URL HR :
```typescript
// siana-memento-api/app/services/email_service.ts
function getOriginalDesignUrl(cloudinaryPublicId: string): string {
  return cloudinary.url(cloudinaryPublicId, { secure: true })
}
```

**Réutiliser exactement ce pattern** dans le controller download. L'URL Cloudinary directe est suffisante pour le MVP — pas besoin de signed URLs car :
- L'endpoint est protégé par auth + ownership check
- L'URL est éphémère (générée à la demande, non stockée côté client)
- Le fichier sera supprimé par le cron RGPD après 7 jours de toute façon

### Modèle Design — Champs pertinents

```typescript
// siana-memento-api/app/models/design.ts
cloudinaryPublicId: string | null  // 'designs/design-{id}' — image HR sans watermark
previewUrl: string | null          // URL watermarquée (preview seulement)
status: 'draft' | 'generating' | 'completed' | 'paid' | 'expired'
```

**ATTENTION :** `previewUrl` = watermarquée. `cloudinaryPublicId` = originale HR sans watermark. Ne JAMAIS confondre les deux.

### Modèle Order — Champs pour la fenêtre RGPD

```typescript
// siana-memento-api/app/models/order.ts
paidAt: DateTime | null    // Timestamp du paiement — BASE pour le calcul des 7 jours
status: 'pending' | 'paid' | 'failed'
emailSentAt: DateTime | null  // Indicateur "livré"
```

**Calcul expiration :**
```typescript
const isExpired = order.paidAt && DateTime.now() > order.paidAt.plus({ days: 7 })
```

### Route ordering — Position dans routes.ts

Routes orders actuelles (après story 4-4) :
```typescript
router.group(() => {
  router.get('/', [OrdersController, 'index']).use(ordersThrottle)
  router.post('/', [OrdersController, 'store']).use(ordersThrottle)
  router.get('/by-session/:sessionId', [OrdersController, 'showBySession'])
  router.get('/:id', [OrdersController, 'show'])
}).prefix('/api/orders').use(middleware.auth())
```

**Ajouter `router.get('/:id/download', ...)` AVANT `router.get('/:id', ...)`** pour éviter que `download` soit interprété comme un `:id`.

### Sérialisation — Ne PAS exposer cloudinaryPublicId

La fonction `serializeOrderWithDesign()` ne sérialise volontairement PAS `cloudinaryPublicId` :
```typescript
design: order.design ? {
  id, template, partner1Name, partner2Name, weddingDate, previewUrl
  // cloudinaryPublicId NON inclus — sécurité
} : null
```

**Ne pas modifier cette sérialisation.** L'URL HR est construite côté backend et retournée uniquement via l'endpoint `/download`.

### Codes d'erreur HTTP

| Situation | HTTP Status | Error Code |
|-----------|------------|------------|
| Non authentifié | 401 | (AdonisJS middleware) |
| Order pas trouvée | 404 | `ORDER_NOT_FOUND` |
| Order d'un autre user | 403 | `FORBIDDEN` |
| Order non payée | 400 | `ORDER_NOT_PAID` |
| Fenêtre 7 jours dépassée | 410 Gone | `DOWNLOAD_EXPIRED` |
| Design sans cloudinaryPublicId | 422 | `DESIGN_FILE_MISSING` |

**410 Gone** est le code HTTP sémantiquement correct : la ressource existait mais n'est plus disponible.

### Frontend — Mécanisme de téléchargement

Deux options pour déclencher le download côté navigateur :

**Option A (recommandée) — `window.open` :**
```typescript
window.open(result.downloadUrl, '_blank')
```
Simple, déclenche le téléchargement natif du navigateur. L'URL Cloudinary avec extension `.png` sera téléchargée directement.

**Option B — Anchor tag programmé :**
```typescript
const a = document.createElement('a')
a.href = result.downloadUrl
a.download = 'save-the-date.png'
a.click()
```
Plus de contrôle sur le nom du fichier, mais nécessite que les CORS Cloudinary autorisent le download.

**Recommandation :** Commencer par Option A. Si le navigateur affiche l'image au lieu de la télécharger, passer à Option B.

### Frontend — Calcul de l'expiration côté client

Le calcul côté client est **indicatif** (UX). La véritable vérification se fait côté backend.

```typescript
function getRemainingDays(paidAt: string | null): number | null {
  if (!paidAt) return null
  const expiry = new Date(new Date(paidAt).getTime() + 7 * 24 * 60 * 60 * 1000)
  const remaining = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return remaining > 0 ? remaining : 0
}
```

### UX — Tons et messages

| État | Bouton | Message sous le bouton | Couleur |
|------|--------|----------------------|---------|
| Disponible (< 7j) | "Re-télécharger" actif | "Disponible encore X jour(s)" | text-muted-foreground |
| Dernier jour | "Re-télécharger" actif | "Dernier jour pour télécharger" | text-amber-600 |
| Expiré (> 7j) | "Expiré" disabled | "Fichier expiré (RGPD)" | text-destructive |
| En cours de livraison | "En cours..." disabled | — | text-muted-foreground |
| Téléchargement en cours | Spinner + disabled | — | — |

### Conventions existantes à respecter

**Frontend (Next.js / React) :**
- Client components : `'use client'` directive
- Toast : `toast.error()` de `sonner` pour erreurs réseau/système
- API calls : fonctions dans `src/lib/api/` avec pattern `{ success, data/error }`
- Icons : lucide-react (`Download` déjà importé dans OrderCard)
- Dates : `Intl.DateTimeFormat` fr-FR pour l'affichage

**Backend (AdonisJS 6) :**
- Controllers : méthodes dans le controller existant (pas de nouveau controller)
- Réponse : `{ success: true, data: {...} }` / `{ success: false, error: { code, message } }`
- Auth : `middleware.auth()` au niveau du group, `auth.getUserOrFail()` dans le controller
- Logging : structured avec `event`, `orderId`, `userId`
- Tests : `@japa/runner`, `testUtils.db().withGlobalTransaction()`, helpers `loginAs()` et `createDesignForUser()`

### Fichiers à créer / modifier

```
Backend — Modifier :
siana-memento-api/
├── app/controllers/orders_controller.ts   (ajouter download())
└── start/routes.ts                        (ajouter GET /api/orders/:id/download)

Backend — Créer :
siana-memento-api/
└── tests/functional/orders/download.spec.ts

Frontend — Modifier :
siana-memento-web/
├── src/lib/api/orders.ts                  (ajouter downloadDesign() + types)
└── src/components/siana/OrderCard.tsx     (activer bouton + logique expiration)
```

### Project Structure Notes

- Alignement parfait avec la structure existante — aucun nouveau dossier nécessaire
- L'endpoint download s'intègre dans le group orders existant
- Les tests suivent le pattern `tests/functional/orders/*.spec.ts`
- Le composant OrderCard est modifié in-place (pas de nouveau composant)

### Previous Story Intelligence (4-4)

**Learnings de la story 4-4 :**
- `serializeOrderWithDesign()` est la fonction de sérialisation standard — NE PAS la modifier pour inclure cloudinaryPublicId
- Route ordering critique dans AdonisJS : les routes paramétriques (`/:id`) matchent avant les sous-routes si mal ordonnées → placer `/:id/download` AVANT `/:id`
- Pattern de test fonctionnel : `testUtils.db().withGlobalTransaction()` pour isolation
- 133 tests passent en suite complète — ne pas casser de régressions
- `emailSentAt` sert d'indicateur "livré" — le bouton download ne doit être actif que si livré ET non expiré
- Le bouton est déjà rendu dans OrderCard avec `disabled` et titre "Bientôt disponible" — il suffit de le rendre conditionnel
- Pas de Tooltip shadcn installé → continuer d'utiliser `title` natif HTML

**Review follow-ups de 4-4 appliqués :**
- Error state avec mascotte siana-error ✓
- Skeleton pendant auth check ✓
- `ordersThrottle` sur GET /api/orders ✓
- Sémantique ul/li pour skeletons ✓

### Git Intelligence

Derniers commits pertinents (Epic 4) :
- `52c1c11` feat(S4-4): order history page with API endpoint and empty state
- `eca233e` feat(S4-3): post-purchase confirmation page with API verification
- `fdad52f` fix: sessionToken security — atomic claim verification + logout cleanup
- `f87d2ae` feat(S4-2): delivery email avec fichier haute résolution via Resend
- `c9ba59c` feat(S4-1): checkout Stripe avec webhook idempotent et bouton Commander

Conventions : commits conventionnels en anglais, préfixe `feat(S4-X):` pour les stories de l'epic 4.

### Points d'attention critiques

1. **Ne PAS exposer `cloudinaryPublicId` dans l'API publique** — l'URL HR est construite côté backend uniquement
2. **Vérification double** : côté client (UX) + côté backend (sécurité) pour la fenêtre 7 jours
3. **410 Gone** (pas 403 ni 404) pour les designs expirés — sémantique HTTP correcte
4. **Le cron RGPD (`cleanup:rgpd`)** supprime les fichiers Cloudinary après 7 jours — l'endpoint download échouera naturellement si le fichier est supprimé (422 DESIGN_FILE_MISSING)
5. **`paidAt`** est la base du calcul, PAS `createdAt` — un order peut être `pending` pendant un moment avant le paiement

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.5] — User story + ACs originaux (FR7)
- [Source: _bmad-output/planning-artifacts/prd.md#FR7] — Re-téléchargement 7 jours
- [Source: _bmad-output/planning-artifacts/architecture.md#RGPD] — Politique de rétention 7 jours
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Response-Format] — Pattern { success, data }
- [Source: siana-memento-api/app/controllers/orders_controller.ts] — Controller orders existant + serializeOrderWithDesign()
- [Source: siana-memento-api/app/models/order.ts] — Order model (paidAt, status, emailSentAt)
- [Source: siana-memento-api/app/models/design.ts] — Design model (cloudinaryPublicId, previewUrl)
- [Source: siana-memento-api/app/services/cloudinary_service.ts] — Upload/URL generation patterns
- [Source: siana-memento-api/app/services/email_service.ts] — getOriginalDesignUrl() pattern à réutiliser
- [Source: siana-memento-api/start/routes.ts] — Routes orders existantes (group ordering)
- [Source: siana-memento-web/src/lib/api/orders.ts] — Client API orders (types OrderData, OrderDesign)
- [Source: siana-memento-web/src/components/siana/OrderCard.tsx] — Bouton disabled actuel à activer
- [Source: _bmad-output/implementation-artifacts/4-4-historique-de-commandes.md] — Story 4-4 learnings

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

- `getOriginalDesignUrl()` extraite dans `cloudinary_service.ts` (exportée) au lieu de dupliquer `cloudinary.url()` dans le controller — DRY avec email_service.ts
- `email_service.ts` mis à jour pour importer `getOriginalDesignUrl` depuis `cloudinary_service` au lieu de sa copie locale (suppression import `cloudinary` devenu inutile)
- Pluralisation expiration : "Dernier jour pour télécharger" (amber-600) pour `remainingDays === 1`, distinct de "Disponible encore X jours"

### Completion Notes List

- Task 1 : `download()` dans OrdersController — auth check, ownership, status paid, 7-day RGPD window (410 Gone), cloudinaryPublicId check (422), downloadUrl via getOriginalDesignUrl()
- Task 2 : `downloadDesign()` dans lib/api/orders.ts — type DownloadResult, GET with credentials, network error handling
- Task 3 : OrderCard.tsx — bouton conditionnel (canDownload = delivered && !expired), loading state Loader2, toast.error, window.open pour download
- Task 4 : Indicateur expiration — getRemainingDays(), 3 états visuels (disponible/dernier jour/expiré), classes text-muted-foreground/text-amber-600/text-destructive
- Task 5 : 7 tests download.spec.ts (200, 410, 403, 401, 400, 404, 422). TSC clean. 140/140 full suite.

### Change Log

- feat(S4-5): GET /api/orders/:id/download endpoint with 7-day RGPD window
- refactor(S4-5): extract getOriginalDesignUrl() to cloudinary_service (shared with email_service)
- feat(S4-5): downloadDesign() frontend API client with DownloadResult type
- feat(S4-5): activate OrderCard download button with expiration indicator
- test(S4-5): 7 tests download.spec.ts — auth, ownership, expiration, edge cases
- review(S4-5): Code review — 2 MEDIUM issues fixed (dedicated downloadThrottle, removed Record<string,any>), 2 LOW noted (cross-origin download attr, test helper duplication)

### File List

**Backend — Modifiés :**
- `siana-memento-api/app/controllers/orders_controller.ts`
- `siana-memento-api/app/services/cloudinary_service.ts`
- `siana-memento-api/app/services/email_service.ts`
- `siana-memento-api/start/routes.ts`

**Backend — Créés :**
- `siana-memento-api/tests/functional/orders/download.spec.ts`

**Frontend — Modifiés :**
- `siana-memento-web/src/lib/api/orders.ts`
- `siana-memento-web/src/components/siana/OrderCard.tsx`

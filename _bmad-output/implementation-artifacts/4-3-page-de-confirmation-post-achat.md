# Story 4.3 : Page de Confirmation Post-Achat

Status: done

## Story

En tant qu'utilisateur ayant payé,
je veux voir une page de confirmation enthousiaste,
afin de vivre le moment de possession de mon design et être encouragé à le partager.

## Acceptance Criteria

1. **Given** un paiement confirmé (retour Stripe avec `?session_id`)
   **When** l'utilisateur est redirigé vers la page de confirmation
   **Then** il voit un message de célébration ("Votre Save the Date est en route ! Vérifiez votre boîte email."), un récapitulatif de commande (montant, date, template), et un aperçu de son illustration (FR26)

2. **Given** la page de confirmation
   **When** l'utilisateur la consulte
   **Then** l'adresse email de support est visible avec un message rassurant ("Une question ? Répondez simplement à l'email reçu") (FR49)

3. **Given** un paiement confirmé
   **When** l'utilisateur recharge la page ou y revient plus tard
   **Then** la confirmation reste accessible tant que le Zustand store contient le `designId` et que le paiement est vérifié via l'API

4. **Given** un retour Stripe avec `?session_id`
   **When** le composant se monte
   **Then** le système vérifie le statut de la commande via `GET /api/orders/:id` avant d'afficher la confirmation (pas de trust aveugle sur le query param)

5. **Given** un paiement annulé (`?canceled=true`)
   **When** l'utilisateur revient sur la page
   **Then** le bandeau "Commande confirmée" n'apparaît PAS — seul le toast d'info existant s'affiche et les boutons d'achat/itération restent actifs

## Tasks / Subtasks

### Backend — Endpoint enrichi pour la confirmation

- [x] Task 1 : Enrichir `GET /api/orders/:id` avec les données nécessaires à la confirmation (AC: #1, #4)
  - [x] Précharger la relation `design` dans `OrdersController.show` (design déjà preloaded, sérialisation via `serializeOrderWithDesign`)
  - [x] Ajouter dans la réponse : `design.template`, `design.partner1Name`, `design.partner2Name`, `design.weddingDate`, `design.previewUrl` (champs réels du modèle)
  - [x] Vérifier que les champs sensibles ne sont PAS exposés (`cloudinaryPublicId` = image HR originale → JAMAIS dans la réponse)
  - [x] Conserver le ownership check existant (`order.userId !== auth.user.id → 403`)

### Backend — Endpoint lookup par Stripe session ID

- [x] Task 2 : Créer `GET /api/orders/by-session/:sessionId` (AC: #4)
  - [x] Route protégée par auth middleware
  - [x] Chercher `Order.query().where('stripeSessionId', params.sessionId).preload('design').first()` + ownership check
  - [x] Réponse identique à `GET /api/orders/:id` enrichi (même sérialisation via `serializeOrderWithDesign`)
  - [x] Route placée AVANT `/:id` dans routes.ts pour éviter collision de paramètres

### Frontend — Transformation du post-payment dans ResultView

- [x] Task 3 : Ajouter la vérification API du paiement (AC: #4, #5)
  - [x] Quand `?session_id` est présent, appeler `GET /api/orders/by-session/{session_id}`
  - [x] Si la réponse confirme `status === 'paid'` → passer en mode confirmation avec les données de l'order
  - [x] Si `status === 'pending'` → retry après 3s (race condition webhook), sinon toast d'info
  - [x] Si l'API échoue → toast d'erreur sans afficher la confirmation
  - [x] Stocker l'`orderId` dans le Zustand store via `setPaid(orderId)` pour persistance post-refresh

- [x] Task 4 : Créer le bloc de confirmation post-achat (AC: #1, #2)
  - [x] Remplacer le bandeau vert simple par une section de confirmation riche :
    - Mascotte `siana-success.svg` avec message de célébration : "Votre Save the Date est en route !"
    - Sous-titre : "Vérifiez votre boîte email — {partner1Name} & {partner2Name}"
    - Récapitulatif de commande en `<dl>` accessible : montant (19,90 €), date, template
    - Message support avec mailto: "support@siana-memento.fr"
  - [x] Cacher les boutons "Commander" et "Ajuster" quand `isPaid === true`
  - [x] Zoom dialog reste fonctionnel sur l'image (inchangé)

- [x] Task 5 : Persister l'état de paiement dans le Zustand store (AC: #3)
  - [x] Ajouté `orderId: number | null` et `isPaid: boolean` au store + `setPaid(orderId)` action
  - [x] Setter `orderId` et `isPaid` après vérification API réussie
  - [x] `ResultGuard` modifié : si `isPaid && orderId` → ne pas rediriger même sans `generatedImageUrl`
  - [x] `orderId` et `isPaid` ajoutés à `partialize` pour persistance localStorage
  - [x] `resetForPhotoChange` nettoie `orderId`/`isPaid`

### Frontend — Client API

- [x] Task 6 : Ajouter `getOrderBySession` dans `src/lib/api/orders.ts` (AC: #4)
  - [x] Fonction : `getOrderBySession(sessionId: string): Promise<GetOrderResult>`
  - [x] Appel : `GET /api/orders/by-session/${sessionId}` avec credentials
  - [x] Types `OrderData` et `OrderDesign` exportés avec les champs enrichis (design info incluse)

### Tests

- [x] Task 7 : Tests backend (AC: #1, #2, #4)
  - [x] Test : `GET /api/orders/:id` retourne les données design enrichies (template, partner names, weddingDate, previewUrl)
  - [x] Test : `GET /api/orders/:id` ne retourne PAS `cloudinaryPublicId` (sécurité — image HR)
  - [x] Test : `GET /api/orders/by-session/:sessionId` retourne l'order correcte pour un user authentifié
  - [x] Test : `GET /api/orders/by-session/:sessionId` retourne 403 pour un autre user
  - [x] Test : `GET /api/orders/by-session/:sessionId` retourne 404 pour un sessionId inexistant
  - [x] `npx tsc --noEmit` — zéro erreur TypeScript (backend ET frontend)
  - [x] Full test suite — 126/126 tests passent, zéro régression

### Review Follow-ups (AI)

- [x] [AI-Review][High] AC #3 non respecté (Page blanche au rechargement) : `displayImageUrl` fallback vers `orderData?.design?.previewUrl`. Le early return ne bloque plus si `isPaid` est true.
- [x] [AI-Review][High] AC #3 non respecté (Absence de vérification API) : Ajouté `useEffect` qui appelle `getOrder(orderId)` au mount quand `isPaid && orderId` mais pas de `orderData` ni de `?session_id`.
- [x] [AI-Review][Medium] Fichiers modifiés non documentés : `compose.yaml` et `skills-lock.json` sont des fichiers untracked pré-existants, non liés à cette story.
- [x] [AI-Review][Medium] UX Déni au paiement : Guard `if (isPaid) return` ajouté dans `handleOrder` et `handleAuthSuccess`.

## Dev Notes

### Architecture : Enrichissement de la page résultat existante

Cette story NE crée PAS de nouvelle page/route. Elle transforme l'état post-paiement du `ResultView.tsx` existant en une expérience de confirmation riche. Le routing reste `/generate/result?session_id={CHECKOUT_SESSION_ID}`.

**Pourquoi pas de route `/confirmation/[orderId]` ?**
Le flow Stripe redirige déjà vers `/generate/result?session_id=...`. Changer l'URL de retour Stripe nécessiterait de modifier la session Stripe (story 4-1), et le `ResultView` contient déjà toute la logique d'affichage du design. Il est plus simple d'enrichir la vue existante.

### Composant actuel — Ce qui existe (ResultView.tsx)

Le `ResultView` (400 lignes) gère déjà :
- Révélation avec fade-in 2s + confettis 3s (lignes 119-159)
- Zoom dialog plein écran (lignes 282-303)
- Feedback/itérations dialog (lignes 314-398)
- Bouton "Commander" avec flow auth modal (lignes 85-117)
- État `isPaid` local via `useState` déclenché par `?session_id` (lignes 73-83)

**Ce qui doit changer :**
- `isPaid` passe de `useState` local → Zustand store (persisté)
- Le bandeau vert simple (lignes 258-261) → section de confirmation complète
- Ajout d'un appel API pour vérifier le paiement au lieu de faire confiance au query param

### Endpoint `GET /api/orders/by-session/:sessionId`

Nécessaire car le frontend reçoit un `session_id` Stripe, pas un `orderId`. L'alternative serait de stocker l'`orderId` dans le store avant la redirection Stripe, mais ça ne gère pas le cas d'un refresh entre-temps.

Pattern à suivre dans `OrdersController` :
```typescript
async showBySession({ params, auth, response }: HttpContext) {
  const order = await Order.query()
    .where('stripeSessionId', params.sessionId)
    .preload('design')
    .firstOrFail()

  if (order.userId !== auth.user!.id) {
    return response.forbidden({ success: false, error: { code: 'FORBIDDEN', message: 'Accès refusé' } })
  }

  return response.ok({ success: true, data: serializeOrderConfirmation(order) })
}
```

### Sérialisation sécurisée — NE PAS exposer l'image HR

Le `design.cloudinaryPublicId` est l'ID de l'image **originale sans watermark** (cf. story 3-6). Il ne doit JAMAIS apparaître dans une réponse API. Seul `design.cloudinaryPreviewId` (image watermarquée) est exposable.

Champs à inclure dans la réponse order enrichie :
```typescript
{
  id, status, amount, paidAt, createdAt,
  design: {
    id, templateName, partner1Name, partner2Name,
    weddingDate, cloudinaryPreviewId  // ← preview watermarquée uniquement
  }
}
```

### UX de la confirmation — Ton émotionnel

L'UX spec définit le moment post-achat comme **"Wow #2 — Le Moment de Possession"** avec les émotions : **Accomplissement & Fierté**. Le design doit être :
- **Célébratoire** mais pas over-the-top — confettis déjà gérés par la révélation
- **Rassurant** — l'email est en route, voici le récap
- **Utile** — email support visible, récap de commande clair

### Conventions existantes à respecter

**Frontend (Next.js / React) :**
- Client components : `'use client'` directive
- Composants custom : PascalCase (`ResultView.tsx`)
- shadcn/ui : lowercase (`button.tsx`, `card.tsx`)
- Toasts : `toast()` de `sonner` pour les messages système
- API calls : fonctions dans `src/lib/api/` avec pattern `{ success, data/error }`
- Zustand : `useGenerationStore` avec persistance localStorage

**Backend (AdonisJS 6) :**
- Controllers : PascalCase + suffix `Controller` (`OrdersController`)
- Routes : RESTful (`/api/orders/:id`)
- Réponse : `{ success: true, data: { ... } }` / `{ success: false, error: { code, message } }`
- Auth : `auth.authenticate()` middleware, `auth.user!.id` pour ownership
- Tests : `@japa/runner`, `testUtils.db().withGlobalTransaction()`

### Fichiers à modifier

```
Frontend — Modifier :
siana-memento-web/
├── src/components/siana/ResultView.tsx     (transformation majeure du bloc isPaid)
├── src/components/siana/ResultGuard.tsx    (support persistance orderId)
├── src/stores/useGenerationStore.ts       (ajout orderId, isPaid)
└── src/lib/api/orders.ts                  (ajout getOrderBySession + types)

Backend — Modifier :
siana-memento-api/
├── app/controllers/orders_controller.ts   (enrichir show + ajouter showBySession)
└── start/routes.ts                        (ajouter route by-session)

Backend — Créer :
siana-memento-api/
└── tests/functional/orders/confirmation.spec.ts
```

### Previous Story Intelligence (4-2)

**Learnings de la story 4-2 :**
- `email_service.ts` utilise `design.cloudinaryPublicId` pour l'image HR — ce champ contient l'original. NE PAS l'exposer côté API.
- `order.emailSentAt` existe et peut être utilisé comme indicateur que l'email a été envoyé (pour afficher "email envoyé" dans la confirmation)
- Pattern fonctions exportées dans les services — pas de classes
- `handleCheckoutCompleted` dans `stripe_service.ts` gère la logique ACID + email — la confirmation page n'a besoin que de lire le résultat
- Le modèle `Order` a : `id`, `userId`, `designId`, `stripeSessionId`, `stripePaymentIntentId`, `amount`, `status`, `paidAt`, `emailSentAt`, `createdAt`, `updatedAt`
- `Design` model a : `templateName`, `partner1Name`, `partner2Name`, `weddingDate`, `cloudinaryPublicId`, `cloudinaryPreviewId`
- 115 tests passent en suite complète — ne pas casser de régressions

### Git Intelligence

Derniers commits pertinents :
- `fdad52f` fix: sessionToken security — vérification atomique + cleanup logout
- `f87d2ae` feat(S4-2): delivery email avec fichier HR via Resend
- `c9ba59c` feat(S4-1): checkout Stripe avec webhook idempotent et bouton Commander

Patterns établis : commits conventionnels en anglais, préfixe `feat(S4-X):` pour les stories de l'epic 4.

### Points d'attention

1. **Pas d'image HR dans l'API** : `cloudinaryPublicId` = image originale sans watermark. La page de confirmation utilise l'image du store Zustand (déjà watermarquée) ou `cloudinaryPreviewId` pour le reload.
2. **Race condition webhook** : Le paiement peut être confirmé par le webhook APRÈS le retour Stripe sur la page. L'API `GET /api/orders/by-session/:sessionId` peut retourner `status: 'pending'` brièvement. Gérer ce cas avec un retry court (1-2 tentatives après 2s) ou un message "paiement en cours de confirmation".
3. **Store cleanup** : Après paiement confirmé, le store doit conserver `designId`, `orderId`, `isPaid`, mais les champs de configuration (template, photos) peuvent rester — ils seront nettoyés quand l'utilisateur lance une nouvelle génération.
4. **Accessibilité** : Le récapitulatif de commande doit être structuré en `<dl>` ou tableau accessible. Le message de support doit contenir un `<a href="mailto:...">`.

### Références

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.3] — User story + ACs originaux
- [Source: _bmad-output/planning-artifacts/prd.md#FR26] — Confirmation transaction après paiement réussi
- [Source: _bmad-output/planning-artifacts/prd.md#FR49] — Email support visible
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Wow-2] — "Moment de Possession" / Accomplissement & Fierté
- [Source: _bmad-output/planning-artifacts/architecture.md#4.4] — Page components, Server/Client split
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Response-Format] — Pattern { success, data }
- [Source: siana-memento-web/src/components/siana/ResultView.tsx:258-261] — Bandeau isPaid actuel à remplacer
- [Source: siana-memento-web/src/components/siana/ResultGuard.tsx] — Guard à modifier pour persistance
- [Source: siana-memento-web/src/stores/useGenerationStore.ts] — Store Zustand à enrichir
- [Source: siana-memento-web/src/lib/api/orders.ts] — Client API orders (getOrder existe, getOrderBySession à créer)
- [Source: siana-memento-api/app/controllers/orders_controller.ts] — Controller à enrichir
- [Source: siana-memento-api/app/models/order.ts] — Order model (stripeSessionId disponible)
- [Source: siana-memento-api/app/models/design.ts] — Design model (cloudinaryPreviewId pour la confirmation)
- [Source: _bmad-output/implementation-artifacts/4-2-delivery-email-avec-fichier-haute-resolution.md] — Story 4-2, patterns + learnings
- [Source: _bmad-output/implementation-artifacts/4-1-checkout-stripe.md] — Story 4-1, flow Stripe

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

- Le modèle Design n'a pas de champ `cloudinaryPreviewId` ni `templateName` — les vrais champs sont `previewUrl` et `template`. Corrigé dans l'implémentation.
- Route `by-session/:sessionId` placée AVANT `/:id` dans routes.ts pour éviter qu'AdonisJS matche `by-session` comme un `:id` numérique.
- Race condition webhook gérée avec un retry unique après 3s si `status === 'pending'` au retour Stripe.
- [Review fix] `generatedImageUrl` pouvait être null au reload → ajout de `displayImageUrl` avec fallback `orderData.design.previewUrl`
- [Review fix] `orderData` n'était pas rechargé au mount sans `?session_id` → ajout useEffect `getOrder(orderId)`
- [Review fix] `handleOrder`/`handleAuthSuccess` pouvaient relancer une commande déjà payée → guard `isPaid`

### Completion Notes List

- Task 1 : `serializeOrderWithDesign()` helper — sérialise order + design (template, partner names, weddingDate, previewUrl) sans exposer cloudinaryPublicId
- Task 2 : `showBySession` dans OrdersController — lookup par stripeSessionId + ownership check + même sérialisation
- Task 3 : Vérification API dans ResultView — appel `getOrderBySession` au lieu de trust aveugle sur `?session_id`, retry 3s pour race condition webhook
- Task 4 : Bloc de confirmation riche — mascotte, message célébration, récap commande en `<dl>`, email support mailto
- Task 5 : Store Zustand enrichi — `orderId`, `isPaid`, `setPaid()`, persistance localStorage, ResultGuard adapté
- Task 6 : `getOrderBySession` + types `OrderData`/`OrderDesign` dans lib/api/orders.ts
- Task 7 : 6 tests fonctionnels — enriched response, sécurité cloudinaryPublicId, by-session (auth, 403, 404). 126/126 full suite.

### Change Log

- feat(S4-3): serializeOrderWithDesign + enriched GET /api/orders/:id response
- feat(S4-3): GET /api/orders/by-session/:sessionId endpoint
- feat(S4-3): ResultView confirmation block with order recap and support email
- feat(S4-3): API verification of payment instead of trusting query param
- feat(S4-3): Zustand store isPaid/orderId persistence + ResultGuard adaptation
- feat(S4-3): getOrderBySession frontend API client + OrderData types
- test(S4-3): 6 tests confirmation.spec.ts — enriched response, security, by-session

### File List

**Backend — Modifiés :**
- `siana-memento-api/app/controllers/orders_controller.ts`
- `siana-memento-api/start/routes.ts`

**Backend — Créés :**
- `siana-memento-api/tests/functional/orders/confirmation.spec.ts`

**Frontend — Modifiés :**
- `siana-memento-web/src/components/siana/ResultView.tsx`
- `siana-memento-web/src/components/siana/ResultGuard.tsx`
- `siana-memento-web/src/stores/useGenerationStore.ts`
- `siana-memento-web/src/lib/api/orders.ts`

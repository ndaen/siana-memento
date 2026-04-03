---
title: 'Fix sessionToken security — cleanup logout + claim verification'
slug: 'fix-session-token-security'
created: '2026-04-03'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React 19 / Next.js 16', 'Zustand 5 persist', 'AdonisJS 6', 'VineJS validators', '@japa/runner']
files_to_modify: ['siana-memento-web/src/components/siana/LogoutButton.tsx', 'siana-memento-web/src/lib/api/orders.ts', 'siana-memento-web/src/components/siana/ResultView.tsx', 'siana-memento-api/app/controllers/orders_controller.ts', 'siana-memento-api/app/validators/order_validator.ts', 'siana-memento-api/tests/functional/orders/create_order.spec.ts']
code_patterns: ['Zustand persist store reset()', 'vine.string().fixedLength(64).optional()', 'atomic UPDATE with snake_case DB columns']
test_patterns: ['@japa/runner functional tests', 'testUtils.db().withGlobalTransaction()', 'loginAs() helper + createDesignForUser()']
---

# Tech-Spec: Fix sessionToken security — cleanup logout + claim verification

**Created:** 2026-04-03

## Overview

### Problem Statement

Deux failles de sécurité liées au `sessionToken` :

1. **Claim sans vérification** — `OrdersController.store()` permet à n'importe quel utilisateur authentifié de s'approprier un design anonyme (`userId === null`) sans vérifier le `sessionToken`. Il suffit de connaître le `designId`.

2. **Persistance après logout** — La déconnexion ne vide pas le store Zustand (localStorage). Le `sessionToken` et `designId` du précédent utilisateur restent accessibles au prochain utilisateur qui se connecte sur le même navigateur.

### Solution

1. **Backend** : Exiger le `sessionToken` dans le body du `POST /api/orders` et le comparer avec `design.sessionToken` avant de claim un design anonyme. Utiliser une requête atomique pour éviter les race conditions.

2. **Frontend** : Appeler `useGenerationStore.getState().reset()` dans le flow de logout pour vider le localStorage.

### Scope

**In Scope:**
- Vérification du `sessionToken` dans `OrdersController.store()` pour le claim anon→auth
- Claim atomique pour éviter les race conditions
- Cleanup du store Zustand au logout (sessionToken + designId + tout le state de génération)
- Tests fonctionnels pour vérifier les deux correctifs

**Out of Scope:**
- Migration du sessionToken de query params vers body/header dans les autres endpoints (DesignsController — même faille, voir Notes)
- Expiration du sessionToken côté serveur
- Chiffrement ou signature du sessionToken

## Context for Development

### Codebase Patterns

- **Zustand store** : `useGenerationStore` dans `siana-memento-web/src/stores/useGenerationStore.ts` — persist middleware avec localStorage key `siana-generation-store`
- **Logout** : `LogoutButton.tsx` appelle `logoutUser()` de `auth.ts`, puis `router.push('/login')`
- **Ownership check backend** : pattern if/else sur `design.userId` vs `auth.user.id`, fallback sur `sessionToken` pour anonyme
- **Validator** : `createOrderValidator` dans `app/validators/order_validator.ts` — vine schema
- **Lucid ORM** : les méthodes `.where()`, `.whereNull()`, `.update()` prennent des **noms de colonnes DB snake_case** (`user_id`, `session_token`), PAS les noms de propriétés camelCase du modèle
- **PostgreSQL** : `.update()` de Knex/Lucid retourne un `number` (rowCount), PAS un array

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `siana-memento-web/src/components/siana/LogoutButton.tsx` | Composant déconnexion — ajouter cleanup store |
| `siana-memento-web/src/stores/useGenerationStore.ts` | Store Zustand — `reset()` existe déjà (ligne 91) |
| `siana-memento-api/app/controllers/orders_controller.ts` | Controller orders — corriger claim anon→auth (lignes 26-36) |
| `siana-memento-api/app/validators/order_validator.ts` | Validator — ajouter sessionToken optionnel |
| `siana-memento-api/tests/functional/orders/create_order.spec.ts` | Tests existants — patron loginAs + createDesignForUser |
| `siana-memento-web/src/lib/api/orders.ts` | API client — passer sessionToken dans le body |
| `siana-memento-web/src/components/siana/ResultView.tsx` | Appel createOrder (lignes 94 ET 110) — passer sessionToken |

### Technical Decisions

- Le `sessionToken` est ajouté comme champ **optionnel** dans le body de `POST /api/orders` — il n'est requis QUE quand le design est anonyme (`userId === null`)
- Côté frontend, on passe toujours le `sessionToken` du store s'il existe — pas de logique conditionnelle complexe
- Le reset du store se fait APRÈS la confirmation du logout API (pas avant) pour éviter de perdre l'état si le logout échoue
- **Claim atomique** : `UPDATE designs SET user_id = ? WHERE id = ? AND user_id IS NULL AND session_token = ?` — si rowCount === 0 → 403. Évite la race condition read-then-write.
- **Colonnes DB snake_case** : Lucid `.where()` et `.update()` utilisent les noms de colonnes PostgreSQL (`user_id`, `session_token`), pas les noms de propriétés du modèle (`userId`, `sessionToken`)
- **sessionToken = 64 caractères hex** : généré par `randomBytes(32).toString('hex')` dans `designs_controller.ts`. Le validator contraint à exactement 64 caractères + regex hex-only.

### Anchor Points identifiés

| Lieu | Fichier:Ligne | Ce qui existe | Ce qui doit changer |
|------|---------------|---------------|---------------------|
| Destructuring | `orders_controller.ts:14` | `const { designId } = await request.validateUsing(...)` | Ajouter `sessionToken` au destructuring |
| Claim anon | `orders_controller.ts:26-36` | `if (design.userId === null)` → claim sans vérif | SUPPRIMER lignes 27-30, remplacer par guard + UPDATE atomique |
| Outer if | `orders_controller.ts:26,31-36` | Structure if/else ownership check | PRÉSERVER — ne modifier que le bloc intérieur (27-30) |
| Validator | `order_validator.ts:3-7` | `{ designId: vine.number() }` | Ajouter `sessionToken` optionnel avec regex hex |
| API client | `orders.ts:13` | `body: JSON.stringify({ designId })` | Ajouter `sessionToken` dans le body |
| Appel frontend | `ResultView.tsx:94,110` | `createOrder(designId)` | `createOrder(designId, sessionToken)` — deux appels à modifier |
| Logout | `LogoutButton.tsx:20-21` | `router.push('/login')` | Ajouter `useGenerationStore.getState().reset()` avant redirect |
| Store reset | `useGenerationStore.ts:91` | `reset()` existe déjà | Aucun changement nécessaire |

## Implementation Plan

### Tasks

- [x] Task 1: Ajouter `sessionToken` au validator backend
  - File: `siana-memento-api/app/validators/order_validator.ts`
  - Action: Ajouter `sessionToken: vine.string().fixedLength(64).regex(/^[a-f0-9]{64}$/).optional()` dans le schema
  - Notes: Optionnel — requis uniquement pour claim de designs anonymes. Regex hex-only pour validation stricte (le token est généré par `randomBytes(32).toString('hex')` → toujours 64 hex chars).

- [x] Task 2: Claim atomique avec vérification sessionToken
  - File: `siana-memento-api/app/controllers/orders_controller.ts`
  - Action: Modifier le bloc ownership check (lignes 26-36) comme suit :
    1. **Ligne 14** : modifier le destructuring de `const { designId }` en `const { designId, sessionToken }`
    2. **Lignes 27-30** : SUPPRIMER entièrement le bloc `if (design.userId === null) { design.userId = user.id; await design.save() }`
    3. À la place, insérer ce code dans le bloc `if (design.userId === null)` :
    ```typescript
    // Guard explicite : sessionToken requis pour claim un design anonyme
    if (!sessionToken) {
      return response.forbidden({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Token de session requis pour ce design.' },
      })
    }
    // Claim atomique — évite race condition (UPDATE WHERE conditions)
    const affected = await Design.query()
      .where('id', design.id)
      .whereNull('user_id')
      .where('session_token', sessionToken)
      .update({ user_id: user.id })
    if (affected === 0) {
      return response.forbidden({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Token de session invalide.' },
      })
    }
    await design.refresh()
    ```
    4. **Lignes 31-36** : PRÉSERVER le `else { return response.forbidden(...) }` tel quel — c'est le cas "design appartient à un autre user"
  - Notes:
    - `.where()` et `.whereNull()` utilisent les **noms de colonnes DB snake_case** : `user_id`, `session_token` (PAS `userId`, `sessionToken`)
    - `.update()` retourne un **number** (rowCount) en PostgreSQL, PAS un array — vérifier `affected === 0` (pas `affected[0]`)
    - Guard `if (!sessionToken)` avant le query pour éviter le comportement imprévisible de Knex avec `undefined`
    - `design.refresh()` recharge le modèle depuis la DB après l'UPDATE atomique

- [x] Task 3: Tests fonctionnels backend — claim avec/sans sessionToken
  - File: `siana-memento-api/tests/functional/orders/create_order.spec.ts`
  - Action: Ajouter 5 tests :
    1. Design anonyme + bon sessionToken → 201 (claim réussi, design.userId mis à jour) (AC1)
    2. Design anonyme + mauvais sessionToken → 403, design.userId reste null (AC2)
    3. Design anonyme + sans sessionToken → 403 (AC3)
    4. Design anonyme + sessionToken d'un AUTRE design anonyme → 403 (le sessionToken est valide mais ne correspond pas à CE design)
    5. Design owned par le user + sans sessionToken → 201 (AC4 — le sessionToken n'est PAS vérifié quand le design a déjà un userId)
  - Notes: Créer les designs anonymes avec `userId: null` et un `sessionToken` connu (ex: `'a'.repeat(64)`). Utiliser le patron `loginAs()` existant. Pour le test 4, créer un 2e design anonyme avec un sessionToken différent (ex: `'b'.repeat(64)`).

- [x] Task 4: Passer le sessionToken dans l'API client frontend
  - File: `siana-memento-web/src/lib/api/orders.ts`
  - Action: Modifier la signature de `createOrder` pour accepter `sessionToken?: string | null`. Construire le body avec spread conditionnel : `{ designId, ...(sessionToken ? { sessionToken } : {}) }`.
  - Notes: `null` et `undefined` ne sont pas envoyés dans le body.

- [x] Task 5: Passer le sessionToken depuis ResultView
  - File: `siana-memento-web/src/components/siana/ResultView.tsx`
  - Action: Aux lignes 94 et 110 (deux appels — `handleOrder` et `handleAuthSuccess`), remplacer `createOrder(designId)` par `createOrder(designId, sessionToken)` en récupérant `sessionToken` depuis `useGenerationStore`.
  - Notes: `sessionToken` est déjà extrait du store dans d'autres composants (ConfigForm, TemplateSelector). S'assurer que les **deux** appels sont modifiés.

- [x] Task 6: Cleanup du store Zustand au logout
  - File: `siana-memento-web/src/components/siana/LogoutButton.tsx`
  - Action: Après `logoutUser()` réussi (ligne 20), ajouter `useGenerationStore.getState().reset()` AVANT `router.push('/login')`.
  - Notes: Import `useGenerationStore` depuis `@/stores/useGenerationStore`. Utiliser `getState()` (pas le hook) car on est dans un handler async, pas dans le render. Le flush localStorage est synchrone — pas de timing issue.

- [x] Task 7: Vérification complète — tests existants + nouveaux
  - Action: `npx tsc --noEmit` (zéro erreur) + `node ace test` (full suite, zéro régression)

### Acceptance Criteria

- [x] AC 1: Given un utilisateur authentifié qui crée un order pour un design anonyme avec le bon sessionToken, when POST /api/orders, then le design est claim pour cet utilisateur et l'order est créé (201).

- [x] AC 2: Given un utilisateur authentifié qui crée un order pour un design anonyme avec un mauvais sessionToken, when POST /api/orders, then 403 FORBIDDEN est retourné et le design n'est PAS claim (userId reste null).

- [x] AC 3: Given un utilisateur authentifié qui crée un order pour un design anonyme sans sessionToken dans le body, when POST /api/orders, then 403 FORBIDDEN est retourné.

- [x] AC 4: Given un utilisateur authentifié qui crée un order pour son propre design (userId match), when POST /api/orders sans sessionToken, then l'order est créé normalement (pas besoin de sessionToken).

- [x] AC 5: Given un utilisateur connecté qui se déconnecte, when il clique "Se déconnecter", then le localStorage `siana-generation-store` est vidé (sessionToken, designId, photos, etc. reset).

- [x] AC 6: Given un deuxième utilisateur qui se connecte sur le même navigateur après un logout, when il accède à l'app, then il ne voit aucun design du précédent utilisateur.

## Additional Context

### Dependencies

- Aucune nouvelle dépendance npm
- Dépend de la story 4-1 (OrdersController existant)

### Testing Strategy

- **Tests fonctionnels backend** : 5 nouveaux tests dans `create_order.spec.ts` couvrant les 4 AC backend + scénario cross-design sessionToken
- **Vérification existante** : les 115+ tests existants doivent continuer à passer — le sessionToken est optionnel et n'est vérifié que pour les designs anonymes (`userId === null`)
- **Test manuel frontend** : déconnexion → vérifier que localStorage est vidé → reconnexion avec autre compte → vérifier absence de design précédent
- **Pas de test de concurrence** : le claim atomique (UPDATE WHERE) est garanti par PostgreSQL au niveau SQL — un test de concurrence serait un nice-to-have mais n'est pas nécessaire pour valider le fix

### Notes

- **Race condition résolue** : l'UPDATE atomique avec `WHERE user_id IS NULL AND session_token = ?` empêche le double-claim en cas de requêtes concurrentes — garanti par PostgreSQL
- **DesignsController** : les endpoints `updateTemplate`, `updateConfigure`, `generate`, `status` ont le même pattern de vérification sessionToken via query params — même faille potentielle. **À traiter en priorité dans un prochain quick spec** car un attaquant pourrait modifier le contenu d'un design anonyme avant que le propriétaire légitime ne paie.
- Les tests existants de `create_order.spec.ts` créent des designs avec `userId = user.id` — ils ne seront PAS affectés par ce changement car le sessionToken n'est vérifié que pour les designs anonymes (`userId === null`)

### Adversarial Review Findings Addressed

| ID | Severity | Fix appliqué |
|----|----------|-------------|
| F1 | Critical | Corrigé : colonnes snake_case (`user_id`, `session_token`) dans les `.where()` et `.update()` |
| F2 | High | Corrigé : `affected === 0` (number), pas `affected[0]` |
| F6 | High | Corrigé : guard explicite `if (!sessionToken)` avant le query |
| F7 | High | Corrigé : instructions explicites sur lignes à SUPPRIMER vs PRÉSERVER |
| F4 | Medium | Corrigé : destructuring `{ designId, sessionToken }` explicité à la ligne 14 |
| F3 | Medium | Corrigé : instruction explicite "SUPPRIMER lignes 27-30" |
| F8 | Medium | Noté : test de concurrence non nécessaire, garanti par PostgreSQL |
| F11 | Medium | Noté : DesignsController à traiter en priorité dans un prochain quick spec |
| F9 | Low | Corrigé : documenté que sessionToken = 64 hex chars (`randomBytes(32).toString('hex')`) |
| F12 | Low | Corrigé : ajout `.regex(/^[a-f0-9]{64}$/)` dans le validator |

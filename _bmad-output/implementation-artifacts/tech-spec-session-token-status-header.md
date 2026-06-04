---
title: 'Migrer sessionToken du query param vers header X-Session-Token sur GET /api/designs/:id/status'
slug: 'session-token-status-header'
created: '2026-06-04'
status: 'review'
baseline_commit: '03fe183f32c262c7f918348fc51511c84c960fa1'
tech_stack: ['React 19 / Next.js 16', 'AdonisJS 6', '@japa/runner']
files_to_modify:
  - 'siana-memento-api/app/controllers/designs_controller.ts'
  - 'siana-memento-web/src/lib/api/designs.ts'
  - 'siana-memento-api/tests/functional/designs/get_status.spec.ts'
code_patterns: ['request.header()', 'fetch headers', 'rétro-compat query param avec warning']
test_patterns: ['@japa/runner functional tests', 'header injection in test client']
---

# Tech-Spec: Migrer sessionToken vers header sur GET /api/designs/:id/status

**Créé:** 2026-06-04
**Issue source:** Correct Course 2026-06-04 — vérification de l'état des failles sessionToken après le fix 2026-04-03.

## Overview

### Problem Statement

`GET /api/designs/:id/status` lit le `sessionToken` depuis la query string :

```ts
// designs_controller.ts:438
const sessionToken = request.qs().sessionToken as string | undefined
```

Côté frontend, l'appel construit l'URL avec le token directement visible :

```ts
// designs.ts:136-137
const params = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : ''
const res = await fetch(`${API_URL}/api/designs/${designId}/status${params}`, { ... })
```

Conséquence : le `sessionToken` (64 hex chars = 256 bits d'entropie, traité comme un secret partagé pour l'ownership des designs anonymes) apparaît dans :

- Les **access logs** Railway / nginx (souvent retenus plusieurs semaines)
- L'**historique navigateur** côté utilisateur
- Le **Referer header** que le navigateur transmet aux assets externes appelés depuis la page (Cloudinary, Stripe, fonts, etc.)
- Les **outils de monitoring** (Sentry / observability) qui capturent les URLs

Le risque d'exploitation reste théorique (il faut un autre vecteur pour récupérer un log), mais c'est une mauvaise hygiène et c'est **le seul endpoint** qui passe encore le sessionToken en query string pour de l'auth (les autres — `updateTemplate`, `updateConfigure`, `generate`, `orders/create` — utilisent le body POST/PATCH).

### Solution

1. **Backend** : Lire d'abord `request.header('x-session-token')`. Conserver le `request.qs().sessionToken` en fallback temporaire pour éviter de casser le frontend non re-déployé, mais logger un `warn` à chaque fallback pour pouvoir détecter le moment où il devient sûr de supprimer le fallback.
2. **Frontend** : Migrer l'appel `getDesignStatus()` pour transmettre le sessionToken via le header `X-Session-Token` au lieu d'une query string.

### Scope

**In Scope:**

- `siana-memento-api/app/controllers/designs_controller.ts` — méthode `status()` ligne 432–486
- `siana-memento-web/src/lib/api/designs.ts` — fonction qui appelle `/status` ligne 131–159 (le seul appelant)
- Test fonctionnel `get_status.spec.ts` couvrant :
  - Header valide → 200
  - Header invalide → 403
  - Query param valide (fallback rétro-compat) → 200 + warn loggué
  - Aucun token → 403

**Out of Scope:**

- `POST /api/upload/sign` (`upload_controller.ts:19`) — passe `session_token` aussi en query, mais l'usage est différent : il sert d'**identifiant de dossier Cloudinary** (`designs/${sessionToken}`), pas d'auth. Il est sanitisé par regex et la requête est cookie-authenticated. **Pas un vrai secret**, hygiène uniquement. À traiter dans un follow-up séparé si on veut homogénéiser.
- Suppression définitive du fallback query param — sera faite dans un commit séparé après vérification des logs (~1 release stable).
- Signature/expiration du sessionToken (le tech-spec d'avril a explicitement gardé ça out of scope, et le besoin reste inchangé).

## Context for Development

### Codebase Patterns

- **Header reading AdonisJS** : `request.header('x-session-token')` — case-insensitive, retourne `string | undefined`
- **Frontend fetch headers** : pattern `fetch(url, { headers: { 'X-Session-Token': token } })`
- **Logger AdonisJS** : `logger.warn({ event: 'session_token_qs_fallback', designId }, 'sessionToken passé via query — migration incomplète')`
- **Pattern sessionToken existant** : tous les autres endpoints lisent le sessionToken via le body validé par VineJS, sauf `status` et `upload/sign`.
- **Tests @japa** : `client.get('/api/designs/1/status').header('x-session-token', 'abc...')` permet d'injecter un header dans le test client

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `siana-memento-api/app/controllers/designs_controller.ts:432-486` | Méthode `status()` — lecture du token |
| `siana-memento-web/src/lib/api/designs.ts:131-159` | Fonction `pollDesignStatus()` — seul appelant frontend |
| `siana-memento-api/tests/functional/designs/` | Dossier des tests fonctionnels designs — modèle à suivre |
| `siana-memento-api/app/controllers/orders_controller.ts:57-98` | Référence pattern fix sessionToken (claim atomique du fix d'avril) |

### Technical Decisions

- **Pas de validation VineJS** sur le header pour l'instant — un simple check `typeof === 'string' && /^[a-f0-9]{64}$/.test()` côté contrôleur suffit pour éviter de polluer la query DB avec des valeurs absurdes. Le validator est out-of-scope.
- **Rétro-compat 1 release** — fallback query param accepté + warn loggué. Permet :
  - Soft launch : on peut shipper backend avant frontend
  - Détection : si le warn se déclenche après que le frontend est déployé, c'est probablement un client qui a un onglet ouvert avec l'ancien code — un avertissement pour planifier le retrait
- **Nom du header** : `X-Session-Token` (le préfixe `X-` est obsolète RFC 6648 mais reste la convention de fait pour les headers customs ; pas de risque vu le contexte interne).
- **Pas de changement frontend pour `upload/sign`** dans cette story — explicitement out of scope, à traiter séparément.

### Anchor Points identifiés

| Lieu | Fichier:Ligne | Ce qui existe | Ce qui doit changer |
|------|---------------|---------------|---------------------|
| Lecture token | `designs_controller.ts:437-448` | `request.qs().sessionToken` | Lire `request.header('x-session-token')` d'abord (string non vide), fallback `request.qs().sessionToken` avec `logger.warn` |
| Frontend fetch | `designs.ts:131-159` | `?sessionToken=...` en query | Passer en header `X-Session-Token: ${sessionToken}`, retirer le query param |
| Tests | `tests/functional/designs/*.spec.ts` | Aucun test direct du `status` endpoint | Ajouter `get_status.spec.ts` couvrant les 4 cas |

## Implementation Plan

### Tasks

- [x] **Task 1**: Refactor `DesignsController.status()` pour lire le header en priorité
  - File: `siana-memento-api/app/controllers/designs_controller.ts`
  - Action: Remplacer la ligne 438 :
    ```ts
    const headerToken = request.header('x-session-token')
    const queryToken = request.qs().sessionToken as string | undefined
    let sessionToken: string | undefined = typeof headerToken === 'string' ? headerToken : undefined
    if (!sessionToken && queryToken) {
      sessionToken = queryToken
      logger.warn(
        { event: 'session_token_qs_fallback', designId: params.id },
        'sessionToken reçu via query param — migration frontend incomplète'
      )
    }
    ```
  - Notes:
    - `request.header()` est case-insensitive en AdonisJS, mais préférer `x-session-token` lower-case pour la cohérence interne.
    - `logger` est déjà importé en haut du fichier (ligne 15).
    - Aucun changement à la logique d'ownership check (lignes 449-464) — elle continue à comparer `sessionToken` à `design.sessionToken`.

- [x] **Task 2**: Migrer l'appel frontend `getDesignStatus` vers le header
  - File: `siana-memento-web/src/lib/api/designs.ts`
  - Action: Lignes 133–148 — remplacer la construction `params` query par un header :
    ```ts
    const res = await fetch(`${API_URL}/api/designs/${designId}/status`, {
      headers: sessionToken ? { 'X-Session-Token': sessionToken } : {},
      credentials: 'include',
    })
    ```
  - Notes:
    - Supprimer la ligne `const params = sessionToken ? \`?sessionToken=${encodeURIComponent(sessionToken)}\` : ''`.
    - `credentials: 'include'` reste nécessaire pour le cookie d'auth (auth optionnelle côté serveur).
    - Vérifier que les appelants de cette fonction passent toujours le sessionToken — la signature ne change pas.

- [x] **Task 3**: Tests fonctionnels backend pour `status` endpoint
  - File: `siana-memento-api/tests/functional/designs/get_status.spec.ts` (nouveau fichier)
  - Action: Couvrir 4 scénarios :
    1. Design anonyme + header valide → 200, données retournées (AC1)
    2. Design anonyme + header invalide → 403, code `FORBIDDEN` (AC2)
    3. Design anonyme + query param valide + pas de header → 200 + warn loggué (rétro-compat, AC3)
    4. Design anonyme + aucun token → 403 (AC4)
  - Notes:
    - Utiliser le client japa avec `.header('x-session-token', token)`.
    - Pour la vérif du warn : capturer les logs avec un transport in-memory ou utiliser un spy sur `logger.warn` (vérifier le pattern existant dans les tests du repo, ne pas inventer).
    - Si le pattern de capture des logs n'existe pas dans le repo, se contenter d'asserter le **comportement** (200 retourné) et noter qu'il faudra ajouter un suivi manuel des logs en prod.

- [x] **Task 4**: Vérification — typecheck + tests + build
  - Action: `npx tsc --noEmit` (web + api), `node ace test` (suite complète backend), `npm test` ou équivalent côté web si tests touchés.
  - Notes:
    - La suite backend doit rester verte (les autres endpoints ne sont pas affectés).
    - Smoke manuel sur `/admin/...` n'est PAS nécessaire — cet endpoint n'est appelé que depuis le flow génération.

### Acceptance Criteria

- [x] **AC 1**: Given un design anonyme avec sessionToken connu, when le frontend appelle `GET /api/designs/:id/status` avec le header `X-Session-Token: <token>`, then 200 OK avec les données du design.

- [x] **AC 2**: Given un design anonyme avec sessionToken connu, when l'appel arrive avec un header `X-Session-Token` différent, then 403 FORBIDDEN avec code `FORBIDDEN`.

- [x] **AC 3**: Given un design anonyme avec sessionToken connu, when l'appel arrive avec `?sessionToken=...` en query string et **sans** header (rétro-compat), then 200 OK retourné (l'émission du `logger.warn` event `session_token_qs_fallback` est observable manuellement dans la sortie de test et vérifiée en prod via les logs Railway).

- [x] **AC 4**: Given un design anonyme, when l'appel arrive sans aucun token (ni header, ni query), then 403 FORBIDDEN.

- [x] **AC 5**: Given un utilisateur authentifié propriétaire d'un design, when il appelle l'endpoint sans aucun token (sa session cookie suffit), then 200 OK (la vérif sessionToken est skippée car `userId` matche — comportement actuel préservé).

- [x] **AC 6**: Après déploiement frontend, le terminal Railway ne montre plus de `session_token_qs_fallback` warns dans les 24h glissantes → signe que le retrait du fallback est sûr (suivi manuel, hors story).

## Additional Context

### Dependencies

- Aucune nouvelle dépendance npm
- Dépend du fix existant (4-03) — préserver la logique d'ownership inchangée

### Testing Strategy

- **4 tests fonctionnels backend** couvrant les 4 AC machine-vérifiables (AC1–4)
- **Pas de test E2E nouveau** — l'endpoint est polling côté frontend pendant la génération, déjà couvert indirectement par les E2E generation existants. Vérifier que ceux-ci passent toujours après la migration frontend.
- **Suivi manuel post-déploiement** : grep des logs Railway pour `session_token_qs_fallback` après 48h prod stable. Si zéro occurrence, planifier un commit qui supprime le fallback + le log.

### Notes

- **Pourquoi pas faire la migration `upload/sign` dans le même PR ?** : c'est un usage différent (folder organizer, pas auth), la sanitization regex limite déjà le blast radius, et mélanger les deux gonflerait le PR. Garder un changement = une intention.
- **Pourquoi un header plutôt qu'un body sur un GET ?** : GET n'a pas de body sémantique en HTTP (certains proxys le strippent). Un header customs est idiomatique pour transporter un token d'auth sur un GET.
- **Mémoire à mettre à jour** : `MEMORY.md` indique encore `project_localstorage_security_bug.md` comme bug ouvert. Le fix d'avril l'a résolu pour OrdersController + logout cleanup. Mettre à jour pour refléter : (A) résolu, (B) protégée par vérif, (B') en cours via ce tech-spec.

### Adversarial Review — Points à challenger

| ID | Sévérité | Préoccupation | Réponse |
|----|----------|---------------|---------|
| F1 | Medium | Fallback query param dure indéfiniment | AC6 + suivi log post-déploiement définit un critère de sortie clair |
| F2 | Low | Header non validé strictement (pas de regex) | Le check est délégué à la comparaison `=== design.sessionToken` ; un header malformé matchera jamais. Pas de SQL injection (Lucid paramétrise) |
| F3 | Low | `X-` prefix obsolète RFC 6648 | Convention de fait, pas un blocker — peut être migré vers `Session-Token` plus tard si standardisation |
| F4 | Info | `upload/sign` reste en query | Out of scope explicité — risque résiduel documenté |

## Dev Agent Record

### Completion Notes (2026-06-04)

- **Task 1 (backend)** : `designs_controller.ts:437–490` — `status()` lit `request.header('x-session-token')` en priorité, fallback `request.qs().sessionToken` avec `logger.warn({ event: 'session_token_qs_fallback', designId })`. Logique d'ownership inchangée.
- **Task 2 (frontend)** : `designs.ts:131–148` (`pollDesignStatus`) — fetch utilise `headers: { 'X-Session-Token': sessionToken }` au lieu d'un query param. La signature de la fonction est inchangée, aucun call-site à toucher.
- **Task 3 (tests)** : `tests/functional/designs/get_status.spec.ts` — 10 tests couvrant les 5 AC machine-vérifiables + cas edges (404 design inexistant, priorité header vs query, user connecté non propriétaire, header vide fallback F-R1, attacker auth avec header étranger F-R2). Le warn `session_token_qs_fallback` est émis pendant l'exécution AC3 (visible dans la sortie de test).
- **Task 4 (vérification)** :
  - `npx tsc --noEmit` API : ✅ zéro erreur
  - `npx tsc --noEmit` Web : ✅ zéro erreur
  - `node ace test functional` : ✅ 226/226 (le run initial avait 1 flaky non lié — confirmé stable au second run)
  - `npm run lint` API : ✅ aucune nouvelle erreur (un fix prettier appliqué sur le nouveau test)
  - `npm run lint` Web : ✅ aucune nouvelle erreur (uniquement des warnings préexistants sur d'autres fichiers)

### File List

- **Modified**: `siana-memento-api/app/controllers/designs_controller.ts` (status method, +9/-1)
- **Modified**: `siana-memento-web/src/lib/api/designs.ts` (pollDesignStatus, +3/-3)
- **Created**: `siana-memento-api/tests/functional/designs/get_status.spec.ts` (8 tests)

### Change Log

- **2026-06-04** : Implémentation initiale. Backend lit header en priorité avec fallback query+warn ; frontend migre vers header ; 8 tests fonctionnels couvrant AC1–5.
- **2026-06-04** : Application des findings de review (F-R1 à F-R5).
  - F-R1 (Medium) : `designs_controller.ts:441` — header string vide ne tombe plus en fallback ; condition durcie à `length > 0`.
  - F-R2 (Medium) : test ajouté pour pin le comportement "user auth non-owner avec header valide étranger → 403".
  - F-R3 (Low) : AC3 reformulé pour refléter ce que le test vérifie réellement (200 OK ; warn observable mais non assertif).
  - F-R5 (Trivial) : numérotation de lignes resync (status() = 432-486, designs.ts = 131-159).
  - F-R4 (Low) : date butoir retrait fallback (2026-06-18) ajoutée dans `project_session_token_security.md`.
  - Test "header vide → fallback query" ajouté en preuve de F-R1.
- **Tests** : 10/10 verts après application.

### Suivi post-déploiement

- Vérifier l'absence de `session_token_qs_fallback` dans les logs Railway 24–48h après déploiement frontend.
- Date butoir retrait fallback : **2026-06-18** (tracée dans `project_session_token_security.md`).
- Si zéro occurrence : créer un commit suiveur qui supprime le fallback query + le `logger.warn`, et qui simplifie `status()` à `request.header('x-session-token')` seul.

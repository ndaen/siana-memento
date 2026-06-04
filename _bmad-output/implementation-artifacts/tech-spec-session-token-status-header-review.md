---
title: 'Review findings — tech-spec sessionToken status header migration'
slug: 'session-token-status-header-review'
created: '2026-06-04'
reviewer: 'Claude (review pass)'
target_spec: 'tech-spec-session-token-status-header.md'
target_commit_baseline: '03fe183f32c262c7f918348fc51511c84c960fa1'
verdict: 'ship-with-minor-fixes'
status: 'resolved'
resolved_at: '2026-06-04'
---

# Review findings — sessionToken → header X-Session-Token

**Verdict :** Spec solide, implémentation conforme. 2 ajustements bloquants légers + 3 améliorations non bloquantes.

## Périmètre vérifié

- `siana-memento-api/app/controllers/designs_controller.ts:432-486` (méthode `status()`)
- `siana-memento-web/src/lib/api/designs.ts:131-159` (`pollDesignStatus`)
- `siana-memento-api/tests/functional/designs/get_status.spec.ts` (8 tests)

## Findings bloquants (à corriger avant merge)

### F-R1 — Header string vide ne tombe pas en fallback query
**Sévérité :** Medium
**Fichier :** `siana-memento-api/app/controllers/designs_controller.ts:440-441`

**Problème :** Le code teste `typeof headerToken === 'string'`. Une string vide `''` est de type string, donc `sessionToken` devient `''` et le fallback `queryToken` n'est jamais tenté. Un client qui envoie `X-Session-Token: ` (header vide) + `?sessionToken=...` (query valide) se prend un 403 silencieux au lieu du fallback documenté.

**Correctif :**
```ts
let sessionToken: string | undefined =
  typeof headerToken === 'string' && headerToken.length > 0 ? headerToken : undefined
```

**Risque sans fix :** Très faible en pratique (clients connus n'envoient pas de header vide), mais sémantique du fallback cassée et debugging plus dur si ça arrive.

---

### F-R2 — Test manquant : user authentifié non-propriétaire **avec** header valide étranger
**Sévérité :** Medium (verrouillage sécuritaire)
**Fichier :** `siana-memento-api/tests/functional/designs/get_status.spec.ts`

**Problème :** Le test ligne 83-98 couvre "user non-owner sans token". Le code (`designs_controller.ts:460-466`) couvre correctement le cas où un user connecté envoie le sessionToken d'un autre design : la branche `userId` rejette en 403 **avant** de regarder le sessionToken. Mais **aucun test ne pin ce comportement** — une future refactor qui inverserait la priorité (vérifier sessionToken avant userId) passerait silencieusement.

**Correctif :** Ajouter un test :
```ts
test('retourne 403 pour user authentifié non-propriétaire même avec header X-Session-Token valide', async ({ client, assert }) => {
  const { cookie: ownerCookie } = await loginAs(client, { email: 'owner@example.com' })
  const { designId, sessionToken } = await createDesignViaApi(client, ownerCookie)

  const { cookie: attackerCookie } = await loginAs(client, { email: 'attacker@example.com' })

  const response = await client
    .get(`/api/designs/${designId}/status`)
    .header('Cookie', attackerCookie)
    .header('X-Session-Token', sessionToken)

  response.assertStatus(403)
  assert.equal(response.body().error.code, 'FORBIDDEN')
})
```

**Risque sans fix :** Régression sécuritaire silencieuse à long terme — la branche d'auth pourrait être inversée sans que la suite ne le détecte.

## Findings non bloquants (nice-to-have)

### F-R3 — AC3 promet plus que le test ne vérifie
**Sévérité :** Low (cohérence documentaire)
**Fichier :** `_bmad-output/implementation-artifacts/tech-spec-session-token-status-header.md` (AC3, ligne 170)

**Problème :** AC3 dit « 200 OK ET un `logger.warn` est émis ». Le test correspondant (`get_status.spec.ts:34-46`) n'asserte que le 200. La spec autorise déjà ce compromis en Task 3 Notes, mais l'AC est écrit en termes plus stricts.

**Correctif :** Reformuler AC3 en :
> *« then 200 OK retourné (l'émission du `logger.warn` est observable manuellement dans la sortie de test et vérifiée en prod via les logs Railway). »*

---

### F-R4 — Suivi post-déploiement (AC6) sans mécanisme
**Sévérité :** Low (process)
**Fichier :** `_bmad-output/implementation-artifacts/tech-spec-session-token-status-header.md` (AC6, ligne 176 + section "Suivi post-déploiement")

**Problème :** Dépend d'une vérif humaine des logs Railway 24-48h post-deploy. Sans date butoir ni ticket de suivi, risque que le fallback dure indéfiniment (F1 reconnu dans l'adversarial review).

**Correctif :** Ajouter dans `MEMORY.md` une entrée datée :
> *« Retrait du fallback `sessionToken` query param prévu après vérification logs Railway — cible : 2026-06-18 (2 semaines post-déploiement). »*

Ou créer un ticket suiveur immédiat dans le backlog.

---

### F-R5 — Drift mineur de numérotation de lignes dans la spec
**Sévérité :** Trivial
**Fichier :** `_bmad-output/implementation-artifacts/tech-spec-session-token-status-header.md` (Task 1, ligne 58 / Anchor Points, ligne 104)

**Problème :** La spec référence `lignes 437-475` pour `status()`. Code actuel : 432-486. Décalage de +10 lignes côté fin de méthode (lié à l'ajout du fallback).

**Correctif :** Resync les références de lignes avant archivage de la spec en `done`.

## Points validés (RAS)

- ✅ Implémentation conforme au plan (Task 1-4 livrées)
- ✅ Logique d'ownership préservée (lignes 458-474)
- ✅ Priorité header > query correctement implémentée
- ✅ `credentials: 'include'` conservé côté frontend (auth cookie optionnelle)
- ✅ Scope respecté (`upload/sign` non touché, signature/expiration out)
- ✅ 226/226 tests backend verts
- ✅ Typecheck API + Web clean
- ✅ MEMORY.md mis à jour (obs 2494)
- ✅ Pas de side-channel entre "design existant + mauvais token" et "aucun token" (les deux → 403 FORBIDDEN)

## Plan d'action recommandé

1. **Avant merge** : appliquer F-R1 (1 ligne) + F-R2 (1 test) → relancer la suite functional.
2. **Avant archivage de la spec** : appliquer F-R3 (reformulation AC3) + F-R5 (resync lignes).
3. **À la prochaine review MEMORY** : appliquer F-R4 (date butoir retrait fallback).

Total effort estimé : ~15 min.

## Resolution (2026-06-04)

Toutes les findings appliquées dans la même session :

- ✅ **F-R1** — `designs_controller.ts:441` durci avec `headerToken.length > 0`. Test de non-régression ajouté ("header vide → fallback query").
- ✅ **F-R2** — Nouveau test "user auth non-owner avec header valide étranger → 403" ajouté à `get_status.spec.ts`.
- ✅ **F-R3** — AC3 reformulé dans la spec : 200 OK assert, warn observable mais non assertif.
- ✅ **F-R4** — Date butoir 2026-06-18 ajoutée dans `project_session_token_security.md` avec procédure de retrait du fallback.
- ✅ **F-R5** — Numérotation de lignes resync (status() = 432-486, designs.ts = 131-159) dans la spec.

**Tests post-fix** : 10/10 verts sur `get_status.spec.ts`.
**Statut spec** : reste `review` jusqu'à validation finale et merge.
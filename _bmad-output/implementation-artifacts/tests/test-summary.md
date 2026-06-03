# Test Automation Summary — Survey de satisfaction (Story 6.8)

**Date :** 2026-06-03 · **Auteur :** QA (workflow `bmad-qa-generate-e2e-tests`) · **Feature :** Survey de satisfaction post-achat (Épic 6, FR48)

Frameworks détectés et réutilisés : **Japa** (`@japa/api-client`, `node ace test`) pour l'API, **Playwright** pour l'E2E web. Aucune nouvelle dépendance.

Objectif de cette passe : la 6.8 était déjà livrée avec des tests ; le rôle QA ici est de **combler les trous de couverture** identifiés, pas de réécrire l'existant.

## Tests générés (ajouts)

### API (Japa)
- [x] `tests/functional/survey/submit.spec.ts` — +4 cas de bornes de validation :
  - note sous la borne basse (`0`) → 422
  - note décimale (`4.5`) → 422 (`withoutDecimals`)
  - `designQuality` hors bornes (`6`) → 422 (le 2ᵉ champ est aussi validé, pas seulement `overallSatisfaction`)
  - bornes valides (`1` et `5`) + `wouldRecommend=false` → 201
- [x] `tests/functional/commands/send_survey.spec.ts` — +1 cas critique non couvert :
  - commande payée il y a **31 jours** (hors fenêtre rétroactive 30 j) → **pas d'envoi** (anti-flood rétroactif au 1ᵉʳ run)

### E2E (Playwright)
- [x] `e2e/survey.spec.ts` — +3 parcours :
  - soumission **sans rien sélectionner** → 3 erreurs inline visibles **et aucune requête POST** (validation client)
  - recommandation **« Non »** → POST avec `wouldRecommend=false` (+ vérif du payload `overall=2`, `quality=3`) puis remerciement
  - **erreur serveur (500)** à la soumission → toast d'échec affiché, **pas** d'état « Merci infiniment »

## Couverture après cette passe

| Couche | Fichier | Tests |
|---|---|---|
| API — soumission/lecture publique | `survey/submit.spec.ts` | 15 |
| API — cron d'envoi | `commands/send_survey.spec.ts` | 8 |
| API — dashboard admin | `admin/survey.spec.ts` | 4 |
| E2E — page publique | `e2e/survey.spec.ts` | 6 |

**ACs FR48 couverts :** AC#1 (cron 24 h + bornage rétroactif), AC#2 (page publique sans auth, soumission, états invalide/déjà-répondu), AC#3 (agrégat dashboard moyennes + distribution, N/A jamais 0), AC#4 (idempotence ×2 + récupérabilité sur échec Resend).

## Résultats d'exécution

- API ciblé (`survey` + `send_survey` + `admin/survey`) : **27 passed**
- API suite complète (`node ace test`) : **231 passed / 0 failed**
- E2E web (`playwright test e2e/survey.spec.ts`) : **6 passed**

## Trous résiduels / next steps (non bloquants)

- **Distribution `designQuality`** : seule la distribution de `overallSatisfaction` est exposée par le dashboard (par conception) ; pas de distribution dédiée au 2ᵉ axe.
- **`recommendRate` exact** : asserté comme nombre (base de test partagée → assertions en deltas) ; pas de valeur exacte vérifiée.
- **Filet anti-race (contrainte UNIQUE → 409)** : couvert au niveau contrat par le test « 2ᵉ soumission → 409 » ; le chemin concurrent réel (catch `23505`) n'est pas reproductible de façon déterministe en test HTTP single-transaction (laissé tel quel pour éviter un test flaky).
- Lancer la suite en CI pour bloquer toute régression future.

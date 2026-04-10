---
title: 'Variantes de palettes par template'
slug: 'palette-variants'
created: '2026-04-09'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['Next.js 15', 'AdonisJS', 'PostgreSQL', 'Gemini API', 'Zustand', 'VineJS']
files_to_modify: ['siana-memento-web/src/lib/templates.ts', 'siana-memento-web/src/components/siana/TemplateSelector.tsx', 'siana-memento-web/src/stores/useGenerationStore.ts', 'siana-memento-web/src/lib/api/designs.ts', 'siana-memento-api/app/services/generation_service.ts', 'siana-memento-api/app/validators/design_validator.ts', 'siana-memento-api/app/controllers/designs_controller.ts', 'siana-memento-api/app/models/design.ts']
code_patterns: ['Templates dupliqués frontend/backend (intentionnel)', 'Validation enum via VineJS', 'Zustand persist middleware', 'Ownership check userId/sessionToken']
test_patterns: ['Tests fonctionnels AdonisJS dans tests/functional/', 'Helpers loginAs() et createDesignViaApi()', 'Transaction isolation par test']
---

# Tech-Spec: Variantes de palettes par template

**Created:** 2026-04-09

## Overview

### Problem Statement

Chaque template (Bohème, Moderne, Classique, Vintage, Minimaliste) ne propose qu'une seule palette de couleurs. Cela limite la personnalisation et réduit les chances que le couple se retrouve dans le résultat généré.

### Solution

Proposer 3 palettes curatées par template (15 au total), sélectionnables dans le TemplateSelector via un sous-sélecteur radio après choix du style. La palette choisie est stockée en DB et injectée dans le prompt Gemini à la place de la palette fixe actuelle.

### Scope

**In Scope:**
- 3 palettes par template (15 total) — données statiques frontend + backend
- Sous-sélecteur radio dans TemplateSelector (apparaît après sélection du style)
- Nouveau champ `palette` en DB + validation backend
- Injection de la palette choisie dans le prompt Gemini

**Out of Scope:**
- Palette custom (couleurs libres par l'utilisateur)
- Preview IA en temps réel selon la palette
- Migration des designs existants (les anciens designs gardent la palette par défaut)

## Context for Development

### Codebase Patterns

- Templates dupliqués frontend/backend (intentionnel — commentaire dans le code, la liste de 5 change rarement)
- Validation par enum VineJS : `vine.enum(['boheme', 'moderne', ...] as const)`
- State Zustand avec `persist` middleware (localStorage clé `siana-generation-store`)
- Ownership check : userId si connecté, sessionToken si anonyme
- API client : fonctions async qui retournent `{ success: true, ... } | { success: false, message, errorCode? }`

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `siana-memento-web/src/lib/templates.ts` | Définition templates + types `TemplateId`, `TemplateConfig` |
| `siana-memento-web/src/components/siana/TemplateSelector.tsx` | UI sélection template (cards + bouton continuer) |
| `siana-memento-web/src/stores/useGenerationStore.ts` | Store Zustand — `selectedTemplate`, `setTemplate()` |
| `siana-memento-web/src/lib/api/designs.ts` | `updateDesignTemplate(designId, template, sessionToken)` |
| `siana-memento-api/app/services/generation_service.ts` | `TEMPLATES[]`, `getTemplate()`, `buildInitialPrompt()`, `buildIterationPrompt()` |
| `siana-memento-api/app/validators/design_validator.ts` | `updateDesignTemplateValidator` — enum template |
| `siana-memento-api/app/controllers/designs_controller.ts` | `updateTemplate()` (l.64) + `generate()` (l.161) |
| `siana-memento-api/app/models/design.ts` | Modèle Design — `template` column |
| `siana-memento-api/tests/functional/designs/update_template.spec.ts` | 8 tests existants sur update template |

### Technical Decisions

- **Champ DB `palette varchar(50) nullable`** plutôt qu'un enum DB. IDs palette type `terre-sauge`, `lavande-miel`. Nullable pour rétrocompatibilité : si `null`, le backend utilise la palette par défaut du template (index 0). Pas de migration des designs existants.
- **Validation palette liée au template** : le backend valide que la palette appartient bien au template sélectionné (pas juste une enum plate de 15 valeurs).

## Implementation Plan

### Tasks

- [x] Task 1: Migration DB — ajouter colonne `palette`
  - File: `siana-memento-api/database/migrations/<timestamp>_add_palette_to_designs.ts`
  - Action: Créer migration `alter designs add column palette varchar(50) nullable default null`
  - Notes: Nullable pour rétrocompatibilité. Pas de contrainte FK — validation applicative uniquement.

- [x] Task 2: Modèle Design — déclarer le champ `palette`
  - File: `siana-memento-api/app/models/design.ts`
  - Action: Ajouter `@column() declare palette: string | null`
  - Notes: Après le champ `template` existant.

- [x] Task 3: Backend — données palettes et résolution
  - File: `siana-memento-api/app/services/generation_service.ts`
  - Action:
    - Ajouter un type `PaletteConfig` avec `{ id: string, name: string, primaryColor: string, secondaryColor: string, accentColor: string }`
    - Ajouter un champ `palettes: PaletteConfig[]` dans chaque `TemplateConfig` (3 palettes par template)
    - Remplacer les champs `primaryColor`/`secondaryColor`/`accentColor` au niveau template par les palettes
    - Ajouter une fonction `getPalette(templateId: string, paletteId: string | null): PaletteConfig` qui retourne la palette demandée ou la première par défaut
    - Mettre à jour `buildInitialPrompt()` : recevoir la palette résolue et l'injecter dans le prompt
    - Mettre à jour `buildIterationPrompt()` : idem
  - Notes: Les 15 palettes sont les données validées sur la page `/palettes-preview`. La liste `VALID_PALETTE_IDS` par template sera exportée pour le validateur.

- [x] Task 4: Validateur — accepter le champ `palette`
  - File: `siana-memento-api/app/validators/design_validator.ts`
  - Action: Ajouter `palette: vine.string().maxLength(50).optional()` dans `updateDesignTemplateValidator`. Créer une règle custom VineJS qui vérifie que la palette appartient au template sélectionné (importer la map depuis `generation_service.ts`).
  - Notes: La palette est optionnelle — si absente, la palette par défaut est utilisée.

- [x] Task 5: Contrôleur — sauvegarder la palette
  - File: `siana-memento-api/app/controllers/designs_controller.ts`
  - Action:
    - Dans `updateTemplate()` : sauvegarder `payload.palette ?? null` dans `design.palette` en même temps que `design.template`
    - Dans `generate()` : récupérer la palette via `getPalette(design.template, design.palette)` et la passer à `generateDesignImage()`
  - Notes: `generateDesignImage()` recevra la palette résolue au lieu de la `TemplateConfig` entière pour les couleurs.

- [x] Task 6: Frontend — données palettes dans `templates.ts`
  - File: `siana-memento-web/src/lib/templates.ts`
  - Action:
    - Ajouter type `PaletteOption` avec `{ id: string, name: string, primaryColor: string, secondaryColor: string, accentColor: string }`
    - Ajouter champ `palettes: PaletteOption[]` dans `TemplateConfig`
    - Remplacer les champs couleur directs par les palettes (la première palette de chaque template est la palette par défaut)
    - Exporter un helper `getDefaultPalette(templateId): PaletteOption`
  - Notes: Dupliquer les données palette dans le frontend (même pattern que les templates).

- [x] Task 7: Store Zustand — nouveau champ `selectedPalette`
  - File: `siana-memento-web/src/stores/useGenerationStore.ts`
  - Action:
    - Ajouter `selectedPalette: string | null` dans le state (default `null`)
    - Ajouter `setPalette: (palette: string) => void`
    - Modifier `setTemplate()` pour reset `selectedPalette` à `null` quand on change de template
    - Ajouter `selectedPalette` dans les champs persistés
  - Notes: Reset palette au changement de template pour éviter une palette orpheline.

- [x] Task 8: API client — envoyer la palette
  - File: `siana-memento-web/src/lib/api/designs.ts`
  - Action: Ajouter paramètre `palette?: string` à `updateDesignTemplate()`. L'inclure dans le body PATCH envoyé au backend.
  - Notes: Optionnel — si absent, le backend utilise la palette par défaut.

- [x] Task 9: TemplateSelector — sous-sélecteur palette
  - File: `siana-memento-web/src/components/siana/TemplateSelector.tsx`
  - Action:
    - Ajouter un state local `selectedPaletteId` (default: première palette du template sélectionné)
    - Quand un template est sélectionné, afficher en dessous de la card sélectionnée un groupe de radio buttons avec les 3 palettes (3 ronds de couleurs + nom de la palette)
    - Reset `selectedPaletteId` quand le template change
    - Dans `handleContinue()` : appeler `updateDesignTemplate(designId, selected, sessionToken, selectedPaletteId)` puis `setPalette(selectedPaletteId)`
  - Notes: Les radios n'apparaissent que pour le template actuellement sélectionné. La première palette est pré-sélectionnée par défaut. Utiliser `aria-label` pour l'accessibilité.

- [x] Task 10: Tests — étendre `update_template.spec.ts`
  - File: `siana-memento-api/tests/functional/designs/update_template.spec.ts`
  - Action: Ajouter des cas de test :
    - Palette valide acceptée et sauvegardée en DB
    - Palette invalide pour le template → 422
    - Palette absente → `null` en DB (défaut)
    - Changement de template reset la palette si l'ancienne n'est plus valide
  - Notes: Suivre le pattern existant (helpers, transaction isolation).

- [x] Task 11: Nettoyage — supprimer la page `/palettes-preview`
  - File: `siana-memento-web/src/app/palettes-preview/page.tsx`
  - Action: Supprimer le fichier (page temporaire de preview)

### Acceptance Criteria

- [x] AC 1: Given un utilisateur sur la page template, when il sélectionne un template, then un sous-sélecteur affiche les 3 palettes du template avec leurs couleurs et noms
- [x] AC 2: Given un template sélectionné, when l'utilisateur clique sur une palette radio, then la palette est visuellement sélectionnée et la première est pré-sélectionnée par défaut
- [x] AC 3: Given un template et une palette sélectionnés, when l'utilisateur clique "Continuer", then le backend reçoit et sauvegarde le couple `template` + `palette`
- [x] AC 4: Given un design avec template "boheme" et palette "lavande-miel", when la génération est lancée, then le prompt Gemini contient les couleurs `#7B6B8A`, `#FDF6EC`, `#8B6F47`
- [x] AC 5: Given un design sans palette (ancien design ou palette non choisie), when la génération est lancée, then le prompt utilise la palette par défaut du template (index 0)
- [x] AC 6: Given une requête PATCH avec palette "lavande-miel" pour template "moderne", when le backend valide, then il retourne 422 (palette invalide pour ce template)
- [x] AC 7: Given un changement de template dans le sélecteur, when l'utilisateur passe de Bohème à Moderne, then la palette sélectionnée est reset à la première palette de Moderne
- [x] AC 8: Given le sous-sélecteur palette, when un lecteur d'écran parcourt les options, then chaque palette a un `aria-label` descriptif incluant le nom et les couleurs

## Additional Context

### Dependencies

- Aucune dépendance externe nouvelle. Pas de nouvelle librairie à installer.
- Dépend de la migration DB exécutée avant le déploiement backend.

### Testing Strategy

- **Tests fonctionnels backend** : étendre `update_template.spec.ts` avec 4 nouveaux cas (palette valide, invalide, absente, cross-template)
- **Test manuel frontend** : vérifier le sous-sélecteur sur chaque template, le reset au changement, et l'accessibilité clavier
- **Test e2e** : flow complet upload → template + palette → configure → generate, vérifier que l'image générée correspond à la palette choisie (vérification visuelle)

### Notes

- Les designs existants en DB auront `palette = null` → le backend résout automatiquement vers la palette par défaut. Aucune migration de données nécessaire.
- Si à l'avenir on veut ajouter/modifier des palettes, il suffit de mettre à jour les données statiques dans `templates.ts` (frontend) et `generation_service.ts` (backend). Pas de changement DB.
- La validation cross-champ (palette appartient au template) est faite côté applicatif et non en contrainte DB, car les palettes sont des données statiques en code.

## Review Notes

- Adversarial review complétée (inline, step-05)
- Findings : 6 total (5 Low, 1 Medium), 0 fixés, 6 skippés
- Résolution : Skip — aucun bug fonctionnel, tous les findings sont cosmétiques ou conformes au spec
- Tests : 131/131 functional passent, typecheck backend et frontend propres
- Baseline : 4be938c

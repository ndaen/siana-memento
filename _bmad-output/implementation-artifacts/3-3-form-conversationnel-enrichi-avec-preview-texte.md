# Story 3.3 : Form Conversationnel Enrichi avec Preview Texte

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'utilisateur,
je veux renseigner les noms, la date et le lieu de mon mariage via un formulaire conversationnel,
afin de voir une preview du texte final avant de lancer la génération IA et éviter des itérations inutiles.

## Acceptance Criteria

1. **Given** un utilisateur ayant choisi son template **When** il arrive sur `/generate/configure` **Then** les labels sont formulés en questions ("Comment s'appellent les futurs mariés ?", "Quelle est la date de votre mariage ?", "Où se célèbre votre mariage ?") et la mascotte l'accueille avec un message chaleureux (FR23)

2. **Given** l'utilisateur saisit les prénoms **When** il tape la première lettre **Then** la mise en majuscule automatique s'applique (`autoCapitalize="words"` + capitalisation programmatique) et la validation inline confirme le champ en temps réel

3. **Given** tous les champs remplis **When** l'utilisateur consulte la section preview **Then** il voit un aperçu du texte final formaté en français ("Sophie & Thomas — 20 Septembre 2026 — Château de Lastours") avant de valider

4. **Given** l'utilisateur valide la preview **When** il clique sur "C'est parfait, générer mon design" **Then** le système enregistre la configuration via `PATCH /api/designs/:id/configure`, met à jour le store Zustand, et navigue vers `/generate/generating`

5. **Given** un utilisateur arrivant sur `/generate/configure` sans `designId` ou sans `selectedTemplate` dans le store **When** la page se charge **Then** il est redirigé automatiquement vers l'étape manquante (`/generate/upload` si pas de designId, `/generate/template` si pas de selectedTemplate)

## Tasks / Subtasks

### Backend — Endpoint configuration du design

- [x] Task 1 : Ajouter `updateDesignConfigureValidator` dans `siana-memento-api/app/validators/design_validator.ts` (AC: #4)
  - [x] Ajouter après `updateDesignTemplateValidator` :
    ```typescript
    export const updateDesignConfigureValidator = vine.compile(
      vine.object({
        partner1Name: vine.string().trim().minLength(1).maxLength(100),
        partner2Name: vine.string().trim().minLength(1).maxLength(100),
        weddingDate: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        weddingLocation: vine.string().trim().minLength(1).maxLength(255),
        sessionToken: vine.string().minLength(64).maxLength(64).optional(),
      })
    )
    ```

- [x] Task 2 : Ajouter la méthode `updateConfigure` dans `siana-memento-api/app/controllers/designs_controller.ts` (AC: #4)
  - [x] Importer le nouveau validator en haut du fichier
  - [x] Ajouter la méthode :
    ```typescript
    /**
     * PATCH /api/designs/:id/configure
     * Met à jour les données du mariage (noms, date, lieu). Auth optionnelle.
     * Ownership check : userId si connecté, sessionToken si anonyme.
     */
    async updateConfigure({ params, request, auth, response }: HttpContext) {
      const payload = await request.validateUsing(updateDesignConfigureValidator)
      const design = await Design.find(params.id)

      if (!design) {
        return response.notFound({
          success: false,
          error: { code: 'DESIGN_NOT_FOUND', message: 'Design introuvable.' },
        })
      }

      // Vérification propriété — même logique que updateTemplate
      const userId = auth.user?.id ?? null
      if (userId) {
        if (design.userId !== userId) {
          return response.forbidden({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Accès interdit.' },
          })
        }
      } else {
        if (!payload.sessionToken || design.sessionToken !== payload.sessionToken) {
          return response.forbidden({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Accès interdit.' },
          })
        }
      }

      await design
        .merge({
          partner1Name: payload.partner1Name,
          partner2Name: payload.partner2Name,
          weddingDate: DateTime.fromISO(payload.weddingDate),
          weddingLocation: payload.weddingLocation,
        })
        .save()

      return response.ok({
        success: true,
        data: {
          designId: design.id,
        },
      })
    }
    ```
  - [x] S'assurer que `DateTime` de Luxon est déjà importé (il l'est depuis Story 3.1)

- [x] Task 3 : Ajouter la route dans `siana-memento-api/start/routes.ts` (AC: #4)
  - [x] Ajouter après la route PATCH template :
    ```typescript
    router
      .patch('/api/designs/:id/configure', [DesignsController, 'updateConfigure'])
      .use([designsThrottle, middleware.silentAuth()])
    ```

### Backend — Tests fonctionnels

- [x] Task 4 : Créer `siana-memento-api/tests/functional/designs/update_configure.spec.ts` (AC: #4)
  - [x] Pattern Japa identique aux stories précédentes :
    ```typescript
    import { test } from '@japa/runner'
    import testUtils from '@adonisjs/core/services/test_utils'

    test.group('PATCH /api/designs/:id/configure', (group) => {
      group.each.setup(() => testUtils.db().withGlobalTransaction())
    })
    ```
  - [x] Tests à couvrir :
    - `PATCH /api/designs/:id/configure` avec données valides + sessionToken → 200 + champs mis à jour en DB
    - `PATCH /api/designs/:id/configure` sans `partner1Name` → 422 validation error
    - `PATCH /api/designs/:id/configure` avec `partner1Name` vide → 422 validation error
    - `PATCH /api/designs/:id/configure` avec `weddingDate` format invalide (pas ISO YYYY-MM-DD) → 422 validation error
    - `PATCH /api/designs/:id/configure` avec `weddingLocation` manquant → 422 validation error
    - `PATCH /api/designs/:id/configure` avec mauvais sessionToken → 403 FORBIDDEN
    - `PATCH /api/designs/:id/configure` avec id inexistant → 404 DESIGN_NOT_FOUND
    - `PATCH /api/designs/:id/configure` avec utilisateur connecté + son design → 200 OK
    - `PATCH /api/designs/:id/configure` avec utilisateur connecté + design d'un autre → 403 FORBIDDEN

### Frontend — Lib API : ajout de updateDesignConfigure

- [x] Task 5 : Ajouter `updateDesignConfigure()` dans `siana-memento-web/src/lib/api/designs.ts` (AC: #4)
  - [x] Ajouter après la fonction existante :
    ```typescript
    type UpdateConfigureResult =
      | { success: true; designId: number }
      | { success: false; errorCode: string; message: string }

    export async function updateDesignConfigure(
      designId: number,
      data: {
        partner1Name: string
        partner2Name: string
        weddingDate: string
        weddingLocation: string
      },
      sessionToken?: string | null
    ): Promise<UpdateConfigureResult> {
      try {
        const res = await fetch(`${API_URL}/api/designs/${designId}/configure`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...data, ...(sessionToken ? { sessionToken } : {}) }),
        })
        const json = await res.json()
        if (json.success) return { success: true, designId: json.data.designId }
        return {
          success: false,
          errorCode: json.error?.code ?? 'UPDATE_FAILED',
          message: json.error?.message ?? 'Erreur lors de la configuration.',
        }
      } catch {
        return {
          success: false,
          errorCode: 'NETWORK_ERROR',
          message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
        }
      }
    }
    ```

### Frontend — Store Zustand : ajout des données mariage

- [x] Task 6 : Mettre à jour `siana-memento-web/src/stores/useGenerationStore.ts` (AC: #4, #3)
  - [x] Ajouter dans `GenerationState` :
    ```typescript
    partner1Name: string | null
    partner2Name: string | null
    weddingDate: string | null    // Format ISO YYYY-MM-DD — sérialisable
    weddingLocation: string | null
    ```
  - [x] Ajouter dans `initialState` :
    ```typescript
    partner1Name: null,
    partner2Name: null,
    weddingDate: null,
    weddingLocation: null,
    ```
  - [x] Ajouter dans l'interface `GenerationStore` :
    ```typescript
    setWeddingData: (data: {
      partner1Name: string
      partner2Name: string
      weddingDate: string
      weddingLocation: string
    }) => void
    ```
  - [x] Ajouter l'action :
    ```typescript
    setWeddingData: (data) => set({
      partner1Name: data.partner1Name,
      partner2Name: data.partner2Name,
      weddingDate: data.weddingDate,
      weddingLocation: data.weddingLocation,
    }),
    ```
  - [x] Ajouter dans `partialize` :
    ```typescript
    partner1Name: state.partner1Name,
    partner2Name: state.partner2Name,
    weddingDate: state.weddingDate,
    weddingLocation: state.weddingLocation,
    ```
  - [x] Ajouter dans `reset()` :
    ```typescript
    partner1Name: null,
    partner2Name: null,
    weddingDate: null,
    weddingLocation: null,
    ```

### Frontend — Composant ConfigForm

- [x] Task 7 : Créer `siana-memento-web/src/components/siana/ConfigForm.tsx` (AC: #1, #2, #3, #4)

### Frontend — Guard ConfigureGuard

- [x] Task 8 : Créer `siana-memento-web/src/components/siana/ConfigureGuard.tsx` (AC: #5)

### Frontend — Page `/generate/configure`

- [x] Task 9 : Créer `siana-memento-web/src/app/(public)/generate/configure/page.tsx` (AC: #1, #5)

### Tests frontend

- [x] Task 10 : Vérification TypeScript et ESLint (AC: ensemble)
  - [x] `npx tsc --noEmit` depuis `siana-memento-web/` — zéro erreur TypeScript
  - [x] `npx eslint src/components/siana/ConfigForm.tsx src/components/siana/ConfigureGuard.tsx src/app/\(public\)/generate/configure/page.tsx src/lib/api/designs.ts src/stores/useGenerationStore.ts` — zéro warning ESLint (fix: `useWatch` au lieu de `watch()` pour compatibilité React Compiler)

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Ajouter le contrôle `_hasHydrated` dans `ConfigureGuard` pour éviter les redirections avant hydratation du store (refresh tunnel). [siana-memento-web/src/components/siana/ConfigureGuard.tsx:16]
- [x] [AI-Review][HIGH] Renforcer la validation backend pour rejeter les dates invalides (ex: 2026-13-40) et ajouter un test dédié. [siana-memento-api/app/validators/design_validator.ts:25]
- [x] [AI-Review][MEDIUM] Aligner la validation frontend avec le backend en `trim` les champs (éviter que "   " passe côté UI). [siana-memento-web/src/components/siana/ConfigForm.tsx:17]
- [x] [AI-Review][MEDIUM] Rendre le label visible du 2e prénom une vraie question (pas seulement `sr-only`) pour respecter l’AC #1. [siana-memento-web/src/components/siana/ConfigForm.tsx:144]
- [x] [AI-Review][LOW] Nettoyer l’asset dupliqué ou non utilisé `public/siana-neutral.svg` (hors dossier `/public/mascotte/`). [siana-memento-web/public/siana-neutral.svg:1]

## Dev Notes

### Flux complet Story 3.3

```
1. Utilisateur arrive sur /generate/configure (depuis /generate/template Story 3.2)
2. ConfigureGuard vérifie designId ET selectedTemplate dans Zustand
   - Pas de designId → redirect /generate/upload
   - Pas de selectedTemplate → redirect /generate/template
3. Formulaire conversationnel avec 4 champs s'affiche (React Hook Form + Zod)
4. Saisie des prénoms → capitalisation automatique via capitalizeWords()
5. Validation inline en temps réel (mode: 'onChange')
6. Dès que tous les champs valides → preview texte apparaît en temps réel
7. Clic "C'est parfait, générer mon design" → PATCH /api/designs/:id/configure
8. Backend met à jour partner_1_name, partner_2_name, wedding_date, wedding_location
9. Store Zustand mis à jour (weddingData + currentStep = 'generating')
10. Navigation vers /generate/generating (Story 3.4)
```

### DB Schema — Colonnes utilisées dans `designs`

| Colonne | Type | Note |
|---------|------|-------|
| `partner_1_name` | VARCHAR(100) nullable | Mis à jour par cette story |
| `partner_2_name` | VARCHAR(100) nullable | Mis à jour par cette story |
| `wedding_date` | DATE nullable | Format Luxon DateTime depuis ISO string |
| `wedding_location` | VARCHAR(255) nullable | Mis à jour par cette story |

La colonne `wedding_date` est de type `date` (pas `datetime`) dans la migration. Le modèle Lucid utilise `@column.date()` → `DateTime | null`. La conversion s'effectue avec `DateTime.fromISO(payload.weddingDate)`.

### Pattern React Hook Form + Zod

C'est **la première story** du projet à utiliser React Hook Form + Zod (déjà installés dans `package.json` : `react-hook-form@^7.71.1`, `zod@^4.3.6`, `@hookform/resolvers@^5.2.2`).

**Import Zod v4 (CRITIQUE) :** Zod 4 change son import path. Utiliser :
```typescript
import { z } from 'zod/v4'
```
Et non `import { z } from 'zod'` (la v4 exporte les deux mais `zod/v4` est l'import canonique pour Zod 4).

**Import resolver** : `@hookform/resolvers` v5 est compatible avec Zod 4 :
```typescript
import { zodResolver } from '@hookform/resolvers/zod'
```

**Mode validation `onChange`** : Active la validation dès la saisie (feedback immédiat). Combiné avec `isValid` pour désactiver le bouton de submit tant que le formulaire est invalide.

**`useWatch` au lieu de `watch()` (CRITIQUE)** : Le projet utilise le React Compiler. `watch()` retourne une fonction non mémoïsable → warning ESLint `react-hooks/incompatible-library`. Utiliser `useWatch({ control, name: 'fieldName' })` qui est compatible React Compiler.

### Capitalisation des prénoms

La capitalisation programmatique est nécessaire car `autoCapitalize="words"` est uniquement une aide sur mobile (virtual keyboard). Pour garantir la capitalisation sur desktop :

```typescript
// Dans le register onChange :
onChange: (e) => {
  const capitalized = capitalizeWords(e.target.value)
  setValue('fieldName', capitalized, { shouldValidate: true })
}
```

`{ shouldValidate: true }` est nécessaire pour que la validation inline se déclenche après le `setValue`.

### Formatage de la date en français

```typescript
const date = new Date(dateIso + 'T12:00:00') // T12:00:00 évite le décalage UTC-1 en hiver
new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(date)
// → "20 septembre 2026"
```

**Important :** Ajouter `T12:00:00` à l'ISO date string pour éviter que `new Date('2026-09-20')` soit interprété comme UTC midnight et s'affiche comme le 19 septembre dans les fuseaux horaires négatifs (Europe/Paris = UTC+2 en été, mais UTC+1 en hiver). Avec `T12:00:00` en local time, on est toujours sur le bon jour.

### Mascotte — Assets disponibles

Dossier : `/public/mascotte/`
- `siana-neutral.svg` — État neutre (accueil, messages génériques) ← **utiliser ici**
- `siana-working.svg` — En cours de travail
- `siana-success.svg` — Succès
- `siana-error.svg` — Erreur
- `siana-waiting.svg` — En attente

Utiliser `next/image` (Next.js 15 — optimisation automatique) :
```tsx
<Image src="/mascotte/siana-neutral.svg" alt="" aria-hidden="true" width={40} height={40} />
```
`aria-hidden="true"` car la mascotte est décorative — le texte adjacent porte le message.

### Authentification optionnelle — Pattern identique à Stories 3.1 et 3.2

`PATCH /api/designs/:id/configure` utilise `middleware.silentAuth()`. Ce middleware :
- Popule `auth.user` si token de session valide
- Ne bloque **pas** si anonyme (ne renvoie pas 401)

**Ownership check (double logique) :**
```
Si auth.user → vérifier design.userId === auth.user.id
Si anonyme   → vérifier design.sessionToken === payload.sessionToken
```
Le `sessionToken` est disponible dans `useGenerationStore` (persisté localStorage depuis Story 3.1).

### Sticky CTA mobile — Pattern hérité de Story 3.2

```tsx
<div className="sticky bottom-0 -mx-4 bg-background/95 px-4 pb-4 pt-2 backdrop-blur-sm
                 sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
```
Cohérent avec `TemplateSelector.tsx`. Bouton "sticky" en bas sur mobile, dans le flux normal sur `sm:` (≥640px).

### Guard ConfigureGuard — Double vérification

Contrairement à `TemplateGuard` (Story 3.2) qui vérifie uniquement `designId`, `ConfigureGuard` vérifie **deux conditions** :
1. `designId` présent → sinon redirect `/generate/upload`
2. `selectedTemplate` présent → sinon redirect `/generate/template`

Cela maintient l'intégrité du tunnel de génération : l'utilisateur ne peut pas sauter l'étape de sélection du template.

### Intégrité Store Zustand

Les nouveaux champs `partner1Name`, `partner2Name`, `weddingDate`, `weddingLocation` doivent être :
1. Ajoutés dans `GenerationState` interface
2. Ajoutés dans `initialState` (= `null`)
3. Ajoutés dans `partialize` → persistés en localStorage
4. Ajoutés dans `reset()` → réinitialisés à `null`

**Ne pas oublier** `setWeddingData` dans l'interface `GenerationStore`. Nommer l'action `setWeddingData` (groupé) plutôt que 4 setters séparés.

### Fichiers à créer / modifier

```
Backend — Modifier :
siana-memento-api/
├── app/
│   ├── controllers/
│   │   └── designs_controller.ts    ← MODIFIER (ajouter updateConfigure)
│   └── validators/
│       └── design_validator.ts      ← MODIFIER (ajouter updateDesignConfigureValidator)
├── start/
│   └── routes.ts                    ← MODIFIER (ajouter PATCH /api/designs/:id/configure)
└── tests/functional/designs/
    └── update_configure.spec.ts     ← CRÉER

Frontend — Créer :
siana-memento-web/src/
├── app/(public)/generate/configure/
│   └── page.tsx                     ← CRÉER
├── components/siana/
│   ├── ConfigForm.tsx               ← CRÉER
│   └── ConfigureGuard.tsx           ← CRÉER

Frontend — Modifier :
siana-memento-web/src/
├── lib/api/
│   └── designs.ts                   ← MODIFIER (ajouter updateDesignConfigure)
└── stores/
    └── useGenerationStore.ts        ← MODIFIER (ajouter champs mariage + setWeddingData)
```

### Intelligence de Story 3.2 — À ne pas régresser

**Fichiers créés/modifiés par Story 3.2 qui sont touchés par Story 3.3 :**

- `siana-memento-api/app/controllers/designs_controller.ts` — **MODIFIER** (ajouter `updateConfigure`) sans toucher à `store` ni `updateTemplate`
- `siana-memento-api/app/validators/design_validator.ts` — **MODIFIER** (ajouter nouveau validator) sans toucher aux validators existants
- `siana-memento-api/start/routes.ts` — **MODIFIER** (ajouter 1 route) sans perturber les routes existantes
- `siana-memento-web/src/stores/useGenerationStore.ts` — **MODIFIER** (ajouter 4 champs + 1 action) sans casser l'interface existante (`setTemplate`, `selectedTemplate`, etc.)
- `siana-memento-web/src/lib/api/designs.ts` — **MODIFIER** (ajouter 1 fonction) sans toucher `updateDesignTemplate`

### Analyse Git — Commits récents pertinents

```
2b12e93 feat: add Gemini generation service and extract template configs
e5718d9 feat(S3-2): galerie de sélection de template
bd479d2 feat: integrate Vercel Analytics and update layout metadata
0188309 fix: sign endpoint method GET instead of POST
e0c9a3a feat(S3-1): upload de photos
```

- `feat: add Gemini generation service` (commit 2b12e93) : Le `generation_service.ts` utilise `buildPrompt(theme)` → **pas encore de couple names ni de date/lieu dans le prompt**. Story 3.4 devra mettre à jour le prompt pour inclure ces données. Ne pas modifier `generation_service.ts` dans cette story.
- Pattern commit attendu pour cette story : `feat(S3-3): form conversationnel avec preview texte`

### Accessibilité (NFR-A1 à A7)

- **Labels conversationnels** : Vraies questions HTML `<label>` associées via `for`/`id` — accessibles aux lecteurs d'écran
- **Validation inline** : `aria-describedby` pointe vers `<p id="...">` d'erreur, `aria-invalid={true}` sur l'input en erreur, `role="alert"` sur le message d'erreur pour annonce immédiate
- **Preview region** : `role="region"` + `aria-label` décrit le contenu
- **Bouton submit** : `disabled` natif + `aria-busy` pendant loading
- **Mascotte** : `aria-hidden="true"` (décorative) — le texte adjacent porte le message
- **Step indicator** : `<p className="sr-only">Étape 3 sur 4</p>` pour lecteurs d'écran
- **Touch targets** : Inputs avec hauteur naturelle ≥44px avec `h-10` (40px) + padding → 40px suffisant car les `Input` shadcn/ui sont `h-10` (NFR-A2)

### Références

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3] — User story + acceptance criteria originaux
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Routes] — Route `/generate/configure`, composant `ConfigForm`
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management] — Zustand persist, nouveaux champs mariage
- [Source: _bmad-output/planning-artifacts/architecture.md#Tech Stack] — React Hook Form + Zod (typesafe forms)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] — Mode conversationnel, validation inline, mascotte facilitatrice
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Button Hierarchy] — Sticky CTA mobile, Vert Sauge
- [Source: CLAUDE.md#Frontend Conventions] — Toasts erreurs système, inline field errors, sr-only
- [Source: _bmad-output/implementation-artifacts/3-2-galerie-de-selection-de-template.md] — Patterns guard (TemplateGuard), sticky CTA, lib/api, silentAuth, Zustand partialize/reset
- [Source: siana-memento-api/database/migrations/1771677000000_create_designs_table.ts] — Colonnes partner_1_name, partner_2_name, wedding_date (date), wedding_location
- [Source: siana-memento-api/app/models/design.ts] — partner1Name, partner2Name, weddingDate (DateTime), weddingLocation
- [Source: siana-memento-api/app/services/generation_service.ts] — buildPrompt ne prend pas encore les données mariage (à enrichir en Story 3.4)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fix React Compiler warning : `watch()` de React Hook Form retourne des fonctions non mémoïsables → avertissement ESLint `react-hooks/incompatible-library`. Solution : remplacer par `useWatch({ control, name: 'fieldName' })` pour chaque champ observé — compatible React Compiler. Zéro warning après fix.
- [AI-Review][HIGH] Fix hydration : `ConfigureGuard` ne vérifiait pas `_hasHydrated` avant de rediriger, causant des faux redirects au refresh. Alignement avec le pattern `TemplateGuard` (vérification `_hasHydrated` + destructuring depuis le store).
- [AI-Review][HIGH] Fix validation date backend : regex `/^\d{4}-\d{2}-\d{2}$/` acceptait des dates impossibles (2026-13-40). Ajout de `validDateRule` via `vine.createRule()` qui vérifie la cohérence année/mois/jour avec `new Date()`. Nouveau test dédié ajouté.
- [AI-Review][MEDIUM] Fix trim frontend : `.trim()` ajouté dans le schema Zod pour `partner1Name`, `partner2Name`, `weddingLocation` — aligne avec `.trim()` VineJS côté backend. Empêche "   " (espaces seuls) de passer la validation.
- [AI-Review][MEDIUM] Fix label 2e prénom : remplacé la structure `sr-only` / `aria-hidden` par un vrai label visible "Et le prénom du second marié ?" — conforme AC#1 et accessible visuellement.
- [AI-Review][LOW] Supprimé `public/siana-neutral.svg` (doublon non référencé) — l'asset correct est `/public/mascotte/siana-neutral.svg`.

### Completion Notes List

- ✅ AC#1 : Form conversationnel sur `/generate/configure` avec labels en questions, mascotte (`siana-neutral.svg`) en accueil chaleureux, `Étape 3 sur 4` sr-only
- ✅ AC#2 : `autoCapitalize="words"` + `capitalizeWords()` programmatique sur `onChange`, validation inline `mode: 'onChange'` avec Zod
- ✅ AC#3 : Preview temps-réel `Intl.DateTimeFormat('fr-FR')` avec `T12:00:00` anti-décalage fuseau ; apparaît dès que les 4 champs sont valides
- ✅ AC#4 : `PATCH /api/designs/:id/configure` — ownership check dual (userId/sessionToken) ; `DateTime.fromISO()` pour `wedding_date` ; store Zustand mis à jour ; navigation `/generate/generating`
- ✅ AC#5 : `ConfigureGuard` double vérification (`designId` → upload, `selectedTemplate` → template) ; `null` pendant redirection (pas de flash)
- ✅ 10/10 tests backend passent (`update_configure.spec.ts`, dont 1 test date impossible) — 73/73 total (zéro régression)
- ✅ TypeScript strict : `npx tsc --noEmit` sans erreur (frontend)
- ✅ ESLint propre : 0 erreur, 0 warning (fix useWatch pour React Compiler)
- ✅ Sticky CTA mobile : bouton "C'est parfait, générer mon design →" en `sticky bottom-0` sur mobile
- ✅ Première utilisation de React Hook Form + Zod v4 dans le projet

### File List

**Backend — Modifiés :**
- `siana-memento-api/app/validators/design_validator.ts` — ajout `updateDesignConfigureValidator`
- `siana-memento-api/app/controllers/designs_controller.ts` — ajout méthode `updateConfigure` + import validator
- `siana-memento-api/start/routes.ts` — ajout `PATCH /api/designs/:id/configure` avec `silentAuth`

**Backend — Créés :**
- `siana-memento-api/tests/functional/designs/update_configure.spec.ts` — 10 tests fonctionnels (+ test date impossible 2026-13-40)

**Frontend — Créés :**
- `siana-memento-web/src/components/siana/ConfigForm.tsx` — form conversationnel React Hook Form + Zod, preview temps-réel, mascotte, sticky CTA
- `siana-memento-web/src/components/siana/ConfigureGuard.tsx` — guard tunnel (double vérification designId + selectedTemplate)
- `siana-memento-web/src/app/(public)/generate/configure/page.tsx` — page `/generate/configure`

**Frontend — Modifiés :**
- `siana-memento-web/src/lib/api/designs.ts` — ajout `updateDesignConfigure()`
- `siana-memento-web/src/stores/useGenerationStore.ts` — ajout `partner1Name`, `partner2Name`, `weddingDate`, `weddingLocation` + `setWeddingData` + `partialize` + `reset`

### Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-26 | claude-sonnet-4-6 | Implémentation complète Story 3.3 : PATCH /api/designs/:id/configure (ownership check dual), 10 tests Japa (73/73 total), ConfigForm conversationnel (React Hook Form + Zod v4 + useWatch), preview texte fr-FR temps-réel, ConfigureGuard double vérification, store Zustand 4 champs mariage, TypeScript + ESLint clean |
| 2026-02-26 | claude-sonnet-4-6 | Adresse 5 findings code review : _hasHydrated guard, validDateRule VineJS, trim Zod, label visible 2e prénom, suppression asset dupliqué |

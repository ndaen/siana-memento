# Story 3.2 : Galerie de Sélection de Template (Style Universe Selector)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'utilisateur,
je veux voir et choisir parmi 5 styles artistiques illustrés,
afin de définir l'univers visuel de mon Save the Date avant la génération.

## Acceptance Criteria

1. **Given** un utilisateur ayant uploadé ses photos **When** il arrive sur la page `/generate/template` **Then** une galerie de 5 templates s'affiche (Bohème, Moderne, Classique, Vintage, Minimaliste) avec un visuel d'exemple pour chacun (FR10)

2. **Given** la galerie sur mobile **When** l'utilisateur la consulte **Then** les cartes de template ont une zone tactile d'au moins 44px et l'effet zoom "Luxe" est visible au tap (NFR-A2)

3. **Given** un utilisateur qui sélectionne un template **When** il clique ou tape sur une carte **Then** le template est mis en évidence (bordure Vert Sauge `#2D4A3E`) et un bouton "Continuer" devient actif (FR11)

4. **Given** un utilisateur ayant sélectionné un template **When** il clique sur "Continuer" **Then** le template est sauvegardé en DB (`PATCH /api/designs/:id/template`) et l'utilisateur est redirigé vers `/generate/configure` avec le `designId` préservé dans le store Zustand

5. **Given** un utilisateur arrivant sur `/generate/template` sans `designId` dans le store Zustand **When** la page se charge **Then** il est redirigé automatiquement vers `/generate/upload` (guard de protection du tunnel)

## Tasks / Subtasks

### Backend — Endpoint mise à jour du template

- [x] Task 1 : Créer `PATCH /api/designs/:id/template` — met à jour le champ `template` du design (AC: #4)
  - [x] Ajouter le validator `updateDesignTemplateValidator` dans `siana-memento-api/app/validators/design_validator.ts` :
    ```typescript
    export const updateDesignTemplateValidator = vine.compile(
      vine.object({
        template: vine.enum(['boheme', 'moderne', 'classique', 'vintage', 'minimaliste']),
        sessionToken: vine.string().minLength(64).maxLength(64).optional(),
      })
    )
    ```
  - [x] Ajouter la méthode `updateTemplate` dans `siana-memento-api/app/controllers/designs_controller.ts` :
    ```typescript
    /**
     * PATCH /api/designs/:id/template
     * Met à jour le template du design. Auth optionnelle.
     * Ownership check : userId si connecté, sessionToken si anonyme.
     */
    async updateTemplate({ params, request, auth, response }: HttpContext) {
      const payload = await request.validateUsing(updateDesignTemplateValidator)
      const design = await Design.find(params.id)

      if (!design) {
        return response.notFound({
          success: false,
          error: { code: 'DESIGN_NOT_FOUND', message: 'Design introuvable.' },
        })
      }

      // Vérification propriété
      const userId = auth.user?.id ?? null
      if (userId) {
        if (design.userId !== userId) {
          return response.forbidden({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Accès interdit.' },
          })
        }
      } else {
        // Utilisateur anonyme → vérifier sessionToken
        if (!payload.sessionToken || design.sessionToken !== payload.sessionToken) {
          return response.forbidden({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Accès interdit.' },
          })
        }
      }

      await design.merge({ template: payload.template }).save()

      return response.ok({
        success: true,
        data: {
          designId: design.id,
          template: design.template,
        },
      })
    }
    ```
  - [x] Ajouter la route dans `start/routes.ts` :
    ```typescript
    router
      .patch('/api/designs/:id/template', [DesignsController, 'updateTemplate'])
      .use(middleware.silentAuth())
    ```

### Backend — Tests fonctionnels

- [x] Task 2 : Tests fonctionnels pour `PATCH /api/designs/:id/template` (AC: #4)
  - [x] Créer `siana-memento-api/tests/functional/designs/update_template.spec.ts` :
    - `PATCH /api/designs/:id/template` avec template valide + sessionToken → 200 + design.template mis à jour
    - `PATCH /api/designs/:id/template` avec template invalide → 422 validation error
    - `PATCH /api/designs/:id/template` avec mauvais sessionToken → 403 FORBIDDEN
    - `PATCH /api/designs/:id/template` avec id inexistant → 404 DESIGN_NOT_FOUND
    - `PATCH /api/designs/:id/template` avec utilisateur connecté + son design → 200 OK
    - `PATCH /api/designs/:id/template` avec utilisateur connecté + design d'un autre → 403 FORBIDDEN
  - [x] Pattern Japa (identique à Story 3.1) :
    ```typescript
    import { test } from '@japa/runner'
    import testUtils from '@adonisjs/core/services/test_utils'

    test.group('PATCH /api/designs/:id/template', (group) => {
      group.each.setup(() => testUtils.db().withGlobalTransaction())
    })
    ```

### Frontend — Lib API designs

- [x] Task 3 : Créer `siana-memento-web/src/lib/api/designs.ts` avec la fonction de mise à jour template (AC: #4)
  ```typescript
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

  type UpdateTemplateResult =
    | { success: true; designId: number; template: string }
    | { success: false; errorCode: string; message: string }

  export async function updateDesignTemplate(
    designId: number,
    template: string,
    sessionToken?: string | null
  ): Promise<UpdateTemplateResult> {
    try {
      const res = await fetch(`${API_URL}/api/designs/${designId}/template`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ template, ...(sessionToken ? { sessionToken } : {}) }),
      })
      const json = await res.json()
      if (json.success) return { success: true, designId: json.data.designId, template: json.data.template }
      return {
        success: false,
        errorCode: json.error?.code ?? 'UPDATE_FAILED',
        message: json.error?.message ?? 'Erreur lors de la sélection du template.',
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

### Frontend — Store Zustand : ajout du champ selectedTemplate

- [x] Task 4 : Mettre à jour `useGenerationStore.ts` pour stocker le template sélectionné (AC: #3, #4)
  - [x] Ajouter `selectedTemplate` à l'interface et l'état dans `siana-memento-web/src/stores/useGenerationStore.ts` :
    ```typescript
    // Ajouter dans l'interface GenerationStore :
    selectedTemplate: string | null
    setTemplate: (template: string) => void

    // Ajouter dans l'initialisation :
    selectedTemplate: null,
    setTemplate: (template) => set({ selectedTemplate: template }),

    // Ajouter dans partialize :
    selectedTemplate: state.selectedTemplate,

    // Ajouter dans reset :
    selectedTemplate: null,
    ```

### Frontend — Composant TemplateSelector

- [x] Task 5 : Créer `siana-memento-web/src/components/siana/TemplateSelector.tsx` (AC: #1, #2, #3, #4, #5)
  ```tsx
  'use client'

  import { useState } from 'react'
  import { useRouter } from 'next/navigation'
  import { toast } from 'sonner'
  import { Button } from '@/components/ui/button'
  import { useGenerationStore } from '@/stores/useGenerationStore'
  import { updateDesignTemplate } from '@/lib/api/designs'

  export type TemplateId = 'boheme' | 'moderne' | 'classique' | 'vintage' | 'minimaliste'

  interface TemplateConfig {
    id: TemplateId
    name: string
    identity: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    illustration: string
  }

  const TEMPLATES: TemplateConfig[] = [
    {
      id: 'boheme',
      name: 'Bohème',
      identity: 'Romantique & naturel',
      primaryColor: '#C17A6F',
      secondaryColor: '#F5E6D3',
      accentColor: '#2D4A3E',
      illustration: 'Aquarelle douce',
    },
    {
      id: 'moderne',
      name: 'Moderne',
      identity: 'Épuré & sophistiqué',
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      accentColor: '#D4AF37',
      illustration: 'Flat design géométrique',
    },
    {
      id: 'classique',
      name: 'Classique',
      identity: 'Intemporel & élégant',
      primaryColor: '#800020',
      secondaryColor: '#F4EAD5',
      accentColor: '#D4AF37',
      illustration: 'Portrait dessiné',
    },
    {
      id: 'vintage',
      name: 'Vintage',
      identity: 'Nostalgie & rétro chic',
      primaryColor: '#A67C52',
      secondaryColor: '#EFE8D8',
      accentColor: '#6B705C',
      illustration: 'Rotoscope années 70',
    },
    {
      id: 'minimaliste',
      name: 'Minimaliste',
      identity: 'Épuré & zen',
      primaryColor: '#E8DCD4',
      secondaryColor: '#FAF8F6',
      accentColor: '#A8968A',
      illustration: 'Line art one-line',
    },
  ]

  export default function TemplateSelector() {
    const router = useRouter()
    const { designId, sessionToken, setTemplate, setStep } = useGenerationStore()
    const [selected, setSelected] = useState<TemplateId | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    async function handleContinue() {
      if (!selected || !designId) return
      setIsLoading(true)

      const result = await updateDesignTemplate(designId, selected, sessionToken)

      if (!result.success) {
        toast.error(result.message)
        setIsLoading(false)
        return
      }

      setTemplate(selected)
      setStep('configure')
      router.push('/generate/configure')
    }

    return (
      <div className="flex flex-col gap-6">
        <div
          role="list"
          aria-label="Sélection du style artistique"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {TEMPLATES.map((tpl) => {
            const isSelected = selected === tpl.id
            return (
              <button
                key={tpl.id}
                type="button"
                role="listitem"
                aria-pressed={isSelected}
                aria-label={`Choisir le style ${tpl.name} — ${tpl.identity}`}
                onClick={() => setSelected(tpl.id)}
                className={[
                  // Touch target minimum 44px (min-h-[44px] couvert par le padding)
                  'relative flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200',
                  'hover:scale-[1.02] active:scale-[0.99]',  // Effet zoom "Luxe"
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D4A3E] focus-visible:ring-offset-2',
                  isSelected
                    ? 'border-[#2D4A3E] bg-[#2D4A3E]/5 shadow-md'
                    : 'border-border bg-card hover:border-[#2D4A3E]/40',
                ].join(' ')}
              >
                {/* Indicateur de sélection */}
                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#2D4A3E] text-xs text-white"
                  >
                    ✓
                  </span>
                )}

                {/* Palette couleurs visuelles */}
                <div className="flex gap-1.5" aria-hidden="true">
                  {[tpl.primaryColor, tpl.secondaryColor, tpl.accentColor].map((color, i) => (
                    <span
                      key={i}
                      className="h-6 w-6 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Nom et identité */}
                <div>
                  <p className="font-display text-base font-semibold leading-tight">
                    {tpl.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {tpl.identity}
                  </p>
                </div>

                {/* Style illustration */}
                <p className="text-xs italic text-muted-foreground/70">
                  {tpl.illustration}
                </p>
              </button>
            )
          })}
        </div>

        {/* Bouton Continuer — sticky sur mobile */}
        <div className="sticky bottom-0 -mx-4 bg-background/95 px-4 pb-4 pt-2 backdrop-blur-sm sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <Button
            size="lg"
            className="w-full font-semibold"
            disabled={!selected || isLoading}
            onClick={handleContinue}
            aria-busy={isLoading}
          >
            {isLoading ? 'Enregistrement...' : 'Continuer →'}
          </Button>
        </div>
      </div>
    )
  }
  ```

### Frontend — Page `/generate/template`

- [x] Task 6 : Créer la page `siana-memento-web/src/app/(public)/generate/template/page.tsx` (AC: #1, #5)
  ```tsx
  import { redirect } from 'next/navigation'
  import type { Metadata } from 'next'
  import TemplateSelector from '@/components/siana/TemplateSelector'
  import TemplateGuard from '@/components/siana/TemplateGuard'

  export const metadata: Metadata = {
    title: 'Choisissez votre style — Siana Memento',
  }

  export default function TemplatePage() {
    return (
      <main className="flex min-h-screen flex-col items-center justify-start px-4 py-10">
        <div className="w-full max-w-xl">
          <p className="sr-only">Étape 2 sur 4</p>
          <h1 className="font-display mb-1 text-center text-3xl font-bold">
            Votre style
          </h1>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Choisissez l'univers artistique de votre Save the Date
          </p>
          {/* Guard côté client : redirige vers /generate/upload si pas de designId */}
          <TemplateGuard>
            <TemplateSelector />
          </TemplateGuard>
        </div>
      </main>
    )
  }
  ```
  - [x] Créer `siana-memento-web/src/components/siana/TemplateGuard.tsx` (Client Component — guard tunnel) :
    ```tsx
    'use client'

    import { useEffect } from 'react'
    import { useRouter } from 'next/navigation'
    import { useGenerationStore } from '@/stores/useGenerationStore'

    interface TemplateGuardProps {
      children: React.ReactNode
    }

    export default function TemplateGuard({ children }: TemplateGuardProps) {
      const router = useRouter()
      const designId = useGenerationStore((state) => state.designId)

      useEffect(() => {
        if (!designId) {
          router.replace('/generate/upload')
        }
      }, [designId, router])

      if (!designId) return null

      return <>{children}</>
    }
    ```
  - **Note :** Le guard est côté client car `useGenerationStore` lit le localStorage. Le Server Component ne peut pas accéder au store Zustand.

### Tests frontend

- [x] Task 7 : Vérification TypeScript et ESLint (AC: ensemble)
  - [x] `npx tsc --noEmit` depuis `siana-memento-web/` — zéro erreur TypeScript
  - [x] `npx eslint src/components/siana/TemplateSelector.tsx src/components/siana/TemplateGuard.tsx src/app/\(public\)/generate/template/page.tsx src/lib/api/designs.ts src/stores/useGenerationStore.ts` — zéro warning ESLint (fix: `<ul>/<li>` au lieu de `role="list"` + `role="listitem"` sur bouton)

## Dev Notes

### Flux complet Story 3.2

```
1. Utilisateur arrive sur /generate/template (depuis /generate/upload Story 3.1)
2. TemplateGuard vérifie designId dans Zustand store — redirect /generate/upload si absent
3. Galerie de 5 template cards s'affiche
4. Utilisateur clique sur une carte → state local `selected` mis à jour + bordure Vert Sauge
5. Clic "Continuer" → PATCH /api/designs/:id/template { template, sessionToken? }
6. Backend vérifie propriété + met à jour design.template en DB
7. Store Zustand mis à jour (selectedTemplate = 'boheme', currentStep = 'configure')
8. Navigation vers /generate/configure (Story 3.3)
```

### DB Schema — Colonne `template` dans la table `designs`

**Table `designs`** (migration `1771677000000_create_designs_table.ts`) :

| Colonne | Type | Valeur à cette étape |
|---------|------|---------------------|
| `template` | ENUM nullable | Mis à jour par cette story (était null après Story 3.1) |

Le champ `template` est défini dans le modèle `Design` :
```typescript
@column()
declare template: string | null
```

Les valeurs valides : `'boheme' | 'moderne' | 'classique' | 'vintage' | 'minimaliste'`

### Authentification optionnelle — Pattern identique à Story 3.1

Le `PATCH /api/designs/:id/template` utilise `middleware.silentAuth()` (déjà déclaré dans `kernel.ts` comme named middleware depuis Story 3.1). Ce middleware popule `auth.user` si connecté, ne bloque pas si anonyme.

**Ownership check (double logique) :**
- Si `auth.user` → vérifier `design.userId === auth.user.id`
- Si anonyme → vérifier `design.sessionToken === payload.sessionToken`

Le `sessionToken` est disponible dans `useGenerationStore` (persisté en localStorage depuis Story 3.1).

### Templates — Données hardcodées côté frontend

Les 5 templates sont définis en constante dans `TemplateSelector.tsx`. **Pas d'appel API pour lister les templates** — ils sont statiques pour le MVP. La valeur envoyée au backend est l'`id` en minuscules snake_case : `'boheme'`, `'moderne'`, `'classique'`, `'vintage'`, `'minimaliste'`.

### Effet zoom "Luxe" — CSS uniquement

L'effet "Luxe" sur les cartes est implémenté avec Tailwind :
```
hover:scale-[1.02] active:scale-[0.99] transition-all duration-200
```
Pas de librairie externe nécessaire. `transition-all` est suffisant pour un effet premium.

### Sticky CTA mobile — Pattern UX

```tsx
<div className="sticky bottom-0 -mx-4 bg-background/95 px-4 pb-4 pt-2 backdrop-blur-sm
                 sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
```
Ce pattern positionne le bouton "Continuer" en sticky sur mobile (< 640px) et le remet dans le flux normal sur desktop. Cohérent avec les specs UX (Action Primaire sticky en bas sur mobile).

### TemplateGuard — Approche Client Component

La protection du tunnel de génération (redirect si pas de `designId`) doit être côté client car `useGenerationStore` lit le localStorage (unavailable côté serveur). Pattern :
- Server Component (`page.tsx`) : metadata, structure HTML
- Client Component (`TemplateGuard`) : lecture store Zustand + `useEffect` redirect

Ce pattern est cohérent avec la codebase existante (pas de middleware Next.js sur ces routes publiques).

### Variables d'environnement

Aucune variable d'environnement supplémentaire nécessaire pour cette story. `NEXT_PUBLIC_API_URL` déjà configurée depuis Story 3.1.

### Structure de fichiers à créer/modifier

```
Backend — Modifier :
siana-memento-api/
├── app/
│   ├── controllers/
│   │   └── designs_controller.ts    ← MODIFIER (ajouter updateTemplate)
│   └── validators/
│       └── design_validator.ts      ← MODIFIER (ajouter updateDesignTemplateValidator)
├── start/
│   └── routes.ts                    ← MODIFIER (ajouter PATCH /api/designs/:id/template)
└── tests/
    └── functional/designs/
        └── update_template.spec.ts  ← CRÉER

Frontend — Créer :
siana-memento-web/src/
├── app/(public)/generate/template/
│   └── page.tsx                     ← CRÉER
├── components/siana/
│   ├── TemplateSelector.tsx         ← CRÉER
│   └── TemplateGuard.tsx            ← CRÉER
└── lib/api/
    └── designs.ts                   ← CRÉER

Frontend — Modifier :
siana-memento-web/src/
└── stores/
    └── useGenerationStore.ts        ← MODIFIER (ajouter selectedTemplate + setTemplate)
```

### Patterns à réutiliser depuis Story 3.1

- `'use client'` sur tous les composants avec `useState`, `useEffect`, `useRouter`
- Pattern `lib/api/` : fonctions fetch isolées, jamais inline dans les composants
- Format réponse API : `{ success: true, data: {...} }` et `{ success: false, error: { code, message } }`
- `credentials: 'include'` sur tous les appels fetch
- `toast.error()` via Sonner pour erreurs système (réseau, API down)
- Pattern `group.each.setup(() => testUtils.db().withGlobalTransaction())` pour les tests Japa

### Intelligence de Story 3.1 — À ne pas régresser

**Fichiers créés/modifiés par Story 3.1 qui sont touchés par Story 3.2 :**

- `siana-memento-api/app/controllers/designs_controller.ts` — **MODIFIER** (ajouter `updateTemplate`) sans toucher à `store`
- `siana-memento-api/app/validators/design_validator.ts` — **MODIFIER** (ajouter nouveau validator) sans toucher à `createDesignValidator`
- `siana-memento-api/start/routes.ts` — **MODIFIER** (ajouter 1 route) sans perturber les routes existantes
- `siana-memento-web/src/stores/useGenerationStore.ts` — **MODIFIER** (ajouter champ `selectedTemplate`) sans casser l'interface existante

**Pattern de persistance Zustand** : les nouveaux champs doivent être ajoutés dans `partialize` pour être persistés en localStorage, et dans `reset()` pour être réinitialisés.

### Analyse Git — Commits récents pertinents

```
bd479d2 feat: integrate Vercel Analytics and update layout metadata
0188309 fix: sign endpoint method GET instead of POST
e0c9a3a feat(S3-1): upload de photos
640b7f5 feat: add mascot and logo assets  ← Assets mascotte disponibles dans public/
```

- Assets mascotte déjà dans `public/` (commit 640b7f5) — disponibles si nécessaire pour messages d'accompagnement
- Pattern commit attendu : `feat(S3-2): galerie de sélection de template`

### Accessibilité (NFR-A1 à A7)

- **Cards templates** : `role="listitem"` + `aria-pressed` (état sélectionné) + `aria-label` descriptif (nom + identité)
- **Liste cartes** : `role="list"` + `aria-label="Sélection du style artistique"`
- **Indicateur de sélection** : `aria-hidden="true"` sur le checkmark visuel (redondant avec `aria-pressed`)
- **Palettes couleurs** : `aria-hidden="true"` (décoratives)
- **Bouton continuer** : `disabled` natif quand aucun template sélectionné + `aria-busy` pendant loading
- **Touch targets** : Cartes avec `p-4` minimum = 48px hauteur effective → respecte NFR-A2 (≥44px)
- **Step indicator** : `<p className="sr-only">Étape 2 sur 4</p>` pour les lecteurs d'écran
- **Focus visible** : `focus-visible:ring-2 focus-visible:ring-[#2D4A3E]` sur les cartes

### Références

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] — User story + acceptance criteria originaux
- [Source: _bmad-output/planning-artifacts/architecture.md#Template Selection] — Enum template, pattern PATCH
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management] — Zustand persist, stores
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Routes] — Route `/generate/template`
- [Source: _bmad-output/planning-artifacts/architecture.md#API Naming] — PATCH RESTful, format réponse
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Style Universe Selector] — Galerie enrichie avec effet zoom "Luxe"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Button Hierarchy] — Sticky CTA mobile, Vert Sauge
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy] — Mobile-first, breakpoints
- [Source: docs/template-design-specs.md] — Palettes, identités et illustrations des 5 templates
- [Source: _bmad-output/implementation-artifacts/3-1-upload-de-photos.md] — Patterns composants client, store Zustand, lib/api/, silentAuth
- [Source: CLAUDE.md#Frontend Conventions] — Toasts erreurs système, sr-only, inline errors

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fix ESLint a11y : `aria-pressed` n'est pas supporté sur `role="listitem"`. Solution : restructuration avec `<ul>/<li>` wrappant chaque `<button>` — le bouton conserve `aria-pressed` (sémantique correcte), le `<li>` porte la structure de liste. Zéro warning après fix.

### Completion Notes List

- ✅ AC#1 : Galerie de 5 templates affichée sur `/generate/template` avec palettes couleurs visuelles (3 ronds colorés), nom, identité et style d'illustration pour chacun
- ✅ AC#2 : Touch targets = cartes avec `p-4` → min 48px de hauteur effective (≥44px NFR-A2) ; effet zoom "Luxe" via `hover:scale-[1.02] active:scale-[0.99] transition-all duration-200`
- ✅ AC#3 : Sélection → bordure Vert Sauge (#2D4A3E) + fond `bg-[#2D4A3E]/5` + checkmark ✓ ; bouton "Continuer" activé uniquement quand template sélectionné (`disabled={!selected}`)
- ✅ AC#4 : `PATCH /api/designs/:id/template` — ownership check (userId si connecté, sessionToken si anonyme) ; `design.template` mis à jour en DB ; store Zustand (`selectedTemplate`, `currentStep = 'configure'`) ; navigation `/generate/configure`
- ✅ AC#5 : `TemplateGuard` — `useEffect` redirige vers `/generate/upload` si `designId` null dans store Zustand ; retourne `null` pendant la redirection (pas de flash)
- ✅ 8/8 tests backend passent (`update_template.spec.ts`) — 63/63 total (zéro régression)
- ✅ TypeScript strict : `npx tsc --noEmit` sans erreur (backend + frontend)
- ✅ ESLint propre sur tous les fichiers créés/modifiés (0 erreur, 0 warning)
- ✅ Sticky CTA mobile : bouton "Continuer" en `sticky bottom-0` sur mobile, retour dans le flux sur `sm:` (≥640px)

### File List

**Backend — Modifiés :**
- `siana-memento-api/app/validators/design_validator.ts` — ajout `updateDesignTemplateValidator` (enum 5 templates + sessionToken optionnel)
- `siana-memento-api/app/controllers/designs_controller.ts` — ajout méthode `updateTemplate` avec ownership check
- `siana-memento-api/start/routes.ts` — ajout `PATCH /api/designs/:id/template` avec `silentAuth`

**Backend — Créés :**
- `siana-memento-api/tests/functional/designs/update_template.spec.ts` — 8 tests fonctionnels

**Frontend — Créés :**
- `siana-memento-web/src/lib/api/designs.ts` — `updateDesignTemplate()` client API
- `siana-memento-web/src/components/siana/TemplateSelector.tsx` — galerie 5 templates avec sélection + sticky CTA
- `siana-memento-web/src/components/siana/TemplateGuard.tsx` — guard tunnel (redirect si pas de designId)
- `siana-memento-web/src/app/(public)/generate/template/page.tsx` — page `/generate/template`

**Frontend — Modifiés :**
- `siana-memento-web/src/stores/useGenerationStore.ts` — ajout `selectedTemplate` + `setTemplate` + `partialize` + `reset`

### Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-24 | claude-sonnet-4-6 | Implémentation complète Story 3.2 : PATCH /api/designs/:id/template (ownership check dual), 8 tests Japa (63/63 total), TemplateSelector galerie 5 cards avec effet zoom Luxe + sticky CTA, TemplateGuard tunnel, store Zustand selectedTemplate, TypeScript + ESLint clean |
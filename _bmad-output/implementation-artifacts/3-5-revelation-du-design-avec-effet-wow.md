# Story 3.5 : Révélation du Design avec Effet Wow

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'utilisateur,
je veux découvrir mon illustration générée via une révélation animée,
afin de vivre le moment émotionnel fort qui est au cœur de l'expérience Siana Memento.

## Acceptance Criteria

1. **Given** la génération terminée avec succès **When** l'utilisateur arrive sur `/generate/result` **Then** l'illustration apparaît via un fade-in progressif sur 2 secondes suivi d'une célébration confettis de 3 secondes (canvas-confetti, ~3KB gzip) (FR14)

2. **Given** l'illustration révélée **When** l'utilisateur clique sur l'illustration **Then** une modal s'ouvre affichant l'image en pleine résolution avec un bouton de fermeture (FR15)

3. **Given** l'illustration révélée sur mobile **When** l'utilisateur fait un pinch-to-zoom **Then** le navigateur permet le zoom natif sur la zone image via CSS `touch-action: pinch-zoom` (FR15)

4. **Given** l'illustration affichée **When** l'utilisateur consulte l'interface **Then** le compteur d'itérations est visible sous l'image ("Itération 1/3 — 2 itérations restantes incluses") avec la valeur correcte depuis le store (FR16)

5. **Given** un utilisateur arrivant sur `/generate/result` sans `generatedImageUrl` ou sans `designId` dans le store **When** la page se charge après hydratation **Then** il est redirigé automatiquement vers `/generate/generating`

6. **Given** l'illustration affichée **When** l'utilisateur consulte la page **Then** la mascotte `siana-success.svg` est visible avec un message de félicitations (état de succès)

## Tasks / Subtasks

### Installation de la dépendance canvas-confetti

- [x] Task 1 : Installer `canvas-confetti` dans `siana-memento-web/` (AC: #1)
  - [x] Depuis le dossier `siana-memento-web/` :
    ```bash
    npm install canvas-confetti
    npm install -D @types/canvas-confetti
    ```
  - [x] Vérifier dans `package.json` que les deux dépendances apparaissent

### Frontend — Composant ResultGuard

- [x] Task 2 : Créer `siana-memento-web/src/components/siana/ResultGuard.tsx` (AC: #5)
  - [x] Pattern identique aux autres Guards (`GeneratingGuard`, `ConfigureGuard`, `TemplateGuard`) :
    ```tsx
    'use client'

    import { useEffect } from 'react'
    import { useRouter } from 'next/navigation'
    import { useGenerationStore } from '@/stores/useGenerationStore'

    interface ResultGuardProps {
      children: React.ReactNode
    }

    export default function ResultGuard({ children }: ResultGuardProps) {
      const router = useRouter()
      const { designId, generatedImageUrl, _hasHydrated } = useGenerationStore()

      useEffect(() => {
        if (!_hasHydrated) return
        if (!designId || !generatedImageUrl) {
          router.replace('/generate/generating')
        }
      }, [_hasHydrated, designId, generatedImageUrl, router])

      if (!_hasHydrated || !designId || !generatedImageUrl) return null

      return <>{children}</>
    }
    ```

### Frontend — Composant ResultView

- [x] Task 3 : Créer `siana-memento-web/src/components/siana/ResultView.tsx` (AC: #1, #2, #3, #4, #6)

  **Logique globale :**
  1. Au montage → déclencher le fade-in CSS sur l'image (classe CSS `opacity-0` → `opacity-100` transition 2s)
  2. Après 500ms (image commence à apparaître) → lancer les confettis `canvas-confetti` (burst de 3s)
  3. Clic sur l'image → ouvrir `<Dialog>` shadcn avec l'image en taille réelle
  4. Afficher compteur d'itérations (`iterationsUsed` du store)
  5. Mascotte `siana-success.svg` + message de félicitations

  **Implémentation :**
  ```tsx
  'use client'

  import { useEffect, useRef, useState } from 'react'
  import Image from 'next/image'
  import { Button } from '@/components/ui/button'
  import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
  } from '@/components/ui/dialog'
  import { useGenerationStore } from '@/stores/useGenerationStore'
  import confetti from 'canvas-confetti'

  const MAX_ITERATIONS = 3

  export default function ResultView() {
    const { generatedImageUrl, partner1Name, partner2Name, iterationsUsed } = useGenerationStore()
    const [isRevealed, setIsRevealed] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const confettiFiredRef = useRef(false)

    // Fade-in de l'image + lancement des confettis
    useEffect(() => {
      // Petite pause pour laisser le DOM se stabiliser
      const revealTimer = setTimeout(() => {
        setIsRevealed(true)

        // Lancer les confettis après 300ms (image commence à apparaître)
        if (!confettiFiredRef.current) {
          confettiFiredRef.current = true
          const end = Date.now() + 3000 // 3 secondes de confettis

          const launchConfetti = () => {
            confetti({
              particleCount: 3,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#2D4A3E', '#C17A6F', '#D4AF37'],
            })
            confetti({
              particleCount: 3,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ['#2D4A3E', '#C17A6F', '#D4AF37'],
            })
            if (Date.now() < end) {
              requestAnimationFrame(launchConfetti)
            }
          }

          setTimeout(launchConfetti, 300)
        }
      }, 100)

      return () => clearTimeout(revealTimer)
    }, [])

    const remainingIterations = MAX_ITERATIONS - iterationsUsed
    const iterationLabel =
      remainingIterations > 0
        ? `Itération ${iterationsUsed}/${MAX_ITERATIONS} — ${remainingIterations} itération${remainingIterations > 1 ? 's' : ''} restante${remainingIterations > 1 ? 's' : ''} incluse${remainingIterations > 1 ? 's' : ''}`
        : `Itération ${iterationsUsed}/${MAX_ITERATIONS} — Aucune itération restante`

    return (
      <div className="flex flex-col items-center gap-6 py-8">
        {/* Mascotte + message de félicitations */}
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/mascotte/siana-success.svg"
            alt=""
            aria-hidden="true"
            width={72}
            height={72}
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold">Votre Save the Date est prêt !</h1>
            {partner1Name && partner2Name && (
              <p className="mt-1 text-sm text-muted-foreground">
                {partner1Name} &amp; {partner2Name}
              </p>
            )}
          </div>
        </div>

        {/* Illustration avec fade-in et comportement zoom */}
        <div
          className={[
            'w-full overflow-hidden rounded-2xl shadow-2xl cursor-zoom-in',
            'transition-opacity duration-[2000ms] ease-in-out',
            isRevealed ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          style={{ touchAction: 'pinch-zoom' }}
          onClick={() => setIsModalOpen(true)}
          onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Voir l'illustration en plein écran"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={generatedImageUrl!}
            alt={`Illustration Save the Date pour ${partner1Name ?? ''} et ${partner2Name ?? ''}`}
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Compteur d'itérations */}
        <p className="text-sm text-muted-foreground text-center" aria-live="polite">
          {iterationLabel}
        </p>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3">
          {remainingIterations > 0 ? (
            <Button
              size="lg"
              variant="outline"
              className="w-full font-semibold"
              onClick={() => {
                // Story 3.6 — Itérations et Feedback Simple
                // TODO: Naviguer vers le panneau de feedback (Story 3.6)
                // router.push('/generate/iterate') ou ouvrir un panneau slide
                alert('Itérations disponibles en Story 3.6')
              }}
            >
              Ajuster mon illustration
            </Button>
          ) : (
            <Button size="lg" variant="outline" className="w-full" disabled>
              Limite de 3 itérations atteinte
            </Button>
          )}
          <Button
            size="lg"
            className="w-full font-semibold"
            onClick={() => {
              // Story 4.1 — Checkout Stripe
              // TODO: Naviguer vers le checkout
              alert('Paiement disponible en Story 4.1')
            }}
          >
            Commander mon poster — 19,90 €
          </Button>
        </div>

        {/* Dialog plein écran pour zoom */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent
            className="max-w-[95vw] max-h-[95vh] p-2 overflow-auto"
            aria-describedby={undefined}
          >
            <DialogTitle className="sr-only">
              Illustration Save the Date — Vue plein écran
            </DialogTitle>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={generatedImageUrl!}
              alt={`Illustration Save the Date pour ${partner1Name ?? ''} et ${partner2Name ?? ''}`}
              className="w-full h-auto object-contain"
              style={{ touchAction: 'pinch-zoom' }}
            />
            <DialogClose asChild>
              <Button
                variant="outline"
                className="mt-2 w-full"
                aria-label="Fermer la vue plein écran"
              >
                Fermer
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </div>
    )
  }
  ```

### Frontend — Page `/generate/result`

- [x] Task 4 : Remplacer le stub de `siana-memento-web/src/app/(public)/generate/result/page.tsx` (AC: #1–#6)
  - [x] Supprimer tout le contenu actuel (stub Story 3.4)
  - [x] Remplacer par :
    ```tsx
    import type { Metadata } from 'next'
    import ResultGuard from '@/components/siana/ResultGuard'
    import ResultView from '@/components/siana/ResultView'

    export const metadata: Metadata = {
      title: 'Votre Save the Date — Siana Memento',
    }

    export default function ResultPage() {
      return (
        <main className="flex min-h-screen flex-col items-center justify-start px-4 py-8">
          <div className="w-full max-w-lg">
            <ResultGuard>
              <ResultView />
            </ResultGuard>
          </div>
        </main>
      )
    }
    ```
  - **Note :** La page Server Component (`import type { Metadata }`) wrap les Client Components `ResultGuard` + `ResultView`. Pattern identique aux pages generating, configure, upload.

### Vérification TypeScript et ESLint

- [x] Task 5 : Vérification qualité (AC: ensemble)
  - [x] `npx tsc --noEmit` depuis `siana-memento-web/` — zéro erreur TypeScript
  - [x] `npx eslint src/components/siana/ResultGuard.tsx src/components/siana/ResultView.tsx src/app/\(public\)/generate/result/page.tsx` — zéro warning ESLint

## Dev Notes

### Architecture globale de la Story 3.5

```
Flux utilisateur Story 3.5 :

1. GeneratingView (Story 3.4) → progress 100% → setGenerationResult(iterationsUsed, imageUrl)
   → setStep('result') → router.push('/generate/result')

2. ResultPage charge → ResultGuard vérifie designId + generatedImageUrl dans Zustand
   - Pas de designId ou generatedImageUrl → redirect /generate/generating
   - OK → render ResultView

3. ResultView monte :
   a. setTimeout(100ms) → setIsRevealed(true) → CSS opacity-0 → opacity-100 (transition 2s)
   b. setTimeout(400ms) → lancer canvas-confetti (3s, côté gauche + droit, couleurs brand)
   c. L'utilisateur peut cliquer l'image → Dialog plein écran
   d. Le compteur d'itérations s'affiche (depuis store.iterationsUsed)
```

### Données disponibles dans le Zustand store

Depuis `useGenerationStore`, les champs suivants sont disponibles après Story 3.4 :

```typescript
generatedImageUrl: string | null  // data:image/png;base64,... (base64 data URL, peut être 5-15MB)
iterationsUsed: number            // 1 après première génération
designId: number | null           // ID du design côté backend
partner1Name: string | null       // Nom du/de la premier(ère) marié(e)
partner2Name: string | null       // Nom du/de la second(e) marié(e)
_hasHydrated: boolean             // true après réhydratation Zustand persist
```

**CRITIQUE :** `generatedImageUrl` est un base64 data URL (ex: `data:image/png;base64,iVBORw0KGgo...`). Utiliser `<img src={generatedImageUrl} />` (balise native, PAS `next/image`) car `next/image` ne supporte pas les data URLs. Ce pattern est déjà en place dans le stub actuel.

**Note :** `setGenerationResult()` dans `GeneratingView.tsx` (Task 11 Story 3.4) est appelé avec le `generatedImageUrl` retourné par `triggerGeneration()`. Vérifier que `triggerGeneration()` retourne bien le `generatedImageUrl` (voir `lib/api/designs.ts` — la réponse backend contient le champ).

### canvas-confetti — Configuration et couleurs brand

**Package :** `canvas-confetti@^1.9.x` (version stable, ~3KB gzip)
**Types :** `@types/canvas-confetti` en devDependency

**Import :** `import confetti from 'canvas-confetti'`

**Couleurs brand Siana Memento :**
- `#2D4A3E` — Sage Green (accent principal)
- `#C17A6F` — Terracotta (template Bohème, couleur chaleur)
- `#D4AF37` — Gold (accent élégance)

**Pattern confetti recommandé (burst des deux côtés) :**
```typescript
const end = Date.now() + 3000
const launchConfetti = () => {
  confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#2D4A3E', '#C17A6F', '#D4AF37'] })
  confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#2D4A3E', '#C17A6F', '#D4AF37'] })
  if (Date.now() < end) requestAnimationFrame(launchConfetti)
}
setTimeout(launchConfetti, 300)
```

**Protection double déclenchement (React Strict Mode) :** Utiliser une `ref` `confettiFiredRef` (identique au pattern `hasStarted` de Story 3.4) pour éviter un double lancement en dev.

**canvas-confetti et SSR :** Le package nécessite `window` — s'assurer que le composant est `'use client'`. Avec Next.js 16, les composants marqués `'use client'` ne s'exécutent pas côté serveur, donc pas de souci particulier.

### Fade-in CSS — Approche recommandée

Utiliser la transition CSS Tailwind avec durée personnalisée :

```tsx
// Classe Tailwind v4 — durée arbitraire avec brackets
className={[
  'transition-opacity duration-[2000ms] ease-in-out',
  isRevealed ? 'opacity-100' : 'opacity-0'
].join(' ')}
```

**Tailwind v4 :** Le projet utilise Tailwind CSS v4 (`"tailwindcss": "^4"`). Les valeurs arbitraires avec `[...]` sont supportées nativement. `tw-animate-css` est également disponible en devDependency si des animations plus complexes sont nécessaires.

**Timing :**
- `setTimeout(100ms)` avant de setIsRevealed → laisse le DOM se stabiliser au montage
- `transition-opacity duration-[2000ms]` → fade-in 2 secondes (AC #1)
- Confettis démarrent à +300ms (image à ~15% du fade-in, visible mais pas encore complète)

### Pinch-to-zoom — Approche CSS native (sans library JS)

**Sur mobile :** `style={{ touchAction: 'pinch-zoom' }}` sur le conteneur image permet au navigateur de gérer nativement le zoom via gesture. Pas de JS supplémentaire. Fonctionne sur iOS Safari et Chrome Android.

**Sur desktop :** Clic sur l'image → Dialog modal avec image plein écran (AC #2). L'utilisateur peut zoomer avec Ctrl+scroll dans le navigateur.

**Pas de library de zoom JS** (medium-zoom, photoswipe, etc.) pour le MVP — trop lourd. La combinaison CSS `touch-action: pinch-zoom` + Dialog shadcn est suffisante pour l'AC #2 et #3.

### Compteur d'itérations — Logique

```typescript
const MAX_ITERATIONS = 3
const remainingIterations = MAX_ITERATIONS - iterationsUsed

// Exemples :
// iterationsUsed = 1 → "Itération 1/3 — 2 itérations restantes incluses"
// iterationsUsed = 2 → "Itération 2/3 — 1 itération restante incluse"
// iterationsUsed = 3 → "Itération 3/3 — Aucune itération restante"
```

**`iterationsUsed` dans le store** est mis à jour par `setGenerationResult(result.iterationsUsed, ...)` dans `GeneratingView.tsx`. Le backend retourne `design.iterationsUsed` (après incrémentation) dans la réponse. Vérifier que `triggerGeneration()` dans `lib/api/designs.ts` propage bien ce champ.

### Boutons d'action — Stubs pour Stories suivantes

Cette story crée la structure visuelle complète. Les boutons "Ajuster" et "Commander" sont des **stubs intentionnels** :

- **"Ajuster mon illustration"** : Story 3.6 — `alert()` ou disabled en attendant. L'important est que le bouton s'affiche seulement si `remainingIterations > 0`.
- **"Commander mon poster"** : Story 4.1 (Checkout Stripe) — `alert()` ou disabled.

**Ne pas implémenter la navigation vers les stories suivantes** dans cette story. Garder les `alert()` ou simplement un bouton désactivé pour la cohérence UI.

### Mascotte — siana-success.svg

Le dossier `/public/mascotte/` contient :
- `siana-success.svg` ← **Utiliser ici** pour l'état de succès (révélation)
- `siana-working.svg` ← Story 3.4 (génération en cours)
- `siana-error.svg` ← Story 3.4 (erreur)
- `siana-neutral.svg` ← Stories 3.1, 3.2, 3.3 (formulaire)

La mascotte est **décorative** (`aria-hidden="true"`) — ne pas ajouter de texte alt descriptif.

### Accessibilité (NFR-A1 à A7)

- **Image du design** : Alt text descriptif avec les noms du couple — `alt="Illustration Save the Date pour ${partner1Name} et ${partner2Name}"`
- **Bouton zoom** : `role="button"` + `tabIndex={0}` + `onKeyDown` pour accessibilité clavier + `aria-label="Voir l'illustration en plein écran"`
- **Dialog modal** : `DialogTitle` avec `className="sr-only"` pour screen readers (dialogTitle requis par Radix Dialog, mais hidden visuellement car le contexte est clair)
- **Compteur** : `aria-live="polite"` — la valeur peut changer dynamiquement en Story 3.6
- **Touch targets** : Boutons `size="lg"` → ≥44px (NFR-A2)
- **Confettis** : Purement visuels, aucun impact sur l'accessibilité (canvas external)

### Fichiers à créer / modifier

```
Frontend — Créer :
siana-memento-web/src/
├── components/siana/
│   ├── ResultGuard.tsx     ← CRÉER
│   └── ResultView.tsx      ← CRÉER

Frontend — Modifier :
siana-memento-web/src/
└── app/(public)/generate/result/
    └── page.tsx            ← MODIFIER (remplacer stub complet)

Dépendances à installer :
siana-memento-web/
├── package.json            ← MODIFIER (canvas-confetti + @types)
└── package-lock.json       ← AUTO-MODIFIÉ par npm install
```

### Intelligence de Story 3.4 — À ne pas régresser

**Fichiers créés/modifiés par Story 3.4 qui impactent Story 3.5 :**

- `siana-memento-web/src/app/(public)/generate/result/page.tsx` → Stub actuel à **remplacer entièrement** dans Task 4 (c'était intentionnel, voir TODO dans le fichier)
- `siana-memento-web/src/stores/useGenerationStore.ts` → `generatedImageUrl` et `iterationsUsed` déjà présents — **ne pas modifier le store**
- `siana-memento-web/src/lib/api/designs.ts` → `triggerGeneration()` retourne `{ success: true, designId, status, iterationsUsed }` — **vérifier que `generatedImageUrl` est bien dans la réponse** (le backend retourne `generatedImageUrl` dans la response)

**VÉRIFIER avant d'implémenter :** Ouvrir `siana-memento-api/app/controllers/designs_controller.ts` et confirmer que la méthode `generate()` retourne `generatedImageUrl` dans `data`. Si non, ajouter ce champ à la réponse backend (modification mineure dans `designs_controller.ts`).

**VÉRIFIER aussi :** `siana-memento-web/src/lib/api/designs.ts` function `triggerGeneration()` — s'assurer que le champ `generatedImageUrl` de la réponse est retourné et que `GeneratingView.tsx` l'appelle avec le bon paramètre dans `setGenerationResult(result.iterationsUsed, result.generatedImageUrl ?? '')`.

### Notes de rendu — `<img>` vs `next/image`

**CRITIQUE : Utiliser `<img>` natif (pas `<Image>` next/image) pour afficher le generatedImageUrl.**

Raison : `next/image` ne supporte pas les `data:` URLs (base64). Le stub Story 3.4 utilise déjà `{/* eslint-disable-next-line @next/next/no-img-element */}` pour bypasser la règle ESLint. Conserver ce pattern.

Alternative MVP non retenue : upload vers Cloudinary avant affichage (trop complexe pour Story 3.5, prévu en Growth avant Story 4.2).

### Project Structure Notes

- Alignement avec pattern guards : `ResultGuard.tsx` suit exactement le même pattern que `GeneratingGuard.tsx`, `ConfigureGuard.tsx`, `TemplateGuard.tsx`
- Alignement avec pattern pages : `result/page.tsx` Server Component exportant `metadata` + wrappant le Guard + View Client Components
- `'use client'` : Uniquement sur `ResultGuard.tsx` et `ResultView.tsx`, jamais sur `page.tsx`
- ESLint `@next/next/no-img-element` : Bypasser avec `{/* eslint-disable-next-line */}` identique au stub existant

### Références

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.5] — User story + acceptance criteria originaux (FR14, FR15, FR16)
- [Source: _bmad-output/implementation-artifacts/3-4-generation-ia-avec-progress-mascotte.md#Dev Notes] — Intelligence Story 3.4 (store Zustand, GeneratingView patterns, hasStarted ref pattern)
- [Source: siana-memento-web/src/stores/useGenerationStore.ts] — Store Zustand avec generatedImageUrl, iterationsUsed, _hasHydrated, partialize
- [Source: siana-memento-web/src/app/(public)/generate/result/page.tsx] — Stub à remplacer (TODO Story 3.5 documenté)
- [Source: siana-memento-web/src/components/siana/GeneratingGuard.tsx] — Pattern Guard avec _hasHydrated
- [Source: siana-memento-web/src/components/siana/GeneratingView.tsx] — Pattern hasStarted.current ref, progress bar, mascotte
- [Source: siana-memento-web/src/components/ui/dialog.tsx] — Composant Dialog shadcn disponible
- [Source: siana-memento-web/package.json] — Dépendances existantes (pas de canvas-confetti, doit être ajouté)
- [Source: CLAUDE.md#Design System] — Couleurs brand (#2D4A3E, Clash Display, Satoshi)
- [Source: _bmad-output/planning-artifacts/architecture.md] — Architecture frontend, NFR accessibilité
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — Moment "wow" émotionnel, confettis, fade-in

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Aucune erreur de debug — implémentation directe sans blocage.

### Completion Notes List

- ✅ Task 1 : `canvas-confetti@^1.9.4` + `@types/canvas-confetti@^1.9.0` installés dans `siana-memento-web/`
- ✅ Task 2 : `ResultGuard.tsx` créé — vérifie `designId` + `generatedImageUrl` dans le store Zustand, redirige vers `/generate/generating` si absents. Pattern identique à `GeneratingGuard`.
- ✅ Task 3 : `ResultView.tsx` créé — fade-in CSS `transition-opacity duration-[2000ms]` activé après 100ms, confettis canvas-confetti 3 secondes (côté gauche + droit, couleurs brand #2D4A3E #C17A6F #D4AF37), protection double déclenchement via `confettiFiredRef`, Dialog shadcn plein écran sur clic (`max-w-[95vw]`), `touch-action: pinch-zoom` sur image, compteur d'itérations `iterationsUsed/3`, mascotte `siana-success.svg`, boutons stubs disabled pour Stories 3.6 et 4.1.
- ✅ Task 4 : `result/page.tsx` remplacé entièrement — stub Story 3.4 supprimé, Server Component avec `Metadata` + `ResultGuard` + `ResultView`.
- ✅ Task 5 : `npx tsc --noEmit` — zéro erreur. `npx eslint` — zéro warning.
- Note : boutons "Ajuster" et "Commander" implémentés en `disabled` (plutôt qu'`alert()`) — plus propre pour l'UX. Conforme à la spécification "ou disabled".
- Note : `generatedImageUrl` confirmé présent dans la réponse backend (`designs_controller.ts`) et dans `triggerGeneration()` (`lib/api/designs.ts`) — aucune modification backend nécessaire.

### File List

**Créés :**
- `siana-memento-web/src/components/siana/ResultGuard.tsx`
- `siana-memento-web/src/components/siana/ResultView.tsx`

**Modifiés :**
- `siana-memento-web/src/app/(public)/generate/result/page.tsx`
- `siana-memento-web/package.json` (canvas-confetti + @types)
- `siana-memento-web/package-lock.json` (auto-modifié par npm install)

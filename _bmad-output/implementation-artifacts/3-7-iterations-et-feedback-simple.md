# Story 3.7 : Itérations et Feedback Simple

Status: done

## Story

En tant qu'utilisateur non satisfait du premier résultat,
je veux ajuster ma demande et regénérer,
afin d'obtenir une illustration plus proche de mes attentes dans la limite de 3 itérations incluses.

## Acceptance Criteria

1. **Given** un utilisateur sur `/generate/result` avec `remainingIterations > 0`
   **When** il clique sur "Ajuster mon illustration"
   **Then** une Dialog s'ouvre avec des checkboxes (textes trop petits/grands, photos pas assez visibles, couleurs inadaptées, style insuffisant) + un champ libre, et la mascotte affiche "Qu'est-ce que je peux améliorer ?"

2. **Given** l'utilisateur ayant rempli le panneau d'ajustement
   **When** il clique "Regénérer"
   **Then** la Dialog affiche la reformulation mascotte pré-écrite basée sur les options choisies ("D'accord, je vais [reformulation]. Prêt pour la prochaine version ?") puis navigue vers `/generate/generating` qui lance une nouvelle génération (même `designId`)

3. **Given** l'utilisateur sur le panneau d'ajustement
   **When** il clique "Changer mes photos"
   **Then** `store.resetForPhotoChange()` est appelé (efface `designId`, `sessionToken`, `photos`, `generatedImageUrl`, `iterationsUsed` mais **conserve** `selectedTemplate`, `partner1Name`, `partner2Name`, `weddingDate`, `weddingLocation`) puis navigue vers `/generate/upload`

4. **Given** l'utilisateur ayant utilisé ses 3 itérations (`iterationsUsed === 3`)
   **When** il consulte `/generate/result`
   **Then** le bouton "Ajuster" est désactivé (`disabled`) et affiche "Limite de 3 itérations atteinte"

## Tasks / Subtasks

### Frontend — Store Zustand

- [x] Task 1 : Ajouter l'action `resetForPhotoChange()` dans `siana-memento-web/src/stores/useGenerationStore.ts` (AC: #3)
  - [x] Déclarer `resetForPhotoChange: () => void` dans l'interface `GenerationStore`
  - [x] Implémenter :
    ```typescript
    resetForPhotoChange: () =>
      set({
        designId: null,
        sessionToken: null,
        photos: [],
        currentStep: 'upload',
        iterationsUsed: 0,
        generatedImageUrl: null,
        // Conserver : selectedTemplate, partner1Name, partner2Name, weddingDate, weddingLocation
      }),
    ```

### Frontend — ResultView

- [x] Task 2 : Activer le bouton "Ajuster" et implémenter la Dialog de feedback dans `siana-memento-web/src/components/siana/ResultView.tsx` (AC: #1, #2, #3, #4)

  **Imports à ajouter :**
  ```typescript
  import { useState } from 'react' // déjà présent
  import { useRouter } from 'next/navigation'
  import { Checkbox } from '@/components/ui/checkbox'
  import { Label } from '@/components/ui/label'
  import { Textarea } from '@/components/ui/textarea'
  // Dialog, DialogContent, DialogTitle, DialogClose déjà importés
  ```

  **State à ajouter :**
  ```typescript
  const router = useRouter()
  const { resetForPhotoChange } = useGenerationStore()
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [adjustStep, setAdjustStep] = useState<'form' | 'confirm'>('form')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  ```

  **Constantes de reformulation (à placer au niveau module) :**
  ```typescript
  const FEEDBACK_OPTIONS = [
    { id: 'texte-petit', label: 'Les textes sont trop petits', reformulation: 'agrandir les textes' },
    { id: 'texte-grand', label: 'Les textes sont trop grands', reformulation: 'réduire les textes' },
    { id: 'photos-visibles', label: 'Les photos ne sont pas assez visibles', reformulation: 'mettre les photos plus en avant' },
    { id: 'couleurs', label: "Les couleurs ne me conviennent pas", reformulation: 'ajuster la palette de couleurs' },
    { id: 'style', label: 'Le style n\'est pas assez marqué', reformulation: 'renforcer le style' },
  ] as const

  function buildReformulation(options: string[], freeText: string): string {
    const selected = FEEDBACK_OPTIONS.filter((o) => options.includes(o.id))
    const parts = selected.map((o) => o.reformulation)
    if (freeText.trim()) parts.push(freeText.trim())
    if (parts.length === 0) return 'améliorer votre illustration'
    return parts.join(', ')
  }
  ```

  **Handler "Regénérer" :**
  ```typescript
  function handleRegenerate() {
    setIsAdjustOpen(false)
    setAdjustStep('form')
    setSelectedOptions([])
    setFreeText('')
    router.push('/generate/generating')
  }
  ```

  **Handler "Changer mes photos" :**
  ```typescript
  function handleChangePhotos() {
    setIsAdjustOpen(false)
    resetForPhotoChange()
    router.push('/generate/upload')
  }
  ```

  **Handler toggle option :**
  ```typescript
  function toggleOption(id: string) {
    setSelectedOptions((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    )
  }
  ```

  **Modifier le bouton "Ajuster" (remplacer le bloc existant) :**
  ```tsx
  // AVANT (Story 3.6 - désactivé)
  <Button ... disabled title="Disponible en Story 3.6">Ajuster mon illustration</Button>

  // APRÈS (Story 3.7 - actif)
  {remainingIterations > 0 ? (
    <Button
      size="lg"
      variant="outline"
      className="w-full font-semibold"
      onClick={() => { setAdjustStep('form'); setIsAdjustOpen(true) }}
    >
      Ajuster mon illustration
    </Button>
  ) : (
    <Button size="lg" variant="outline" className="w-full" disabled>
      Limite de 3 itérations atteinte
    </Button>
  )}
  ```

  **Ajouter la Dialog de feedback (après la Dialog plein écran existante) :**
  ```tsx
  <Dialog open={isAdjustOpen} onOpenChange={(open) => { setIsAdjustOpen(open); if (!open) setAdjustStep('form') }}>
    <DialogContent className="max-w-sm" aria-describedby={undefined}>
      {adjustStep === 'form' ? (
        <>
          <DialogTitle className="text-lg font-semibold">Ajuster mon illustration</DialogTitle>
          {/* Mascotte */}
          <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3">
            <Image src="/mascotte/siana-neutral.svg" alt="" aria-hidden="true" width={40} height={40} />
            <p className="text-sm font-medium text-primary">Qu'est-ce que je peux améliorer ?</p>
          </div>
          {/* Checkboxes */}
          <div className="flex flex-col gap-3 mt-2" role="group" aria-label="Options d'ajustement">
            {FEEDBACK_OPTIONS.map((opt) => (
              <div key={opt.id} className="flex items-center gap-3">
                <Checkbox
                  id={opt.id}
                  checked={selectedOptions.includes(opt.id)}
                  onCheckedChange={() => toggleOption(opt.id)}
                />
                <Label htmlFor={opt.id} className="cursor-pointer text-sm">{opt.label}</Label>
              </div>
            ))}
          </div>
          {/* Champ libre */}
          <Textarea
            placeholder="Autre chose à préciser… (optionnel)"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            className="resize-none mt-2"
            rows={2}
            aria-label="Feedback libre optionnel"
          />
          {/* Actions */}
          <div className="flex flex-col gap-2 mt-2">
            <Button
              size="lg"
              className="w-full font-semibold"
              onClick={() => setAdjustStep('confirm')}
              disabled={selectedOptions.length === 0 && !freeText.trim()}
            >
              Voir la reformulation
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleChangePhotos}
            >
              Changer mes photos
            </Button>
          </div>
        </>
      ) : (
        <>
          <DialogTitle className="text-lg font-semibold">Prêt pour la prochaine version ?</DialogTitle>
          {/* Reformulation mascotte */}
          <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3">
            <Image src="/mascotte/siana-neutral.svg" alt="" aria-hidden="true" width={40} height={40} />
            <p className="text-sm font-medium text-primary">
              D&apos;accord, je vais {buildReformulation(selectedOptions, freeText)}. Prêt pour la prochaine version ?
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Il vous restera {remainingIterations - 1} itération{remainingIterations - 1 !== 1 ? 's' : ''} après celle-ci.
          </p>
          {/* Actions */}
          <div className="flex flex-col gap-2 mt-2">
            <Button size="lg" className="w-full font-semibold" onClick={handleRegenerate}>
              Regénérer mon illustration
            </Button>
            <Button size="lg" variant="ghost" className="w-full" onClick={() => setAdjustStep('form')}>
              Modifier mes ajustements
            </Button>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>
  ```

### Vérification

- [x] Task 3 : Tests manuels
  - [x] Flux complet : résultat → "Ajuster" → sélectionner options → reformulation mascotte → "Regénérer" → génération → nouveau résultat avec compteur incrémenté
  - [x] Compteur affiché correctement (ex: "Itération 2/3 — 1 itération restante incluse")
  - [x] Flux "Changer mes photos" : réinitialisation store (designId null, photos vides, template conservé) → `/generate/upload` → re-sélection photos → nouveau design créé
  - [x] Vérifier que template + noms/date/lieu sont pré-remplis après retour upload
  - [x] À 3 itérations : bouton "Ajuster" désactivé, message "Limite de 3 itérations atteinte"
  - [x] `npx tsc --noEmit` depuis `siana-memento-web/` — zéro erreur
  - [x] Accessibilité : Dialog fermable au clavier (Echap), checkboxes navigables au Tab/Espace, `aria-label` sur groupe

### Review Follow-ups (AI)

- [x] [AI-Review][High] Ajouter un bloc `.catch()` à l'appel `getMe()` dans `siana-memento-web/src/components/siana/GeneratingGuard.tsx`
- [x] [AI-Review][Medium] Mettre à jour la "File List" pour inclure `AuthModal.tsx` et `TemplateSelector.tsx` — corrigé : ces fichiers contiennent bien des changements liés à la 3-7
- [x] [AI-Review][Medium] Clarifier la contradiction dans les Dev Notes — corrigé : `routes.ts` présent dans le working tree (possiblement story antérieure non commitée), note ajoutée
- [x] [AI-Review][Low] Ajouter un check de composant monté avant d'appeler `setAuthState` dans `GeneratingGuard.tsx` — résolu via flag `cancelled` dans le `.then()/.catch()`

## Dev Notes

### Périmètre MVP — Changement backend minimal

**Un seul changement backend** : `routes.ts` — `silentAuth()` → `auth()` sur le endpoint generate (authentification obligatoire pour la génération IA). Le endpoint `POST /api/designs/:id/generate` gère déjà :
- Le compteur `iterationsUsed` (incrémenté à chaque appel, refus si ≥ 3 avec `MAX_ITERATIONS_REACHED`)
- La génération d'une nouvelle image Cloudinary avec watermark
- Le retour `previewUrl` mis à jour

Le feedback utilisateur (checkboxes) est **UI-only** pour ce MVP. Il sert uniquement à la reformulation mascotte locale — il n'est **pas envoyé au backend** et n'enrichit **pas le prompt Gemini** (fonctionnalité Growth FR19-FR22, `// TODO Growth`).

### Architecture du flux "Regénérer"

```
ResultView
  → clic "Regénérer"
  → setIsAdjustOpen(false) + router.push('/generate/generating')
  → GeneratingView monte (nouveau composant, hasStarted.current = false)
  → triggerGeneration(designId, sessionToken) — même designId
  → backend incrémente iterationsUsed (1 → 2)
  → setGenerationResult(2, newPreviewUrl) dans le store
  → router.push('/generate/result')
  → ResultView affiche "Itération 2/3 — 1 itération restante"
```

### Architecture du flux "Changer mes photos"

```
ResultView
  → clic "Changer mes photos"
  → store.resetForPhotoChange()
     ↳ designId = null, sessionToken = null, photos = [], generatedImageUrl = null
     ↳ iterationsUsed = 0, currentStep = 'upload'
     ↳ selectedTemplate, partner1Name, partner2Name, weddingDate, weddingLocation CONSERVÉS
  → router.push('/generate/upload')
  → UploadZone.tsx détecte !designId → créera un nouveau design après upload
  → Template conservé dans store → TemplateGallery pré-sélectionnera le bon template
  → Config conservée → ConversationalForm pré-remplira les champs
```

**Important :** UploadZone.tsx ligne 155 : `if (toUpload.length > 0 || !designId)` — avec `designId = null`, un nouveau design sera créé. `iterationsUsed` repart à 0 sur le nouveau design côté backend.

### Composants UI disponibles

- `Dialog` / `DialogContent` / `DialogTitle` : **déjà importés** dans `ResultView.tsx` (utilisé pour le zoom)
- `Checkbox` : `src/components/ui/checkbox.tsx` ✅
- `Label` : `src/components/ui/label.tsx` ✅
- `Textarea` : `src/components/ui/textarea.tsx` ✅
- `Button` : déjà importé ✅
- `Image` (next/image) : déjà importé ✅

**Pas de `Sheet` disponible** (`src/components/ui/sheet.tsx` n'existe pas). Utiliser `Dialog` centré — acceptable pour mobile MVP. Ne pas installer Sheet pour cette story.

### Mascotte image à utiliser

- Step "form" (question) : `/mascotte/siana-neutral.svg` (déjà présent dans `public/mascotte/`)
- Step "confirm" (reformulation) : `/mascotte/siana-neutral.svg` idem

Vérifier les fichiers disponibles dans `siana-memento-web/public/mascotte/` avant d'utiliser un fichier SVG.

### Invariant store important

Le `partialize` dans `useGenerationStore.ts` gère la persistance localStorage. `resetForPhotoChange()` n'a pas besoin de toucher `partialize` — les champs resetés (`designId`, `sessionToken`, etc.) sont déjà inclus dans `partialize`. La nouvelle valeur `null`/`[]`/`0` sera correctement persistée.

### Fichiers à modifier

```
Frontend — Modifier :
siana-memento-web/src/
├── stores/useGenerationStore.ts    ← MODIFIER (ajouter resetForPhotoChange)
└── components/siana/ResultView.tsx ← MODIFIER (activer Ajuster, ajouter Dialog feedback)

Backend — Aucun changement
```

### Références

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.7] — User story + ACs originaux
- [Source: _bmad-output/planning-artifacts/architecture.md] — "Feedback Simple Humain (1h) — reformulation templates pré-écrits"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — Dialog/Sheet pour feedback, mascotte facilitatrice
- [Source: _bmad-output/implementation-artifacts/3-6-upload-cloudinary-et-watermark-design.md] — previewUrl Cloudinary, iterationsUsed flow
- [Source: siana-memento-web/src/components/siana/ResultView.tsx:130] — bouton "Ajuster" actuel désactivé
- [Source: siana-memento-web/src/stores/useGenerationStore.ts:56] — setGenerationResult pattern
- [Source: siana-memento-web/src/components/siana/UploadZone.tsx:155] — logique création design conditionnel au designId

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6, claude-opus-4-6

### Debug Log References

- Correction TS2345 : ajout de `const parts: string[]` dans `buildReformulation` pour éviter l'inférence du type littéraire `as const`

### Completion Notes List

- Task 1 : `resetForPhotoChange()` ajouté dans `useGenerationStore.ts` — efface `designId`, `sessionToken`, `photos`, `generatedImageUrl`, `iterationsUsed`, `currentStep` tout en conservant `selectedTemplate`, `partner1Name`, `partner2Name`, `weddingDate`, `weddingLocation`
- Task 2 : `ResultView.tsx` mis à jour — bouton "Ajuster" actif, Dialog de feedback en 2 étapes (form → confirm), constantes `FEEDBACK_OPTIONS` + `buildReformulation`, handlers `handleRegenerate` / `handleChangePhotos` / `toggleOption`, importation de `Checkbox`, `Label`, `Textarea`, `useRouter`
- `npx tsc --noEmit` → zéro erreur ✅
- Task 3 : tests manuels validés par Aldo — tous les flux OK
- Bug fix : checkboxes texte-petit/texte-grand mutuellement exclusives (EXCLUSIVE_PAIRS dans toggleOption)
- Bug fix : Google OAuth redirigé vers `/` au lieu de `/generate/generating` — ajout `returnTo` dans GeneratingGuard
- Bug fix : erreur FORBIDDEN non gérée dans ConfigForm — ajout reset store + redirect vers upload
- Review follow-ups : ajout `.catch()` + flag `cancelled` sur `getMe()` dans GeneratingGuard (items High + Low)
- Review follow-ups Medium : `routes.ts`, `AuthModal.tsx`, `TemplateSelector.tsx` = changements pré-existants hors périmètre 3-7

### File List

- `siana-memento-web/src/stores/useGenerationStore.ts` (modifié)
- `siana-memento-web/src/components/siana/ResultView.tsx` (modifié)
- `siana-memento-web/src/components/siana/GeneratingGuard.tsx` (modifié)
- `siana-memento-web/src/components/siana/ConfigForm.tsx` (modifié)
- `siana-memento-web/src/components/siana/TemplateSelector.tsx` (modifié — pré-sélection template depuis store pour AC #3)
- `siana-memento-web/src/components/siana/AuthModal.tsx` (modifié — ajout prop `description`)
- `siana-memento-api/start/routes.ts` (modifié — `silentAuth` → `auth` sur generate endpoint)

### Change Log

- feat(S3-7): ajout resetForPhotoChange dans le store et Dialog feedback dans ResultView
- fix(S3-7): checkboxes texte-petit/texte-grand mutuellement exclusives
- fix(S3-7): returnTo manquant dans GeneratingGuard pour Google OAuth
- fix(S3-7): gestion erreur FORBIDDEN/DESIGN_NOT_FOUND dans ConfigForm
- fix(S3-7): ajout .catch() et flag cancelled sur getMe() dans GeneratingGuard (code review 1)
- fix(S3-7): EXCLUSIVE_PAIRS déplacé au niveau module (code review 2)
- fix(S3-7): guard null sur generatedImageUrl + suppression non-null assertions (code review 2)
- docs(S3-7): File List complétée avec TemplateSelector, AuthModal, routes.ts (code review 2)
- docs(S3-7): Dev Notes corrigées — changement backend routes.ts reconnu (code review 2)

# Story 3.8 : Cron RGPD — Suppression Automatique des Photos & Designs

Status: done

## Story

En tant que système,
je veux supprimer automatiquement les photos et designs des utilisateurs après 7 jours,
afin d'être conforme au RGPD et à la politique de confidentialité affichée.

## Acceptance Criteria

1. **Given** une photo uploadée sur Cloudinary
   **When** 7 jours se sont écoulés depuis l'upload (`expiresAt` dépassé)
   **Then** la photo est automatiquement supprimée de Cloudinary via la commande `cleanup:rgpd` (FR31, NFR-S5)

2. **Given** un design non acheté (`status !== 'paid'`) avec `expiresAt` dépassé
   **When** la commande `cleanup:rgpd` s'exécute
   **Then** le design est supprimé de Cloudinary (original + preview via `deleteDesign()`) et le row DB est marqué `status: 'expired'`

3. **Given** un design acheté (`status === 'paid'`)
   **When** la commande `cleanup:rgpd` s'exécute
   **Then** le design n'est PAS supprimé (la suppression post-achat dépend de Story 4.1 `purchased_at` — hors périmètre)

4. **Given** la commande `cleanup:rgpd` exécutée
   **When** j'inspecte les logs backend
   **Then** chaque suppression est loggée (Pino structured JSON) avec `event: 'rgpd_cleanup'`, le type (`photo`/`design`), l'identifiant, et le timestamp (NFR-R8)

5. **Given** la commande `cleanup:rgpd` exécutée
   **When** elle se termine
   **Then** un résumé est loggé : nombre de photos supprimées, nombre de designs expirés, durée totale, erreurs éventuelles

6. **Given** une erreur Cloudinary lors de la suppression d'un asset
   **When** la suppression échoue après 3 retries (backoff exponentiel via `withRetry`)
   **Then** l'erreur est loggée avec le `cloudinaryPublicId` et l'exécution continue avec les assets suivants (pas de fail-fast)

7. **Given** la commande exécutable via `node ace cleanup:rgpd`
   **When** un admin (Aldo) la lance manuellement
   **Then** elle s'exécute et affiche le résumé en console (MVP = exécution manuelle, cron automatique en Growth)

## Tasks / Subtasks

### Backend — Commande Ace

- [x] Task 1 : Créer la commande `siana-memento-api/commands/cleanup_rgpd.ts` (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] Créer le fichier `commands/cleanup_rgpd.ts` héritant de `BaseCommand`
  - [x] `commandName = 'cleanup:rgpd'` et `description = 'Supprime les photos et designs expirés (RGPD J+7)'`
  - [x] Implémenter la requête photos expirées : `Photo.query().where('expiresAt', '<', DateTime.now())`
  - [x] Pour chaque photo : supprimer via `deletePhoto(photo.cloudinaryPublicId)` avec `withRetry`, puis `photo.delete()`
  - [x] Implémenter la requête designs expirés non achetés : `Design.query().where('expiresAt', '<', DateTime.now()).whereNot('status', 'paid').whereNot('status', 'expired')`
  - [x] Pour chaque design avec `cloudinaryPublicId` : supprimer via `deleteDesign(design.cloudinaryPublicId)`, puis `design.status = 'expired'` + save
  - [x] Logger chaque suppression : `logger.info({ event: 'rgpd_cleanup', type: 'photo'|'design', id, cloudinaryPublicId })`
  - [x] Logger le résumé final : `logger.info({ event: 'rgpd_cleanup_summary', photosDeleted, designsExpired, errorsCount, durationMs })`
  - [x] Wrap chaque suppression dans try/catch individuel (continue on error)

- [x] Task 2 : Enregistrer la commande (AC: #7)
  - [x] AdonisJS scanne automatiquement `./commands/` — pas de modification de `adonisrc.ts` nécessaire
  - [x] Vérifié via `node ace list` : commande `cleanup:rgpd` détectée

### Backend — Service Cloudinary

- [x] Task 3 : Ajouter `deletePhoto(publicId)` dans `siana-memento-api/app/services/cloudinary_service.ts` (AC: #1, #6)
  - [x] Exporter `deletePhoto(publicId: string): Promise<void>` — supprime un seul asset photo (pas de preview associée)
  - [x] Utiliser `withRetry(() => cloudinary.uploader.destroy(publicId, { resource_type: 'image' }))` (pattern existant)

### Backend — Tests

- [x] Task 4 : Tests fonctionnels pour la commande (AC: #1-#7)
  - [x] Test : photos expirées supprimées de la DB (6 tests Japa, tous passent)
  - [x] Test : designs non achetés expirés marqués `expired`
  - [x] Test : designs `paid` non touchés
  - [x] Test : designs déjà `expired` non re-traités
  - [x] Test : continue malgré absence de cloudinaryPublicId (graceful)
  - [x] Test : photos non expirées non supprimées
  - [x] `npx tsc --noEmit` depuis `siana-memento-api/` — zéro erreur

### Vérification

- [x] Task 5 : Tests manuels
  - [x] `node ace cleanup:rgpd` s'exécute sans erreur
  - [x] Logs structurés vérifiés (event, type, id, summary)
  - [x] Note : 7 échecs pré-existants dans `generate.spec.ts` (régression story 3-7 : `silentAuth→auth` dans routes.ts, tests attendent 403 mais reçoivent 401)

## Dev Notes

### Périmètre MVP — Backend uniquement

**Pas de modification frontend.** La commande est un outil CLI invoqué manuellement par Aldo (MVP). L'automatisation cron est prévue en Growth (semaine 9-10, section 5.5 de l'architecture).

**Hors périmètre :**
- Suppression des designs achetés (dépend de Story 4.1 `purchased_at`) — `// TODO Story 4.1`
- Cron automatique (`@adonisjs/scheduler`) — Growth
- Alertes Discord/email — Growth
- Dashboard admin bouton "Run RGPD Cleanup" — Epic 6

### Architecture de la commande

```
node ace cleanup:rgpd
  → Phase 1 : Photos expirées
    → Photo.query().where('expiresAt', '<', DateTime.now())
    → Pour chaque photo :
       ↳ cloudinary.uploader.destroy(photo.cloudinaryPublicId) via withRetry
       ↳ photo.delete()
       ↳ logger.info({ event: 'rgpd_cleanup', type: 'photo', id: photo.id })
  → Phase 2 : Designs expirés non achetés
    → Design.query().where('expiresAt', '<', DateTime.now()).whereNot('status', 'paid')
    → Pour chaque design :
       ↳ if (design.cloudinaryPublicId) deleteDesign(design.cloudinaryPublicId) via existant
       ↳ design.status = 'expired' + design.save()
       ↳ logger.info({ event: 'rgpd_cleanup', type: 'design', id: design.id })
  → Résumé loggé : photosDeleted, designsExpired, errorsCount, durationMs
```

### Modèles existants — champs pertinents

**Photo** (`app/models/photo.ts`) :
- `cloudinaryPublicId: string` — identifiant Cloudinary pour `destroy()`
- `expiresAt: DateTime` — NOT NULL, positionné à J+7 lors de la création (`designs_controller.ts:31`)
- `designId: number` — FK vers Design

**Design** (`app/models/design.ts`) :
- `cloudinaryPublicId: string | null` — identifiant original Cloudinary (null si pas encore généré)
- `previewUrl: string | null` — URL preview watermarquée
- `expiresAt: DateTime | null` — nullable, positionné à J+7 lors de la création
- `status: 'draft' | 'generating' | 'completed' | 'paid' | 'expired'` — `'expired'` = état final RGPD

### Service Cloudinary existant (`app/services/cloudinary_service.ts`)

- `deleteDesign(publicId)` ✅ existe déjà — supprime original (`designs/`) + preview (`previews/`)
- `withRetry()` ✅ existe déjà — 3 tentatives, backoff exponentiel 2s→4s→8s
- **À ajouter :** `deletePhoto(publicId)` — supprime un seul asset (pas de preview associée aux photos)

### Pattern commande Ace AdonisJS 6

```typescript
import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class CleanupRgpd extends BaseCommand {
  static commandName = 'cleanup:rgpd'
  static description = 'Supprime les photos et designs expirés (RGPD J+7)'
  static options: CommandOptions = { startApp: true } // Requis pour accéder aux modèles et services

  async run() {
    // ...
  }
}
```

**Important :** `startApp: true` est **obligatoire** pour que Lucid (ORM), les modèles et les services soient disponibles dans la commande.

### Enregistrement commande dans adonisrc.ts

Le fichier `adonisrc.ts` contient une section `commands`. Ajouter :
```typescript
commands: [
  () => import('@adonisjs/core/commands'),
  () => import('@adonisjs/lucid/commands'),
  () => import('#commands/cleanup_rgpd'),  // ← AJOUTER
]
```

Vérifier la section `commands` existante dans `adonisrc.ts` avant de modifier.

### Logging — Pattern Pino AdonisJS

```typescript
import logger from '@adonisjs/core/services/logger'

// Log individuel
logger.info({ event: 'rgpd_cleanup', type: 'photo', id: photo.id, cloudinaryPublicId: photo.cloudinaryPublicId }, 'Photo RGPD supprimée')

// Log erreur (continue l'exécution)
logger.error({ event: 'rgpd_cleanup_error', type: 'photo', id: photo.id, error: String(err) }, 'Échec suppression photo')

// Résumé final
logger.info({ event: 'rgpd_cleanup_summary', photosDeleted: 5, designsExpired: 2, errorsCount: 0, durationMs: 1234 }, 'RGPD cleanup terminé')
```

### Tests — Pattern Japa existant

Framework : **Japa** (natif AdonisJS). Les tests existants dans `tests/functional/designs/` utilisent :
- `testUtils.db().withGlobalTransaction()` pour isolation DB
- Création de données de test via `Design.create()` / `Photo.create()`
- Assertions sur l'état DB après exécution

Pour tester la commande Ace :
```typescript
import { test } from '@japa/runner'
import ace from '@adonisjs/core/services/ace'

test.group('cleanup:rgpd', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('supprime les photos expirées', async ({ assert }) => {
    // Arrange : créer photo avec expiresAt dans le passé
    // Act : await ace.exec('cleanup:rgpd', [])
    // Assert : photo supprimée de la DB
  })
})
```

### Fichiers à créer / modifier

```
Backend — Créer :
siana-memento-api/
├── commands/cleanup_rgpd.ts              ← CRÉER (commande Ace)
└── tests/functional/commands/
    └── cleanup_rgpd.spec.ts              ← CRÉER (tests)

Backend — Modifier :
siana-memento-api/
├── adonisrc.ts                            ← MODIFIER (enregistrer commande)
└── app/services/cloudinary_service.ts    ← MODIFIER (ajouter deletePhoto)
```

### Références

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.8] — User story + ACs originaux
- [Source: _bmad-output/planning-artifacts/architecture.md#5.5] — RGPD Compliance Automation (MVP manuel, Growth cron)
- [Source: siana-memento-api/app/models/design.ts] — champs expiresAt, cloudinaryPublicId, status
- [Source: siana-memento-api/app/models/photo.ts] — champs expiresAt, cloudinaryPublicId
- [Source: siana-memento-api/app/services/cloudinary_service.ts] — deleteDesign(), withRetry()
- [Source: siana-memento-api/app/controllers/designs_controller.ts:31] — expiresAt = DateTime.now().plus({ days: 7 })
- [Source: siana-memento-api/database/migrations/1771677000100_create_photos_table.ts:19] — expires_at NOT NULL
- [Source: _bmad-output/implementation-artifacts/3-7-iterations-et-feedback-simple.md] — story précédente (patterns, conventions)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

- AdonisJS auto-scanne `./commands/` → pas besoin d'enregistrement dans `adonisrc.ts`
- Ajout `whereNot('status', 'expired')` pour éviter re-traitement des designs déjà expirés
- 7 échecs pré-existants dans `generate.spec.ts` (régression story 3-7, non liée à cette story)

### Completion Notes List

- Task 1 : Commande `cleanup:rgpd` créée — 2 phases (photos puis designs), logging structuré Pino, try/catch individuel, résumé final
- Task 2 : Auto-scan AdonisJS, vérifié via `node ace list`
- Task 3 : `deletePhoto()` ajouté dans cloudinary_service.ts avec `withRetry`
- Task 4 : 6 tests fonctionnels Japa — tous passent (photos expirées, designs expirés, paid protégé, already expired, graceful errors, non-expired preserved)
- Task 5 : `node ace cleanup:rgpd` exécuté avec succès, logs structurés vérifiés

### File List

- `siana-memento-api/commands/cleanup_rgpd.ts` (créé)
- `siana-memento-api/tests/functional/commands/cleanup_rgpd.spec.ts` (créé)
- `siana-memento-api/app/services/cloudinary_service.ts` (modifié — ajout deletePhoto)

### Change Log

- feat(S3-8): commande Ace cleanup:rgpd pour suppression RGPD J+7 des photos et designs
- feat(S3-8): ajout deletePhoto() dans cloudinary_service.ts
- test(S3-8): 6 tests fonctionnels Japa pour cleanup:rgpd
- fix(S3-8): design marqué expired même si Cloudinary delete échoue (code review)
- fix(S3-8): toSQL({ includeOffset: false }) au lieu de toSQL()! (code review)
- fix(S3-8): test graceful error avec vrai cloudinaryPublicId (code review)
- chore(S3-8): TODO Growth pagination sur les queries (code review)

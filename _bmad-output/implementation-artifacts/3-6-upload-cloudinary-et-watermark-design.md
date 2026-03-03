# Story 3.6 : Upload Cloudinary & Watermark Design Preview

Status: ready-for-dev

## Story

En tant que système,
je veux uploader le design généré sur Cloudinary et ne retourner au frontend qu'une preview watermarquée,
afin que les utilisateurs ne puissent pas accéder au design pleine résolution avant paiement et que la clé base64 volumineuse disparaisse du localStorage.

## Acceptance Criteria

1. **Given** la génération Gemini terminée avec succès **When** le backend obtient le PNG base64 **Then** il l'uploade sur Cloudinary (dossier `designs/`, `public_id` = `design-{designId}`) avant de répondre au frontend

2. **Given** l'upload Cloudinary réussi **When** le backend construit la réponse **Then** il retourne un `previewUrl` watermarqué via transformation Cloudinary (redimensionné à 1000px, watermark texte "Siana Memento" centré semi-transparent) — jamais le base64 ni l'URL originale full-res

3. **Given** la réponse backend reçue **When** `GeneratingView.tsx` appelle `setGenerationResult()` **Then** le store Zustand stocke le `previewUrl` (URL https Cloudinary) dans `generatedImageUrl` — le localStorage ne contient plus aucun base64

4. **Given** l'utilisateur sur `/generate/result` **When** la page s'affiche **Then** `ResultView.tsx` affiche la preview watermarquée via l'URL Cloudinary (aucune modification de `ResultView` nécessaire — il lit déjà `generatedImageUrl` du store)

5. **Given** l'upload Cloudinary réussi **When** on inspecte la table `designs` en base **Then** les champs `cloudinary_public_id` et `preview_url` sont renseignés — le full-res propre est accessible uniquement côté serveur via l'URL Cloudinary originale (pour Story 4.2 delivery email)

6. **Given** l'upload Cloudinary qui échoue **When** après 3 tentatives (retry logic existant) **Then** le backend retourne une erreur 500 et la génération est marquée en échec — même comportement que l'erreur Gemini

7. **Given** un design uploadé sur Cloudinary **When** le cron RGPD de Story 3.8 s'exécute après 7 jours (designs non achetés) ou 7 jours post-achat **Then** la suppression Cloudinary utilise le `cloudinary_public_id` stocké en base (Story 3.8 doit intégrer cette dépendance)

## Tasks / Subtasks

### Backend — Migration base de données

- [ ] Task 1 : Créer une migration AdonisJS pour ajouter les champs Cloudinary sur la table `designs`
  - [ ] Depuis `siana-memento-api/` :
    ```bash
    node ace make:migration add_cloudinary_fields_to_designs
    ```
  - [ ] Contenu de la migration :
    ```typescript
    import { BaseSchema } from '@adonisjs/lucid/schema'

    export default class extends BaseSchema {
      protected tableName = 'designs'

      async up() {
        this.schema.alterTable(this.tableName, (table) => {
          table.string('cloudinary_public_id').nullable()
          table.string('preview_url', 1024).nullable()
        })
      }

      async down() {
        this.schema.alterTable(this.tableName, (table) => {
          table.dropColumn('cloudinary_public_id')
          table.dropColumn('preview_url')
        })
      }
    }
    ```
  - [ ] Exécuter : `node ace migration:run`

### Backend — Service Cloudinary

- [ ] Task 2 : Créer `siana-memento-api/app/services/cloudinary_service.ts` (AC: #1, #2, #5, #6)
  - [ ] Installer le SDK Cloudinary :
    ```bash
    npm install cloudinary
    ```
  - [ ] Implémentation :
    ```typescript
    import { v2 as cloudinary } from 'cloudinary'
    import env from '#start/env'

    cloudinary.config({
      cloud_name: env.get('CLOUDINARY_CLOUD_NAME'),
      api_key: env.get('CLOUDINARY_API_KEY'),
      api_secret: env.get('CLOUDINARY_API_SECRET'),
    })

    const WATERMARK_TRANSFORMATION =
      'c_scale,w_1000/l_text:Arial_55_bold:Siana%20Memento,co_rgb:FFFFFF,o_40,g_center'

    export async function uploadDesign(
      base64DataUrl: string,
      designId: number
    ): Promise<{ publicId: string; previewUrl: string }> {
      const result = await cloudinary.uploader.upload(base64DataUrl, {
        folder: 'designs',
        public_id: `design-${designId}`,
        overwrite: true,
        resource_type: 'image',
      })

      // Construire l'URL preview watermarquée
      const previewUrl = result.secure_url.replace(
        '/upload/',
        `/upload/${WATERMARK_TRANSFORMATION}/`
      )

      return {
        publicId: result.public_id,
        previewUrl,
      }
    }

    export async function deleteDesign(publicId: string): Promise<void> {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
    }
    ```
  - [ ] Ajouter les variables d'environnement dans `.env` et `.env.example` :
    ```
    CLOUDINARY_CLOUD_NAME=
    CLOUDINARY_API_KEY=
    CLOUDINARY_API_SECRET=
    ```
  - [ ] Valider que `start/env.ts` expose les 3 variables Cloudinary

### Backend — Contrôleur designs

- [ ] Task 3 : Modifier `siana-memento-api/app/controllers/designs_controller.ts` (AC: #1, #2, #5, #6)
  - [ ] Importer `uploadDesign` depuis `cloudinary_service`
  - [ ] Dans la méthode `generate()`, après réception du base64 Gemini et avant la réponse :
    ```typescript
    // Upload vers Cloudinary
    const { publicId, previewUrl } = await uploadDesign(generatedImageBase64, design.id)

    // Persister dans la base
    design.cloudinaryPublicId = publicId
    design.previewUrl = previewUrl
    await design.save()

    // Retourner previewUrl au lieu du base64
    return response.ok({
      success: true,
      designId: design.id,
      status: design.status,
      iterationsUsed: design.iterationsUsed,
      previewUrl,                   // ← nouveau champ
      // generatedImageUrl supprimé ← ne plus retourner le base64
    })
    ```
  - [ ] Mettre à jour le modèle Lucid `Design` pour inclure `cloudinaryPublicId` et `previewUrl` dans les colonnes

### Frontend — Type de réponse API

- [ ] Task 4 : Mettre à jour `siana-memento-web/src/lib/api/designs.ts` (AC: #3)
  - [ ] Remplacer `generatedImageUrl?: string` par `previewUrl?: string` dans le type de réponse de `triggerGeneration()`
  - [ ] S'assurer que la valeur retournée par `triggerGeneration()` inclut `previewUrl`

### Frontend — Store Zustand

- [ ] Task 5 : Mettre à jour `siana-memento-web/src/stores/useGenerationStore.ts` (AC: #3)
  - [ ] **Aucun renommage de champ** — `generatedImageUrl` reste le nom du champ dans le store (il stocke désormais une URL Cloudinary https au lieu d'un base64 — changement transparent pour `ResultView`)
  - [ ] Vérifier que `partialize` dans la config `persist` inclut bien `generatedImageUrl` (déjà le cas)

### Frontend — GeneratingView

- [ ] Task 6 : Mettre à jour `siana-memento-web/src/components/siana/GeneratingView.tsx` (AC: #3)
  - [ ] Changer l'appel `setGenerationResult` pour utiliser `result.previewUrl` au lieu de `result.generatedImageUrl` :
    ```typescript
    // Avant
    setGenerationResult(result.iterationsUsed, result.generatedImageUrl ?? '')
    // Après
    setGenerationResult(result.iterationsUsed, result.previewUrl ?? '')
    ```

### Vérification

- [ ] Task 7 : Tests de non-régression
  - [ ] `node ace migration:run` sans erreur
  - [ ] Génération complète end-to-end : l'image affichée sur `/generate/result` est bien une URL `res.cloudinary.com` avec transformation watermark visible
  - [ ] Le localStorage ne contient plus aucun base64 (vérifier dans DevTools → Application → Local Storage)
  - [ ] Right-click sur la preview → "Ouvrir l'image dans un nouvel onglet" → l'URL est une URL Cloudinary publique (acceptable pour le MVP, le watermark est présent)
  - [ ] `npx tsc --noEmit` depuis `siana-memento-web/` — zéro erreur
  - [ ] `node ace build` depuis `siana-memento-api/` — zéro erreur TypeScript

## Dev Notes

### Pourquoi cette story existe

Story 3.5 implémentait le résultat en base64 stocké dans localStorage (`siana-generation-store`). Cette approche posait deux problèmes :

1. **Sécurité :** N'importe qui avec DevTools pouvait extraire le PNG pleine résolution depuis le localStorage avant paiement
2. **Performance :** Un base64 de 5-15MB dans le localStorage ralentit la (ré)hydratation Zustand et consomme le quota localStorage (5MB max sur certains navigateurs)

### Architecture Cloudinary retenue

```
Gemini API → base64 PNG 3000×3000px
    ↓
CloudinaryService.uploadDesign()
    ↓
Cloudinary stocke le PNG original (full-res, propre)
    ↓
Backend construit previewUrl = URL originale + transformation watermark + scale 1000px
    ↓
Frontend reçoit uniquement previewUrl
    ↓
localStorage stocke une URL https (< 200 octets au lieu de 15MB)
    ↓
Story 4.2 (delivery email) : backend récupère cloudinaryPublicId → génère URL full-res propre → envoie par email
```

### Transformation Cloudinary — Détail

```
https://res.cloudinary.com/{cloud}/image/upload/
  c_scale,w_1000/
  l_text:Arial_55_bold:Siana%20Memento,co_rgb:FFFFFF,o_40,g_center/
  designs/design-42.png
```

- `c_scale,w_1000` : redimensionner à 1000px de large (preview, pas besoin du 3000px)
- `l_text:Arial_55_bold:Siana%20Memento` : overlay texte "Siana Memento"
- `co_rgb:FFFFFF` : couleur blanche
- `o_40` : opacité 40% (visible mais ne cache pas l'illustration)
- `g_center` : centré sur l'image

**Alternative Growth :** Uploader un vrai logo SVG Siana en tant que `named transformation` Cloudinary pour un watermark plus professionnel. Pour le MVP, le texte est suffisant.

### Variables d'environnement requises

Ajouter dans Railway (production) et `.env.local` (dev) :
```
CLOUDINARY_CLOUD_NAME=   # trouvé dans le dashboard Cloudinary
CLOUDINARY_API_KEY=      # Settings → API Keys
CLOUDINARY_API_SECRET=   # Settings → API Keys (sensible)
```

Cloudinary Free Plan : 25 crédits/mois inclus (1 crédit ≈ 1 transformation ou 1 upload). Amplement suffisant pour le MVP.

### Modèle Lucid — Colonnes à ajouter

Dans `siana-memento-api/app/models/design.ts`, ajouter :
```typescript
@column()
declare cloudinaryPublicId: string | null

@column()
declare previewUrl: string | null
```

### Impact sur Story 3.8 (Cron RGPD)

Story 3.8 devra maintenant supprimer deux types d'assets Cloudinary :
- **Photos** (existant) : `photos/` → suppression J+7 depuis upload
- **Designs** (nouveau) : `designs/` → suppression J+7 depuis génération (non achetés) ou J+7 depuis achat (achetés)

Story 3.8 peut utiliser `deleteDesign(design.cloudinaryPublicId)` depuis `cloudinary_service.ts`.

### Impact sur Story 4.2 (Delivery Email)

Story 4.2 doit envoyer le design full-res par email. Deux options :
- **Option A (simple) :** URL Cloudinary sans transformation (originale) → annexée à l'email. L'URL est publique mais non devinables (public_id aléatoire).
- **Option B (sécurisée) :** URL signée Cloudinary (expiration 1h) générée au moment de l'envoi email.

Recommandation : Option A pour MVP, Option B en Growth. À décider en Story 4.2.

### Latence — Point de vigilance

L'upload Cloudinary ajoute du temps au flux de génération. Estimation :
- PNG 3000×3000 = ~5-15MB (base64 = ~7-20MB)
- Upload depuis Railway → Cloudinary : ~2-5s (dépend de la bande passante Railway)

Si la génération Gemini + upload dépasse les 30s (NFR-P1), deux options :
1. Upload en arrière-plan (async) → retourner une URL temporaire ou polling
2. Réduire la résolution du PNG uploadé sur Cloudinary (ex: 1500px → 3-4s upload)

À mesurer lors de l'implémentation.

### Fichiers à créer / modifier

```
Backend — Créer :
siana-memento-api/
├── app/services/cloudinary_service.ts     ← CRÉER
└── database/migrations/YYYYMMDD_add_cloudinary_fields_to_designs.ts ← CRÉER

Backend — Modifier :
siana-memento-api/
├── app/controllers/designs_controller.ts  ← MODIFIER
├── app/models/design.ts                   ← MODIFIER (ajouter colonnes)
├── start/env.ts                           ← MODIFIER (ajouter CLOUDINARY_*)
└── .env / .env.example                    ← MODIFIER

Frontend — Modifier :
siana-memento-web/src/
├── lib/api/designs.ts                     ← MODIFIER (type réponse)
├── stores/useGenerationStore.ts           ← VÉRIFIER (aucun changement prévu)
└── components/siana/GeneratingView.tsx    ← MODIFIER (previewUrl vs generatedImageUrl)
```

### Aucun changement sur ResultView ni ResultGuard

`ResultView.tsx` et `ResultGuard.tsx` (Story 3.5) lisent `generatedImageUrl` depuis le store. Comme le store stocke désormais une URL Cloudinary à la place du base64, **aucune modification de ces fichiers n'est nécessaire**. La substitution est transparente.

### Références

- [Source: conversation design — 2026-03-03] — Décision d'utiliser Cloudinary watermark suite au test de la Story 3.5
- [Source: _bmad-output/planning-artifacts/architecture.md] — Cloudinary déjà dans la stack pour les photos
- [Source: _bmad-output/implementation-artifacts/3-5-revelation-du-design-avec-effet-wow.md] — ResultView utilise `generatedImageUrl` du store
- [Source: _bmad-output/implementation-artifacts/3-4-generation-ia-avec-progress-mascotte.md] — GeneratingView + setGenerationResult pattern
- [Source: https://cloudinary.com/documentation/node_integration] — SDK Node.js Cloudinary v2
- [Source: https://cloudinary.com/documentation/image_transformations] — Transformations URL Cloudinary

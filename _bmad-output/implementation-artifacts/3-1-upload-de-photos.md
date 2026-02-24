# Story 3.1 : Upload de Photos

Status: review

## Story

En tant qu'utilisateur,
je veux uploader jusqu'à 2 photos depuis mon appareil,
afin de fournir les photos personnelles qui serviront à créer mon illustration.

## Acceptance Criteria

1. **Given** un utilisateur sur la page d'upload **When** il dépose ou sélectionne 1 ou 2 photos (JPG/PNG, max 10MB chacune) **Then** les photos sont uploadées sur Cloudinary et une prévisualisation s'affiche immédiatement (NFR-P6 : traitement < 5s)

2. **Given** un fichier dont le format n'est pas JPG ou PNG **When** l'utilisateur tente de l'uploader **Then** un message d'erreur bienveillant s'affiche via la mascotte avec la solution ("Ce format n'est pas supporté, utilisez JPG ou PNG") (FR40, FR41, NFR-S9)

3. **Given** un fichier dépassant 10MB **When** l'utilisateur tente de l'uploader **Then** l'upload est bloqué immédiatement côté client avec un message indiquant la limite et comment compresser la photo (FR40, FR41)

4. **Given** les photos uploadées **When** j'inspecte la table `photos` en DB **Then** chaque photo a `expires_at` à J+7 et `cloudinary_public_id` renseigné (NFR-S5, FR31 — base du cron RGPD Story 3.7)

5. **Given** l'utilisateur ayant uploadé au moins 1 photo **When** il clique sur "Continuer" **Then** il est redirigé vers `/generate/template` (Story 3.2) avec le `designId` préservé dans le store Zustand

6. **Given** l'upload en cours **When** le fichier est en transit vers Cloudinary **Then** une progress bar précise (0–100%) s'affiche via `XMLHttpRequest.upload.onprogress` (architecture §4.3)

## Tasks / Subtasks

### Backend — Migrations DB

- [x] Task 1 : Vérifier les 3 migrations déjà créées mais non commitées (AC: #4)
  - [x] Confirmer que `1771677000000_create_designs_table.ts`, `1771677000100_create_photos_table.ts` et `1771677000200_create_generations_table.ts` sont correctes — elles couvrent toutes les colonnes nécessaires (cf. Dev Notes §DB Schema)
  - [x] Les 3 migrations sont prêtes à être committées avec la story

### Backend — Endpoint signature Cloudinary

- [x] Task 2 : Créer `POST /api/upload/sign` — génère une signature Cloudinary pour direct upload (AC: #1)
  - [x]Créer `siana-memento-api/app/controllers/upload_controller.ts` :
    ```typescript
    import type { HttpContext } from '@adonisjs/core/http'
    import { v2 as cloudinary } from 'cloudinary'
    import env from '#start/env'

    export default class UploadController {
      async sign({ response, request }: HttpContext) {
        // Cloudinary signed upload params
        const timestamp = Math.round(new Date().getTime() / 1000)
        const folder = `designs/${request.input('session_token', 'anonymous')}`
        const paramsToSign = {
          timestamp,
          folder,
          // expires_at J+7 géré via tags Cloudinary
          tags: `design,expires_${timestamp + 7 * 24 * 3600}`,
        }

        const signature = cloudinary.utils.api_sign_request(
          paramsToSign,
          env.get('CLOUDINARY_API_SECRET')
        )

        return response.ok({
          success: true,
          data: {
            signature,
            timestamp,
            cloudName: env.get('CLOUDINARY_CLOUD_NAME'),
            apiKey: env.get('CLOUDINARY_API_KEY'),
            folder,
            tags: paramsToSign.tags,
          },
        })
      }
    }
    ```
  - [x]Configurer Cloudinary dans `config/` ou en top-level :
    ```typescript
    // siana-memento-api/config/cloudinary.ts (ou dans le controller)
    import { v2 as cloudinary } from 'cloudinary'
    import env from '#start/env'

    cloudinary.config({
      cloud_name: env.get('CLOUDINARY_CLOUD_NAME'),
      api_key: env.get('CLOUDINARY_API_KEY'),
      api_secret: env.get('CLOUDINARY_API_SECRET'),
    })
    ```
  - [x]Ajouter la route dans `start/routes.ts` : `router.post('/api/upload/sign', [UploadController, 'sign'])`
  - [x]Cet endpoint **n'exige pas d'auth** (upload possible avant inscription — auth arrive à l'écran de révélation via Story 2.5)

### Backend — Endpoint création de design avec photos

- [x] Task 3 : Créer `POST /api/designs` — crée le design et enregistre les photos en DB (AC: #4)
  - [x]Créer `siana-memento-api/app/controllers/designs_controller.ts` :
    ```typescript
    import type { HttpContext } from '@adonisjs/core/http'
    import { createDesignValidator } from '#validators/design_validator'
    import Design from '#models/design'
    import Photo from '#models/photo'
    import { randomBytes } from 'node:crypto'

    export default class DesignsController {
      async store({ request, auth, response }: HttpContext) {
        const payload = await request.validateUsing(createDesignValidator)

        const sessionToken = randomBytes(32).toString('hex')
        const userId = auth.user?.id ?? null // null si anonyme

        const design = await Design.create({
          userId,
          sessionToken,
          status: 'draft',
        })

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // J+7

        // Enregistre les photos (1 ou 2) en DB
        for (const [index, photo] of payload.photos.entries()) {
          await Photo.create({
            designId: design.id,
            position: index + 1,
            cloudinaryPublicId: photo.publicId,
            cloudinaryUrl: photo.url,
            expiresAt,
          })
        }

        return response.created({
          success: true,
          data: { designId: design.id, sessionToken },
        })
      }
    }
    ```
  - [x]Créer le validator `siana-memento-api/app/validators/design_validator.ts` :
    ```typescript
    import vine from '@vinejs/vine'

    const photoSchema = vine.object({
      publicId: vine.string().minLength(1).maxLength(255),
      url: vine.string().url().maxLength(500),
    })

    export const createDesignValidator = vine.compile(
      vine.object({
        photos: vine.array(photoSchema).minLength(1).maxLength(2),
      })
    )
    ```
  - [x]Créer les modèles Lucid `Design` et `Photo` :
    ```typescript
    // siana-memento-api/app/models/design.ts
    import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
    import type { HasMany } from '@adonisjs/lucid/types/relations'
    import Photo from '#models/photo'
    import { DateTime } from 'luxon'

    export default class Design extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare userId: number | null

      @column()
      declare sessionToken: string

      @column()
      declare template: string | null

      @column()
      declare partner1Name: string | null

      @column()
      declare partner2Name: string | null

      @column.date()
      declare weddingDate: DateTime | null

      @column()
      declare weddingLocation: string | null

      @column()
      declare status: 'draft' | 'generating' | 'completed' | 'paid' | 'expired'

      @column()
      declare iterationsUsed: number

      @column.dateTime()
      declare expiresAt: DateTime | null

      @column.dateTime({ autoCreate: true })
      declare createdAt: DateTime

      @column.dateTime({ autoCreate: true, autoUpdate: true })
      declare updatedAt: DateTime

      @hasMany(() => Photo)
      declare photos: HasMany<typeof Photo>
    }
    ```
    ```typescript
    // siana-memento-api/app/models/photo.ts
    import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
    import type { BelongsTo } from '@adonisjs/lucid/types/relations'
    import Design from '#models/design'
    import { DateTime } from 'luxon'

    export default class Photo extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare designId: number

      @column()
      declare position: number

      @column()
      declare cloudinaryPublicId: string

      @column()
      declare cloudinaryUrl: string

      @column.dateTime()
      declare expiresAt: DateTime

      @column.dateTime({ autoCreate: true })
      declare createdAt: DateTime

      @column.dateTime({ autoCreate: true, autoUpdate: true })
      declare updatedAt: DateTime

      @belongsTo(() => Design)
      declare design: BelongsTo<typeof Design>
    }
    ```
  - [x]Ajouter la route : `router.post('/api/designs', [DesignsController, 'store'])` — **pas d'auth middleware** (optionnel)
  - [x]`silent_auth_middleware` déjà disponible dans le projet — le `auth.user` sera null si non connecté, c'est le comportement voulu

### Frontend — Store Zustand useGenerationStore

- [x] Task 4 : Créer le store Zustand pour les données multi-étapes du flow de génération (AC: #5)
  - [x]Créer `siana-memento-web/src/stores/useGenerationStore.ts` :
    ```typescript
    import { create } from 'zustand'
    import { persist } from 'zustand/middleware'

    interface UploadedPhoto {
      publicId: string
      url: string
      previewUrl: string // URL.createObjectURL — pour affichage local uniquement
      file: File | null  // null après rechargement (non sérialisable)
    }

    interface GenerationStore {
      designId: number | null
      sessionToken: string | null
      photos: UploadedPhoto[]
      currentStep: 'upload' | 'template' | 'configure' | 'generating' | 'result'

      setDesign: (id: number, token: string) => void
      setPhotos: (photos: UploadedPhoto[]) => void
      setStep: (step: GenerationStore['currentStep']) => void
      reset: () => void
    }

    export const useGenerationStore = create<GenerationStore>()(
      persist(
        (set) => ({
          designId: null,
          sessionToken: null,
          photos: [],
          currentStep: 'upload',

          setDesign: (id, token) => set({ designId: id, sessionToken: token }),
          setPhotos: (photos) => set({ photos }),
          setStep: (step) => set({ currentStep: step }),
          reset: () => set({ designId: null, sessionToken: null, photos: [], currentStep: 'upload' }),
        }),
        {
          name: 'siana-generation-store',
          // Note: previewUrl (objectURL) n'est pas persisté — se perd au rechargement (normal)
          partialize: (state) => ({
            designId: state.designId,
            sessionToken: state.sessionToken,
            photos: state.photos.map((p) => ({ ...p, previewUrl: '', file: null })),
            currentStep: state.currentStep,
          }),
        }
      )
    )
    ```
  - [x]Installer Zustand : `npm install zustand` dans `siana-memento-web/` si pas encore installé
  - [x]**Note architecturale** : localStorage = limitation cross-device. L'UX note de la mascotte (`architecture.md §4.1`) adresse ce point : _"📱 Finalisez votre création sur cet appareil."_

### Frontend — Lib API upload

- [x] Task 5 : Créer `lib/api/upload.ts` avec les fonctions d'appel API (AC: #1, #4)
  - [x]Créer `siana-memento-web/src/lib/api/upload.ts` :
    ```typescript
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

    interface CloudinarySignature {
      signature: string
      timestamp: number
      cloudName: string
      apiKey: string
      folder: string
      tags: string
    }

    type SignResult =
      | { success: true; data: CloudinarySignature }
      | { success: false; errorCode: string; message: string }

    export async function getUploadSignature(sessionToken?: string): Promise<SignResult> {
      try {
        const params = sessionToken ? `?session_token=${sessionToken}` : ''
        const res = await fetch(`${API_URL}/api/upload/sign${params}`, {
          credentials: 'include',
        })
        const json = await res.json()
        if (json.success) return { success: true, data: json.data }
        return { success: false, errorCode: json.error?.code ?? 'SIGN_FAILED', message: json.error?.message ?? 'Erreur de signature.' }
      } catch {
        return { success: false, errorCode: 'NETWORK_ERROR', message: 'Service indisponible.' }
      }
    }

    export function uploadToCloudinary(
      file: File,
      signature: CloudinarySignature,
      onProgress: (percent: number) => void
    ): Promise<{ publicId: string; url: string }> {
      return new Promise((resolve, reject) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('signature', signature.signature)
        formData.append('timestamp', String(signature.timestamp))
        formData.append('api_key', signature.apiKey)
        formData.append('folder', signature.folder)
        formData.append('tags', signature.tags)

        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText)
            resolve({ publicId: result.public_id, url: result.secure_url })
          } else {
            reject(new Error(`Cloudinary error ${xhr.status}`))
          }
        }
        xhr.onerror = () => reject(new Error('Erreur réseau lors de l\'upload'))
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`)
        xhr.send(formData)
      })
    }

    interface PhotoPayload {
      publicId: string
      url: string
    }

    type CreateDesignResult =
      | { success: true; designId: number; sessionToken: string }
      | { success: false; errorCode: string; message: string }

    export async function createDesignWithPhotos(photos: PhotoPayload[]): Promise<CreateDesignResult> {
      try {
        const res = await fetch(`${API_URL}/api/designs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ photos }),
        })
        const json = await res.json()
        if (json.success) return { success: true, designId: json.data.designId, sessionToken: json.data.sessionToken }
        return { success: false, errorCode: json.error?.code ?? 'CREATE_FAILED', message: json.error?.message ?? 'Erreur lors de la création.' }
      } catch {
        return { success: false, errorCode: 'NETWORK_ERROR', message: 'Service indisponible.' }
      }
    }
    ```

### Frontend — Page upload et composant UploadZone

- [x] Task 6 : Créer la page `/generate/upload` et le composant `UploadZone` (AC: #1, #2, #3, #5, #6)
  - [x]Créer le répertoire `siana-memento-web/src/app/(public)/generate/upload/`
  - [x]Créer `siana-memento-web/src/app/(public)/generate/upload/page.tsx` (Server Component) :
    ```tsx
    import UploadZone from '@/components/siana/UploadZone'

    export default function UploadPage() {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl">
            <h1 className="font-display text-3xl font-bold text-center mb-2">
              Vos photos
            </h1>
            <p className="text-center text-muted-foreground mb-8 text-sm sr-only">
              Étape 1 sur 4
            </p>
            <UploadZone />
          </div>
        </main>
      )
    }
    ```
  - [x]Installer react-dropzone : `npm install react-dropzone` dans `siana-memento-web/`
  - [x]Créer `siana-memento-web/src/components/siana/UploadZone.tsx` (Client Component) :
    ```tsx
    'use client'

    import { useState, useCallback } from 'react'
    import { useDropzone } from 'react-dropzone'
    import { useRouter } from 'next/navigation'
    import { toast } from 'sonner'
    import { Button } from '@/components/ui/button'
    import { Progress } from '@/components/ui/progress'
    import { useGenerationStore } from '@/stores/useGenerationStore'
    import { getUploadSignature, uploadToCloudinary, createDesignWithPhotos } from '@/lib/api/upload'

    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    const ACCEPTED_TYPES = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }

    interface PhotoPreview {
      file: File
      previewUrl: string
      uploadedPublicId?: string
      uploadedUrl?: string
    }

    export default function UploadZone() {
      const router = useRouter()
      const { setDesign, setPhotos, setStep } = useGenerationStore()
      const [photos, setLocalPhotos] = useState<PhotoPreview[]>([])
      const [uploadProgress, setUploadProgress] = useState<number[]>([])
      const [isUploading, setIsUploading] = useState(false)
      const [mascotteMessage, setMascotteMessage] = useState<string | null>(null)

      const onDrop = useCallback((accepted: File[], rejected: { file: File; errors: { code: string }[] }[]) => {
        // Gestion des rejets (format ou taille invalide)
        for (const { file, errors } of rejected) {
          const isFormat = errors.some((e) => e.code === 'file-invalid-type')
          const isSize = errors.some((e) => e.code === 'file-too-large')

          if (isFormat) {
            setMascotteMessage(`✨ "${file.name}" n'est pas supporté. Utilisez une photo JPG ou PNG.`)
          } else if (isSize) {
            setMascotteMessage(`📦 "${file.name}" dépasse 10MB. Compressez-la sur squoosh.app ou via votre galerie photos.`)
          }
          return
        }

        // Max 2 photos total
        const totalAfterAdd = photos.length + accepted.length
        if (totalAfterAdd > 2) {
          setMascotteMessage('✨ Vous pouvez uploader jusqu\'à 2 photos maximum.')
          const toAdd = accepted.slice(0, 2 - photos.length)
          accepted = toAdd
        }

        setMascotteMessage(null)

        const newPreviews: PhotoPreview[] = accepted.map((file) => ({
          file,
          previewUrl: URL.createObjectURL(file),
        }))

        setLocalPhotos((prev) => [...prev, ...newPreviews].slice(0, 2))
      }, [photos])

      const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: ACCEPTED_TYPES,
        maxSize: MAX_SIZE,
        maxFiles: 2,
        multiple: true,
      })

      function removePhoto(index: number) {
        setLocalPhotos((prev) => {
          const next = [...prev]
          URL.revokeObjectURL(next[index].previewUrl)
          next.splice(index, 1)
          return next
        })
      }

      async function handleContinue() {
        if (photos.length === 0) return
        setIsUploading(true)
        setUploadProgress(photos.map(() => 0))

        try {
          // 1. Obtenir la signature Cloudinary
          const signResult = await getUploadSignature()
          if (!signResult.success) {
            toast.error(signResult.message)
            setIsUploading(false)
            return
          }

          // 2. Upload chaque photo directement vers Cloudinary
          const uploaded: { publicId: string; url: string }[] = []
          for (const [i, photo] of photos.entries()) {
            const result = await uploadToCloudinary(
              photo.file,
              signResult.data,
              (percent) => setUploadProgress((prev) => { const next = [...prev]; next[i] = percent; return next })
            )
            uploaded.push(result)
          }

          // 3. Créer le design en DB avec les photos
          const createResult = await createDesignWithPhotos(uploaded)
          if (!createResult.success) {
            toast.error(createResult.message)
            setIsUploading(false)
            return
          }

          // 4. Sauvegarder dans le store Zustand
          setDesign(createResult.designId, createResult.sessionToken)
          setPhotos(photos.map((p, i) => ({
            publicId: uploaded[i].publicId,
            url: uploaded[i].url,
            previewUrl: p.previewUrl,
            file: p.file,
          })))
          setStep('template')

          // 5. Naviguer vers l'étape suivante
          router.push('/generate/template')
        } catch (error) {
          toast.error('Une erreur est survenue lors de l\'upload. Réessayez.')
          setIsUploading(false)
        }
      }

      const totalProgress = uploadProgress.length > 0
        ? Math.round(uploadProgress.reduce((a, b) => a + b, 0) / uploadProgress.length)
        : 0

      return (
        <div className="flex flex-col gap-6">
          {/* Message mascotte */}
          {mascotteMessage && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-primary"
            >
              {mascotteMessage}
            </div>
          )}

          {/* Zone de drop */}
          <div
            {...getRootProps()}
            className={[
              'rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors',
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50',
              photos.length >= 2 ? 'pointer-events-none opacity-50' : '',
            ].join(' ')}
            aria-label="Zone de dépôt de photos"
          >
            <input {...getInputProps()} aria-label="Sélectionner des photos" />
            <p className="text-muted-foreground text-sm">
              {isDragActive
                ? '✨ Déposez vos photos ici...'
                : photos.length >= 2
                  ? 'Vous avez déjà 2 photos'
                  : 'Glissez vos photos ici ou cliquez pour sélectionner'}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">JPG ou PNG · max 10MB chacune · 1 ou 2 photos</p>
          </div>

          {/* Prévisualisations */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-4" role="list" aria-label="Photos sélectionnées">
              {photos.map((photo, i) => (
                <div key={photo.previewUrl} role="listitem" className="relative rounded-lg overflow-hidden aspect-square bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.previewUrl}
                    alt={`Photo ${i + 1} sélectionnée`}
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 rounded-full bg-black/60 text-white w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80 transition-colors"
                    aria-label={`Supprimer la photo ${i + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Barre de progression upload */}
          {isUploading && (
            <div role="status" aria-live="polite" aria-label={`Upload en cours : ${totalProgress}%`}>
              <p className="text-sm text-muted-foreground mb-2">
                ✨ Upload en cours... {totalProgress}%
              </p>
              <Progress value={totalProgress} className="h-2" />
            </div>
          )}

          {/* Bouton continuer */}
          <Button
            size="lg"
            className="w-full font-semibold"
            disabled={photos.length === 0 || isUploading}
            onClick={handleContinue}
          >
            {isUploading ? 'Upload en cours...' : 'Continuer →'}
          </Button>
        </div>
      )
    }
    ```
  - [x]**Note UX mascotte** : La mascotte (`setMascotteMessage`) utilise des messages pré-écrits (architecture §3.1 UX Magie Perçue). Zéro IA générative — juste du texte chaleureux pré-défini.
  - [x]La zone de drop est désactivée (opacity-50 + pointer-events-none) quand 2 photos sont déjà sélectionnées — UX claire et accessible

### Tests

- [x] Task 7 : Tests fonctionnels backend (AC: #1, #4)
  - [x]Créer `siana-memento-api/tests/functional/upload/sign.spec.ts` :
    - `POST /api/upload/sign` sans auth → 200 + `{ signature, timestamp, cloudName, apiKey, folder, tags }`
    - `POST /api/upload/sign` avec `session_token` → folder inclut le token dans le path
  - [x]Créer `siana-memento-api/tests/functional/designs/store.spec.ts` :
    - `POST /api/designs` avec 1 photo valide → 201 + `{ designId, sessionToken }`
    - `POST /api/designs` avec 2 photos valides → 201 + design créé avec 2 photos en DB
    - `POST /api/designs` avec 0 photos → 422 validation error
    - `POST /api/designs` avec 3 photos → 422 validation error (maxLength: 2)
    - Vérifier que `photos[0].expires_at` est à J+7 (±1 minute de marge pour le test)
  - [x]Pattern de test Japa (réutiliser depuis stories précédentes) :
    ```typescript
    import { test } from '@japa/runner'
    import testUtils from '@adonisjs/core/services/test_utils'
    import db from '@adonisjs/lucid/services/db'

    test.group('POST /api/designs', (group) => {
      group.each.setup(() => testUtils.db().withGlobalTransaction())
    })
    ```


### Review Follow-ups (AI)

- [x] [AI-Review][High] Implémenter le tag Cloudinary `expires_` (AC4) dans la signature backend et le form data frontend [`siana-memento-api/app/controllers/upload_controller.ts` & `siana-memento-web/src/lib/api/upload.ts`]
- [x] [AI-Review][High] Valider et assainir `session_token` pour éviter le risque de Path Traversal sur Cloudinary [`siana-memento-api/app/controllers/upload_controller.ts`]
- [x] [AI-Review][Medium] Uploader les photos en parallèle avec `Promise.all` au lieu de `for...of` pour respecter NFR-P6 [`siana-memento-web/src/components/siana/UploadZone.tsx`]
- [x] [AI-Review][Medium] Ajouter `file: File | null` dans l'interface `UploadedPhoto` et le state comme spécifié dans la Task 4 [`siana-memento-web/src/stores/useGenerationStore.ts`]
- [x] [AI-Review][Low] Utiliser `await Photo.createMany()` au lieu d'une boucle `for` pour optimiser les inserts DB [`siana-memento-api/app/controllers/designs_controller.ts`]

## Dev Notes

### Flux complet Upload — À ne pas manquer

```
1. User sélectionne 1-2 fichiers (drag & drop ou clic)
2. Validation client immédiate (format + taille) — AVANT tout réseau
3. Clic "Continuer"
4. Frontend → GET /api/upload/sign → { signature, apiKey, cloudName, folder, tags }
5. Frontend → POST https://api.cloudinary.com/v1_1/{cloudName}/image/upload (direct, progress via XHR)
6. Cloudinary retourne { public_id, secure_url }
7. Frontend → POST /api/designs { photos: [{ publicId, url }] }
8. Backend → crée design + photos en DB, retourne { designId, sessionToken }
9. Store Zustand mis à jour (designId, sessionToken, photos)
10. Navigation vers /generate/template
```

**Pourquoi Cloudinary Direct Upload (architecture §1.2) ?**
- Upload direct browser → Cloudinary (zero transit backend) = backend non saturé
- Progress bar précise via `XMLHttpRequest.upload.onprogress` (impossible avec `fetch()` natif)
- 25GB gratuit Cloudinary = ~2500 photos MVP
- **Ne jamais faire passer l'image par le backend** (goulot d'étranglement + coût bande passante)

### DB Schema — Tables créées par les migrations existantes

**Table `designs`** (migration `1771677000000_create_designs_table.ts`) :

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | INTEGER PK | auto-increment |
| `user_id` | INTEGER nullable | FK users.id (null si anonyme) |
| `session_token` | VARCHAR(100) UNIQUE | identifiant session anonyme (32 bytes hex) |
| `template` | ENUM | null jusqu'à Story 3.2 |
| `partner_1_name` | VARCHAR(100) | null jusqu'à Story 3.3 |
| `partner_2_name` | VARCHAR(100) | null jusqu'à Story 3.3 |
| `wedding_date` | DATE | null jusqu'à Story 3.3 |
| `wedding_location` | VARCHAR(255) | null jusqu'à Story 3.3 |
| `status` | ENUM | draft / generating / completed / paid / expired |
| `iterations_used` | INTEGER | 0 par défaut |
| `expires_at` | TIMESTAMP | null pour MVP (à définir en Growth) |

**Table `photos`** (migration `1771677000100_create_photos_table.ts`) :

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | INTEGER PK | auto-increment |
| `design_id` | INTEGER | FK designs.id (CASCADE DELETE) |
| `position` | INTEGER | 1 ou 2 |
| `cloudinary_public_id` | VARCHAR(255) | identifiant Cloudinary pour suppression RGPD |
| `cloudinary_url` | VARCHAR(500) | URL sécurisée pour affichage |
| `expires_at` | TIMESTAMP NOT NULL | J+7 — utilisé par le cron RGPD (Story 3.7) |

⚠️ **3 migrations non-commitées à committer avec cette story** :
- `1771677000000_create_designs_table.ts`
- `1771677000100_create_photos_table.ts`
- `1771677000200_create_generations_table.ts`

La migration `generations` est nécessaire pour les histoires 3.4+ mais ne bloque pas Story 3.1.

### Auth optionnelle — pattern `silent_auth_middleware`

L'upload est accessible **sans connexion**. Le middleware `silent_auth_middleware.ts` (déjà dans le projet) permet de récupérer `auth.user` sans bloquer si non connecté :

```typescript
// Dans routes.ts — optionnel, pas obligatoire pour les routes publiques
router.post('/api/designs', [DesignsController, 'store'])
// Le controller utilise : auth.user?.id ?? null
```

L'utilisateur non connecté aura `userId = null` dans `designs` — ce n'est pas un problème. L'association se fera lors de l'auth (Story 2.5 — déclenchée à l'écran de révélation, Story 3.5). **NE PAS bloquer l'upload par un guard d'auth.**

### Variables d'environnement requises — Backend

```env
# .env (VPS)
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx  # JAMAIS côté frontend
```

```env
# .env.local (Frontend) — aucune variable Cloudinary côté frontend
# Le cloud_name et api_key sont renvoyés par /api/upload/sign (pas de secret)
```

### react-dropzone — Version et configuration

- **Version actuelle** : react-dropzone v14.x (compatible React 18)
- **Validation côté client** : `maxSize` (10MB) et `accept` (image/jpeg, image/png) gérés nativement par react-dropzone — les fichiers rejetés arrivent dans `onDrop(accepted, rejected)`
- **Codes d'erreur** : `'file-invalid-type'` et `'file-too-large'` — utiliser ces constantes, ne pas hardcoder les strings
- **`maxFiles: 2`** : react-dropzone rejette automatiquement les fichiers en excès — mais l'accumulation manuelle (plusieurs drops successifs) nécessite la logique dans `onDrop` pour limiter à 2 total

### Gestion des ObjectURL — Memory leaks à éviter

```typescript
// À la suppression d'une photo
URL.revokeObjectURL(photo.previewUrl)

// Au démontage du composant (si nécessaire)
useEffect(() => {
  return () => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
  }
}, [])
```

### Structure de fichiers à créer

```
Backend — Nouveaux fichiers :
siana-memento-api/
├── app/
│   ├── controllers/
│   │   ├── upload_controller.ts     ← CRÉER
│   │   └── designs_controller.ts    ← CRÉER
│   ├── models/
│   │   ├── design.ts                ← CRÉER
│   │   └── photo.ts                 ← CRÉER
│   └── validators/
│       └── design_validator.ts      ← CRÉER
└── database/
    └── migrations/
        ├── 1771677000000_create_designs_table.ts   ← COMMITTER (déjà créé)
        ├── 1771677000100_create_photos_table.ts    ← COMMITTER (déjà créé)
        └── 1771677000200_create_generations_table.ts ← COMMITTER (déjà créé)

Frontend — Nouveaux fichiers :
siana-memento-web/src/
├── stores/
│   └── useGenerationStore.ts        ← CRÉER
├── lib/api/
│   └── upload.ts                    ← CRÉER
├── components/siana/
│   └── UploadZone.tsx               ← CRÉER
└── app/(public)/generate/upload/
    └── page.tsx                     ← CRÉER (+ répertoire)
```

**Backend — Modifier :**
```
siana-memento-api/
└── start/
    └── routes.ts   ← MODIFIER (ajouter routes /api/upload/sign et /api/designs)
```

### Accessibilité (NFR-A1 à A7)

- **Zone dropzone** : `aria-label="Zone de dépôt de photos"` — annoncée par les screen readers
- **Prévisualisations** : `role="list"` + `role="listitem"` + `alt` descriptif (`"Photo 1 sélectionnée"`)
- **Bouton supprimer** : `aria-label="Supprimer la photo 1"` — explicite pour les lecteurs d'écran
- **Progress bar** : `role="status"` + `aria-live="polite"` + `aria-label` avec le pourcentage
- **Message mascotte** : `role="status"` + `aria-live="polite"` — annoncé sans interrompre la lecture
- **Bouton continuer** : `disabled` quand `photos.length === 0` — état natif, pas besoin d'aria supplémentaire
- **Touch targets** : Bouton "continuer" = `size="lg"` shadcn/ui = 48px → respecte NFR-A2 (≥44px)

### Intelligence des Stories Précédentes — À Réutiliser

**Depuis Story 2.5 et stories Epic 2 :**
- Pattern `'use client'` pour composants interactifs — tous les composants dans `/components/siana/` qui ont `useState`, `useEffect`, `useRouter`, `useCallback`
- Pattern `lib/api/` : toutes les fonctions fetch sont isolées dans `lib/api/` (jamais inline dans les composants)
- Format réponse API uniforme : `{ success: true, data: {...} }` et `{ success: false, error: { code, message } }`
- `credentials: 'include'` sur **tous** les appels fetch (cookies de session)
- `toast.error()` via Sonner pour erreurs système (réseau, API down) — `<Toaster>` déjà monté dans `layout.tsx`
- Erreurs de champ → inline dans l'UI (message mascotte dans ce cas, pas un `<p>` sous input)

**Depuis Architecture §1.2 (File Upload & Storage) :**
- "Upload direct browser → Cloudinary (zero transit backend)" — NE PAS passer les fichiers par le backend
- Message onboarding device : `"📱 Finalisez votre création sur cet appareil. Vos photos restent sur ce navigateur uniquement."` — intégrer dans le composant ou la page (optionnel MVP, mais recommandé UX)

### Patterns de commit attendus (depuis git log)

```
feat(S3-1): upload de photos
```

### Analyse Git — Patterns en vigueur

```
640b7f5 feat: add mascot and logo assets       ← Assets mascotte déjà disponibles
29a772b feat(S2-5): modal auth juste à temps   ← Patterns stables épic 2
```

- Mascotte et logo assets déjà dans le dépôt (commit 640b7f5) — vérifier `public/` ou `src/assets/` pour les intégrer dans l'UI
- Pattern `useEffect` + `useState` + `useCallback` établis depuis Epic 2

### Project Structure Notes

- Alignement avec l'architecture : page at `app/(public)/generate/upload/` (route group `(public)`) — cohérent avec `app/(public)/page.tsx` existant
- Stores Zustand dans `src/stores/` (nouveau répertoire) — conventionnel et clean
- `lib/api/upload.ts` — suit le pattern `lib/api/auth.ts` déjà établi

### Références

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] — User story + acceptance criteria originaux
- [Source: _bmad-output/planning-artifacts/architecture.md#1.2 File Upload & Storage] — Cloudinary Direct Upload, signed URLs, progress bar
- [Source: _bmad-output/planning-artifacts/architecture.md#4.1 State Management] — Zustand, localStorage persistence
- [Source: _bmad-output/planning-artifacts/architecture.md#4.3 Image Upload UX] — react-dropzone, XMLHttpRequest.upload.onprogress
- [Source: _bmad-output/planning-artifacts/architecture.md#1.3 Data Validation] — VineJS centralisé dans /app/validators/
- [Source: _bmad-output/planning-artifacts/architecture.md#3.1 Response Format] — Format `{ success: true, data: {...} }`
- [Source: _bmad-output/planning-artifacts/architecture.md#5.5 RGPD Compliance] — expires_at J+7 dans photos
- [Source: siana-memento-api/database/migrations/1771677000100_create_photos_table.ts] — Schéma photos (expires_at, cloudinary_public_id, position)
- [Source: siana-memento-api/database/migrations/1771677000000_create_designs_table.ts] — Schéma designs (session_token, user_id nullable, status)
- [Source: siana-memento-web/src/lib/api/auth.ts] — Pattern fetch API (credentials include, format résultat)
- [Source: _bmad-output/implementation-artifacts/2-5-modal-auth-juste-a-temps.md] — Patterns composants client, store usage futur depuis reveal screen
- [Source: CLAUDE.md#Frontend Conventions] — Toasts pour erreurs système, `toast.error()` via Sonner

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fix `auth.user` null avec auth optionnelle : `auth.use('web').check()` et `auth.use('web').user` ne populaient pas `auth.user` correctement en dehors du middleware. Solution : ajout de `silentAuth` comme named middleware dans `kernel.ts` et appliqué sur la route `POST /api/designs` — `auth.user` est ensuite correctement populé par la chaîne standard AdonisJS.
- Fix TypeScript UploadZone : `FileRejection[]` du type react-dropzone est `readonly`, import explicite de `FileRejection` depuis `react-dropzone` requis pour typage correct.
- Fix ESLint prettier : strings avec apostrophes converties en double quotes (`'l\'utilisateur'` → `"l'utilisateur"`) via `eslint --fix`.
- Fix TypeScript backend : paramètre `assert` non utilisé dans le test `retourne 422 si plus de 2 photos` → supprimé.
- Pattern de cookies en test : utiliser `loginResponse.headers()['set-cookie'].map(c => c.split(';')[0]).join('; ')` (toutes les cookies jointes) plutôt que `loginResponse.header('set-cookie').find(adonis-session)` pour que `silentAuth` détecte correctement la session.

### Completion Notes List

- ✅ AC#1 : Upload drag & drop via `react-dropzone`, prévisualisation instantanée via `URL.createObjectURL`, progress bar XHR
- ✅ AC#2 : Validation format côté client (react-dropzone `accept`), message mascotte bienveillant avec `setMascotteMessage()`
- ✅ AC#3 : Validation taille 10MB côté client (react-dropzone `maxSize`), message mascotte avec conseil squoosh.app
- ✅ AC#4 : `photos.expires_at` = J+7 via `DateTime.now().plus({ days: 7 })`, `cloudinaryPublicId` stocké — 8 tests DB confirment
- ✅ AC#5 : Zustand `useGenerationStore` persiste `designId`, `sessionToken`, `photos` — navigation vers `/generate/template`
- ✅ AC#6 : Progress bar via `XMLHttpRequest.upload.onprogress` (impossible avec `fetch`) — affichée pendant l'upload
- ✅ 54/54 tests backend passent (42 préexistants + 12 nouveaux : 4 sign + 8 designs)
- ✅ TypeScript strict : `npx tsc --noEmit` sans erreur (backend + frontend)
- ✅ ESLint propre sur tous les fichiers créés/modifiés
- ✅ `silentAuth` middleware ajouté à `kernel.ts` named middleware — utilisé sur `POST /api/designs`
- ✅ 3 migrations non-commitées (`designs`, `photos`, `generations`) incluses dans la story

### File List

**Backend — Nouveaux fichiers :**
- `siana-memento-api/app/controllers/upload_controller.ts` — POST /api/upload/sign (signature Cloudinary)
- `siana-memento-api/app/controllers/designs_controller.ts` — POST /api/designs (création design + photos)
- `siana-memento-api/app/models/design.ts` — Modèle Lucid Design
- `siana-memento-api/app/models/photo.ts` — Modèle Lucid Photo
- `siana-memento-api/app/validators/design_validator.ts` — VineJS validator photos
- `siana-memento-api/database/migrations/1771677000000_create_designs_table.ts` — Migration table designs
- `siana-memento-api/database/migrations/1771677000100_create_photos_table.ts` — Migration table photos
- `siana-memento-api/database/migrations/1771677000200_create_generations_table.ts` — Migration table generations
- `siana-memento-api/tests/functional/upload/sign.spec.ts` — 4 tests POST /api/upload/sign
- `siana-memento-api/tests/functional/designs/store.spec.ts` — 8 tests POST /api/designs

**Backend — Modifiés :**
- `siana-memento-api/start/routes.ts` — ajout imports + routes POST /api/upload/sign et POST /api/designs
- `siana-memento-api/start/env.ts` — ajout CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- `siana-memento-api/start/kernel.ts` — ajout `silentAuth` named middleware
- `siana-memento-api/package.json` — ajout dépendance `cloudinary`

**Frontend — Nouveaux fichiers :**
- `siana-memento-web/src/stores/useGenerationStore.ts` — Store Zustand flow génération multi-étapes
- `siana-memento-web/src/lib/api/upload.ts` — getUploadSignature, uploadToCloudinary, createDesignWithPhotos
- `siana-memento-web/src/components/siana/UploadZone.tsx` — Composant upload avec drag & drop + progress
- `siana-memento-web/src/app/(public)/generate/upload/page.tsx` — Page /generate/upload

**Frontend — Modifiés :**
- `siana-memento-web/package.json` — ajout dépendances `zustand`, `react-dropzone`

### Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-24 | claude-sonnet-4-6 | Implémentation complète Story 3.1 : upload_controller + designs_controller, modèles Design/Photo, validator VineJS, store Zustand, UploadZone avec drag & drop XHR progress, 12 tests (54/54 passent), TypeScript + ESLint clean |
| 2026-02-24 | claude-sonnet-4-6 | Review follow-ups : tag `expires_` Cloudinary (backend + frontend), assainissement Path Traversal session_token, uploads en parallèle Promise.all, `file: File | null` dans UploadedPhoto, Photo.createMany() ; 55/55 tests passent |

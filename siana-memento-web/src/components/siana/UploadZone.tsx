'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useGenerationStore } from '@/stores/useGenerationStore'
import type { TemplateId } from '@/lib/templates'
import {
  getUploadSignature,
  uploadToCloudinary,
  createDesignWithPhotos,
} from '@/lib/api/upload'
import type { UploadedPhoto } from '@/stores/useGenerationStore'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }

interface PhotoPreview {
  file: File | null
  previewUrl: string
}

export default function UploadZone({ initialStyle }: { initialStyle?: TemplateId }) {
  const router = useRouter()
  const { designId, setDesign, setPhotos, setStep, setTemplate, resetForPhotoChange, photos: storePhotos, _hasHydrated } = useGenerationStore()

  // Reset le store une seule fois à l'hydration si un design d'une session précédente existe
  const didResetOnMount = useRef(false)
  useEffect(() => {
    if (!_hasHydrated || didResetOnMount.current) return
    didResetOnMount.current = true
    if (designId) {
      resetForPhotoChange()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated])

  // Style choisi depuis la galerie landing (?style=). Effect séparé du reset ci-dessus :
  // `resetForPhotoChange` conserve `selectedTemplate`, donc aucun conflit d'ordre.
  //
  // Le param est consommé UNE SEULE FOIS puis retiré de l'URL (`replace`, pas `push` :
  // pas d'entrée d'historique en plus). Sans ça, un Back navigateur depuis une étape
  // suivante remonterait sur `?style=<x>` et réappliquerait `<x>` par-dessus le template
  // que l'utilisateur a choisi entre-temps — en réinitialisant sa palette au passage.
  const didApplyInitialStyle = useRef(false)
  useEffect(() => {
    if (!_hasHydrated || !initialStyle || didApplyInitialStyle.current) return
    didApplyInitialStyle.current = true
    setTemplate(initialStyle)
    router.replace('/generate/upload')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, initialStyle])

  const [previews, setPreviews] = useState<PhotoPreview[]>([])
  const [uploadProgress, setUploadProgress] = useState<number[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [mascotteMessage, setMascotteMessage] = useState<string | null>(null)

  // Initialiser les previews depuis le store au montage (Retour en arrière ou Rafraîchissement)
  useEffect(() => {
    if (_hasHydrated && storePhotos.length > 0 && previews.length === 0) {
      const initialPreviews: PhotoPreview[] = storePhotos.map((p) => ({
        file: p.file, 
        previewUrl: p.previewUrl || p.url, // Fallback sur l'URL Cloudinary si previewUrl (blob) perdu
      }))
      setPreviews(initialPreviews)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, storePhotos])

  // Libérer les ObjectURLs au démontage pour éviter les memory leaks
  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(p.previewUrl)
        }
      })
    }
  }, [previews])

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Traitement des fichiers rejetés — message mascotte bienveillant
      for (const { file, errors } of rejectedFiles) {
        const isFormat = errors.some((e) => e.code === 'file-invalid-type')
        const isSize = errors.some((e) => e.code === 'file-too-large')

        if (isFormat) {
          setMascotteMessage(
            `✨ "${file.name}" n'est pas supporté. Utilisez une photo JPG ou PNG.`
          )
        } else if (isSize) {
          setMascotteMessage(
            `📦 "${file.name}" dépasse 10MB. Compressez-la sur squoosh.app ou via votre galerie photos.`
          )
        }
        return
      }

      setMascotteMessage(null)

      // Limiter à 2 photos total (accumulation sur plusieurs drops)
      const remaining = 2 - previews.length
      if (remaining <= 0) return

      const toAdd = acceptedFiles.slice(0, remaining)
      const newPreviews: PhotoPreview[] = toAdd.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }))

      setPreviews((prev) => [...prev, ...newPreviews])
    },
    [previews.length]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    maxFiles: 2,
    multiple: true,
    disabled: previews.length >= 2 || isUploading,
  })

  function removePhoto(index: number) {
    setPreviews((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].previewUrl)
      next.splice(index, 1)
      return next
    })
    setMascotteMessage(null)
  }

  async function handleContinue() {
    if (previews.length === 0 || isUploading) return

    setIsUploading(true)

    try {
      // Identifier les photos qui ont besoin d'être uploadées (celles qui ont un objet File)
      const toUpload = previews.filter((p) => p.file !== null)
      const alreadyUploaded = storePhotos.filter((sp) => 
        previews.some((p) => p.file === null && p.previewUrl === (sp.previewUrl || sp.url))
      )

      let newlyUploaded: { publicId: string; url: string }[] = []

      if (toUpload.length > 0) {
        setUploadProgress(toUpload.map(() => 0))
        
        // 1. Obtenir la signature Cloudinary
        const signResult = await getUploadSignature()
        if (!signResult.success) {
          toast.error(signResult.message)
          setIsUploading(false)
          return
        }

        // 2. Upload seulement les nouvelles photos
        newlyUploaded = await Promise.all(
          toUpload.map((preview, i) =>
            uploadToCloudinary(preview.file as File, signResult.data, (percent) => {
              setUploadProgress((prev) => {
                const next = [...prev]
                next[i] = percent
                return next
              })
            })
          )
        )
      }

      // Fusionner les photos déjà présentes et les nouvelles
      const finalPhotos = [...alreadyUploaded.map(p => ({ publicId: p.publicId, url: p.url }))]
      
      // Si on a de nouvelles photos ou si c'est la première création
      if (toUpload.length > 0 || !designId) {
        const createResult = await createDesignWithPhotos([...finalPhotos, ...newlyUploaded])
        if (!createResult.success) {
          toast.error(createResult.message)
          setIsUploading(false)
          return
        }
        setDesign(createResult.designId, createResult.sessionToken)
      }

      // 4. Mettre à jour le store Zustand avec les previews locales
      const updatedStorePhotos: UploadedPhoto[] = previews.map((p) => {
        // Chercher dans les nouvelles
        const isNewIdx = toUpload.findIndex(tu => tu === p)
        if (isNewIdx !== -1) {
          return {
            publicId: newlyUploaded[isNewIdx].publicId,
            url: newlyUploaded[isNewIdx].url,
            previewUrl: p.previewUrl,
            file: p.file,
          }
        }
        // Chercher dans les anciennes
        const existing = storePhotos.find(sp => (sp.previewUrl || sp.url) === p.previewUrl)
        return existing || { publicId: '', url: p.previewUrl, previewUrl: p.previewUrl, file: p.file }
      })
      
      setPhotos(updatedStorePhotos)
      setStep('template')

      // 5. Naviguer vers l'étape suivante
      router.push('/generate/template')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error("Une erreur est survenue lors de l'upload. Réessayez.")
      setIsUploading(false)
    }
  }

  const totalProgress =
    uploadProgress.length > 0
      ? Math.round(uploadProgress.reduce((a, b) => a + b, 0) / uploadProgress.length)
      : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Message mascotte — erreurs de validation */}
      {mascotteMessage && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary"
        >
          {mascotteMessage}
        </div>
      )}

      {/* Zone de dépôt */}
      <div
        {...getRootProps()}
        className={[
          'cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/30 hover:border-primary/50',
          previews.length >= 2 || isUploading ? 'pointer-events-none opacity-50' : '',
        ].join(' ')}
        aria-label="Zone de dépôt de photos"
      >
        <input {...getInputProps()} aria-label="Sélectionner des photos" />
        <p className="text-sm text-muted-foreground">
          {isDragActive
            ? '✨ Déposez vos photos ici...'
            : previews.length >= 2
              ? 'Vous avez déjà 2 photos'
              : 'Glissez vos photos ici ou cliquez pour sélectionner'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          JPG ou PNG · max 10MB chacune · 1 ou 2 photos
        </p>
      </div>

      {/* Prévisualisations des photos sélectionnées */}
      {previews.length > 0 && (
        <div
          className="grid grid-cols-2 gap-4"
          role="list"
          aria-label="Photos sélectionnées"
        >
          {previews.map((preview, i) => (
            <div
              key={preview.previewUrl}
              role="listitem"
              className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.previewUrl}
                alt={`Photo ${i + 1} sélectionnée`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                disabled={isUploading}
                className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-white transition-colors disabled:opacity-50 focus-visible:outline-none"
                aria-label={`Supprimer la photo ${i + 1}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm transition-colors group-hover:bg-black/80">
                  ✕
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Barre de progression upload */}
      {isUploading && (
        <div
          role="status"
          aria-live="polite"
          aria-label={`Upload en cours : ${totalProgress}%`}
        >
          <p className="mb-2 text-sm text-muted-foreground">
            ✨ Upload en cours... {totalProgress}%
          </p>
          <Progress value={totalProgress} className="h-2" />
        </div>
      )}

      {/* Bouton continuer */}
      <Button
        size="lg"
        className="w-full font-semibold"
        disabled={previews.length === 0 || isUploading}
        onClick={handleContinue}
      >
        {isUploading ? 'Upload en cours...' : 'Continuer →'}
      </Button>
    </div>
  )
}

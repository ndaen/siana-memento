'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useGenerationStore } from '@/stores/useGenerationStore'
import {
  getUploadSignature,
  uploadToCloudinary,
  createDesignWithPhotos,
} from '@/lib/api/upload'
import type { UploadedPhoto } from '@/stores/useGenerationStore'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }

interface PhotoPreview {
  file: File
  previewUrl: string
}

export default function UploadZone() {
  const router = useRouter()
  const { setDesign, setPhotos, setStep } = useGenerationStore()

  const [previews, setPreviews] = useState<PhotoPreview[]>([])
  const [uploadProgress, setUploadProgress] = useState<number[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [mascotteMessage, setMascotteMessage] = useState<string | null>(null)

  // Libérer les ObjectURLs au démontage pour éviter les memory leaks
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    setUploadProgress(previews.map(() => 0))

    try {
      // 1. Obtenir la signature Cloudinary
      const signResult = await getUploadSignature()
      if (!signResult.success) {
        toast.error(signResult.message)
        setIsUploading(false)
        return
      }

      // 2. Upload toutes les photos en parallèle vers Cloudinary avec progress par photo (NFR-P6)
      const uploaded = await Promise.all(
        previews.map((preview, i) =>
          uploadToCloudinary(preview.file, signResult.data, (percent) => {
            setUploadProgress((prev) => {
              const next = [...prev]
              next[i] = percent
              return next
            })
          })
        )
      )

      // 3. Créer le design en DB avec les photos
      const createResult = await createDesignWithPhotos(uploaded)
      if (!createResult.success) {
        toast.error(createResult.message)
        setIsUploading(false)
        return
      }

      // 4. Sauvegarder dans le store Zustand
      setDesign(createResult.designId, createResult.sessionToken)
      const storePhotos: UploadedPhoto[] = previews.map((p, i) => ({
        publicId: uploaded[i].publicId,
        url: uploaded[i].url,
        previewUrl: p.previewUrl,
        file: p.file,
      }))
      setPhotos(storePhotos)
      setStep('template')

      // 5. Naviguer vers l'étape suivante (Story 3.2)
      router.push('/generate/template')
    } catch {
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
              className="relative aspect-square overflow-hidden rounded-lg bg-muted"
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
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white transition-colors hover:bg-black/80 disabled:opacity-50"
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

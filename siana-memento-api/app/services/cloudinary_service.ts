import { v2 as cloudinary } from 'cloudinary'
import env from '#start/env'

cloudinary.config({
  cloud_name: env.get('CLOUDINARY_CLOUD_NAME'),
  api_key: env.get('CLOUDINARY_API_KEY'),
  api_secret: env.get('CLOUDINARY_API_SECRET'),
})

const MAX_RETRIES = 3
const BACKOFF_BASE_MS = 2000

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, BACKOFF_BASE_MS * Math.pow(2, attempt)))
      }
    }
  }
  throw lastError
}

/**
 * Construit la transformation watermark.
 * Si CLOUDINARY_WATERMARK_PUBLIC_ID est défini, utilise le logo image.
 * Sinon, replie sur un texte "Siana Memento".
 */
function buildWatermarkTransformation(): object[] {
  const logoPublicId = env.get('CLOUDINARY_WATERMARK_PUBLIC_ID')

  if (logoPublicId) {
    return [
      { width: 1000, crop: 'scale' },
      {
        overlay: { public_id: logoPublicId },
        width: 300,
        gravity: 'south_east',
        opacity: 70,
      },
    ]
  }

  // Fallback texte si aucun logo configuré
  return [
    { width: 1000, crop: 'scale' },
    {
      overlay: { font_family: 'Arial', font_size: 55, font_weight: 'bold', text: 'Siana Memento' },
      color: '#FFFFFF',
      opacity: 40,
      gravity: 'center',
    },
  ]
}

export async function uploadDesign(
  base64DataUrl: string,
  designId: number
): Promise<{ publicId: string; previewUrl: string }> {
  // Étape 1 : upload de l'original (jamais exposé au frontend)
  const original = await withRetry(() =>
    cloudinary.uploader.upload(base64DataUrl, {
      folder: 'designs',
      public_id: `design-${designId}`,
      overwrite: true,
      resource_type: 'image',
    })
  )

  // Étape 2 : construire l'URL watermarquée (transformation Cloudinary côté serveur)
  const watermarkedUrl = cloudinary.url(`designs/design-${designId}`, {
    transformation: buildWatermarkTransformation(),
    secure: true,
  })

  // Étape 3 : re-uploader la version watermarquée comme asset autonome
  // → l'URL résultante est une URL simple sans transformation : non réversible
  let preview: Awaited<ReturnType<typeof cloudinary.uploader.upload>>
  try {
    preview = await withRetry(() =>
      cloudinary.uploader.upload(watermarkedUrl, {
        folder: 'previews',
        public_id: `design-${designId}`,
        overwrite: true,
        resource_type: 'image',
      })
    )
  } catch (err) {
    // Rollback : supprimer l'original pour éviter les assets orphelins
    await cloudinary.uploader
      .destroy(original.public_id, { resource_type: 'image' })
      .catch(() => {})
    throw err
  }

  return {
    publicId: original.public_id,
    previewUrl: preview.secure_url,
  }
}

export async function deleteDesign(publicId: string): Promise<void> {
  // Supprimer l'original et la preview (deux assets distincts)
  const previewPublicId = publicId.replace('designs/', 'previews/')
  await Promise.all([
    withRetry(() => cloudinary.uploader.destroy(publicId, { resource_type: 'image' })),
    withRetry(() => cloudinary.uploader.destroy(previewPublicId, { resource_type: 'image' })),
  ])
}

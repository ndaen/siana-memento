const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface CloudinarySignature {
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
    const params = sessionToken ? `?session_token=${encodeURIComponent(sessionToken)}` : ''
    const res = await fetch(`${API_URL}/api/upload/sign${params}`, {
      credentials: 'include',
    })
    const json = await res.json()
    if (json.success) return { success: true, data: json.data }
    return {
      success: false,
      errorCode: json.error?.code ?? 'SIGN_FAILED',
      message: json.error?.message ?? 'Erreur de signature.',
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
    }
  }
}

/**
 * Upload direct vers Cloudinary via XMLHttpRequest pour la progress bar précise.
 * NE PAS utiliser fetch() ici — pas de support natif de l'upload progress.
 */
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
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText) as { public_id: string; secure_url: string }
        resolve({ publicId: result.public_id, url: result.secure_url })
      } else {
        reject(new Error(`Cloudinary error ${xhr.status}: ${xhr.responseText}`))
      }
    }

    xhr.onerror = () => reject(new Error("Erreur réseau lors de l'upload vers Cloudinary"))

    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`
    )
    xhr.send(formData)
  })
}

export interface PhotoPayload {
  publicId: string
  url: string
}

type CreateDesignResult =
  | { success: true; designId: number; sessionToken: string }
  | { success: false; errorCode: string; message: string }

export async function createDesignWithPhotos(
  photos: PhotoPayload[]
): Promise<CreateDesignResult> {
  try {
    const res = await fetch(`${API_URL}/api/designs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ photos }),
    })
    const json = await res.json()
    if (json.success) {
      return {
        success: true,
        designId: json.data.designId,
        sessionToken: json.data.sessionToken,
      }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'CREATE_FAILED',
      message: json.error?.message ?? 'Erreur lors de la création du design.',
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
    }
  }
}

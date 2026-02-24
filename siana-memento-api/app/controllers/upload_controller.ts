import type { HttpContext } from '@adonisjs/core/http'
import { v2 as cloudinary } from 'cloudinary'
import env from '#start/env'

// Configure Cloudinary avec les variables d'environnement
cloudinary.config({
  cloud_name: env.get('CLOUDINARY_CLOUD_NAME'),
  api_key: env.get('CLOUDINARY_API_KEY'),
  api_secret: env.get('CLOUDINARY_API_SECRET'),
})

export default class UploadController {
  /**
   * POST /api/upload/sign
   * Génère une signature Cloudinary pour un upload direct depuis le frontend.
   * Ne nécessite pas d'authentification (l'auth arrive à l'écran de révélation via Story 2.5).
   */
  async sign({ request, response }: HttpContext) {
    const rawToken = request.input('session_token', 'anonymous') as string
    // Assainissement anti Path Traversal : on ne conserve que les caractères alphanumériques, tirets et underscores
    const sessionToken = rawToken.replace(/[^a-zA-Z0-9_-]/g, '')
    const timestamp = Math.round(new Date().getTime() / 1000)

    // Dossier Cloudinary organisé par session pour faciliter le cleanup RGPD
    const folder = `designs/${sessionToken}`

    // Tag expires_ RGPD : Cloudinary supprime automatiquement les assets 7 jours après l'upload
    const expiresAt = timestamp + 7 * 24 * 3600

    const paramsToSign = {
      folder,
      tags: `expires_${expiresAt}`,
      timestamp,
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
        tags: `expires_${expiresAt}`,
      },
    })
  }
}

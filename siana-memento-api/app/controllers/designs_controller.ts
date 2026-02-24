import type { HttpContext } from '@adonisjs/core/http'
import { createDesignValidator } from '#validators/design_validator'
import Design from '#models/design'
import Photo from '#models/photo'
import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'

export default class DesignsController {
  /**
   * POST /api/designs
   * Crée un design et enregistre les photos en DB avec expires_at J+7 (RGPD).
   * Auth optionnelle : userId = null si utilisateur anonyme.
   */
  async store({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(createDesignValidator)

    // Auth optionnelle — silentAuth middleware a déjà appelé auth.check()
    // auth.user est populé si connecté, null/undefined si anonyme
    const userId = auth.user?.id ?? null

    const sessionToken = randomBytes(32).toString('hex')

    const design = await Design.create({
      userId,
      sessionToken,
      status: 'draft',
    })

    // expires_at J+7 pour conformité RGPD (FR31) — base du cron Story 3.7
    const expiresAt = DateTime.now().plus({ days: 7 })

    await Photo.createMany(
      payload.photos.map((photo, index) => ({
        designId: design.id,
        position: index + 1,
        cloudinaryPublicId: photo.publicId,
        cloudinaryUrl: photo.url,
        expiresAt,
      }))
    )

    return response.created({
      success: true,
      data: {
        designId: design.id,
        sessionToken: design.sessionToken,
      },
    })
  }
}

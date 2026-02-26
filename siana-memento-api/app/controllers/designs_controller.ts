import type { HttpContext } from '@adonisjs/core/http'
import {
  createDesignValidator,
  updateDesignTemplateValidator,
  updateDesignConfigureValidator,
} from '#validators/design_validator'
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

    // expires_at J+7 pour conformité RGPD (FR31) — base du cron Story 3.7
    const expiresAt = DateTime.now().plus({ days: 7 })

    const design = await Design.create({
      userId,
      sessionToken,
      status: 'draft',
      expiresAt,
    })

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

  /**
   * PATCH /api/designs/:id/template
   * Met à jour le template du design. Auth optionnelle.
   * Ownership check : userId si connecté, sessionToken si anonyme.
   */
  async updateTemplate({ params, request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(updateDesignTemplateValidator)
    const design = await Design.find(params.id)

    if (!design) {
      return response.notFound({
        success: false,
        error: { code: 'DESIGN_NOT_FOUND', message: 'Design introuvable.' },
      })
    }

    const userId = auth.user?.id ?? null
    if (userId) {
      if (design.userId !== userId) {
        return response.forbidden({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Accès interdit.' },
        })
      }
    } else {
      if (!payload.sessionToken || design.sessionToken !== payload.sessionToken) {
        return response.forbidden({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Accès interdit.' },
        })
      }
    }

    await design.merge({ template: payload.template }).save()

    return response.ok({
      success: true,
      data: {
        designId: design.id,
        template: design.template,
      },
    })
  }

  /**
   * PATCH /api/designs/:id/configure
   * Met à jour les données du mariage (noms, date, lieu). Auth optionnelle.
   * Ownership check : userId si connecté, sessionToken si anonyme.
   */
  async updateConfigure({ params, request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(updateDesignConfigureValidator)
    const design = await Design.find(params.id)

    if (!design) {
      return response.notFound({
        success: false,
        error: { code: 'DESIGN_NOT_FOUND', message: 'Design introuvable.' },
      })
    }

    // Vérification propriété — même logique que updateTemplate
    const userId = auth.user?.id ?? null
    if (userId) {
      if (design.userId !== userId) {
        return response.forbidden({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Accès interdit.' },
        })
      }
    } else {
      if (!payload.sessionToken || design.sessionToken !== payload.sessionToken) {
        return response.forbidden({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Accès interdit.' },
        })
      }
    }

    await design
      .merge({
        partner1Name: payload.partner1Name,
        partner2Name: payload.partner2Name,
        weddingDate: DateTime.fromISO(payload.weddingDate),
        weddingLocation: payload.weddingLocation,
      })
      .save()

    return response.ok({
      success: true,
      data: {
        designId: design.id,
      },
    })
  }
}

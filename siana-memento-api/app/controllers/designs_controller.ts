import type { HttpContext } from '@adonisjs/core/http'
import {
  createDesignValidator,
  updateDesignTemplateValidator,
  updateDesignConfigureValidator,
  triggerGenerationValidator,
} from '#validators/design_validator'
import Design from '#models/design'
import Photo from '#models/photo'
import { generateDesignImage, getTemplate } from '#services/generation_service'
import { uploadDesign } from '#services/cloudinary_service'
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

  /**
   * POST /api/designs/:id/generate
   * Lance la génération IA de l'illustration. Auth optionnelle.
   * Ownership check : userId si connecté, sessionToken si anonyme.
   * Synchrone MVP — bloque jusqu'à la réponse Gemini (~20-30s).
   * TODO Growth : remplacer par queue BullMQ + polling /status
   */
  async generate({ params, request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(triggerGenerationValidator)
    const design = await Design.query().where('id', params.id).preload('photos').firstOrFail()

    // Vérification propriété — même logique que updateConfigure
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

    // Vérifications métier
    if (
      !design.partner1Name ||
      !design.partner2Name ||
      !design.weddingDate ||
      !design.weddingLocation ||
      !design.template
    ) {
      return response.badRequest({
        success: false,
        error: {
          code: 'DESIGN_NOT_CONFIGURED',
          message: "Le design n'est pas encore configuré.",
        },
      })
    }

    if (design.iterationsUsed >= 3) {
      return response.badRequest({
        success: false,
        error: {
          code: 'MAX_ITERATIONS_REACHED',
          message: 'Vous avez utilisé vos 3 itérations incluses.',
        },
      })
    }

    // Marquer le design comme en cours de génération
    await design.merge({ status: 'generating' }).save()

    try {
      // Charger les photos depuis leurs URLs Cloudinary en base64
      const photoInputs = await Promise.all(
        design.photos.map(async (photo) => {
          const res = await fetch(photo.cloudinaryUrl)
          if (!res.ok) {
            throw new Error(`Impossible de charger la photo (HTTP ${res.status})`)
          }
          const contentType = res.headers.get('content-type') ?? ''
          if (!contentType.startsWith('image/')) {
            throw new Error(`Type de contenu inattendu pour la photo: ${contentType}`)
          }
          const buffer = await res.arrayBuffer()
          const base64 = Buffer.from(buffer).toString('base64')
          const mimeType = contentType.split(';')[0].trim() as 'image/png' | 'image/jpeg'
          return { base64, mimeType }
        })
      )

      // Obtenir la config du template
      const theme = getTemplate(design.template)

      // Formater la date du mariage en français lisible pour le prompt
      const formattedDate = design.weddingDate.setLocale('fr').toFormat('d MMMM yyyy')

      const weddingData = {
        partner1Name: design.partner1Name,
        partner2Name: design.partner2Name,
        weddingDate: formattedDate,
        weddingLocation: design.weddingLocation,
      }

      // Générer via Gemini (retry 3× avec backoff exponentiel dans generateDesignImage)
      // iterationsUsed is 0-based before increment, so current iteration = iterationsUsed + 1
      const iterationNumber = design.iterationsUsed + 1
      const imageDataUrl = await generateDesignImage(
        photoInputs,
        theme,
        weddingData,
        iterationNumber,
        payload.feedback
      )

      // Upload vers Cloudinary et récupération de la preview watermarquée
      const { publicId, previewUrl } = await uploadDesign(imageDataUrl, design.id)

      // Mettre à jour le design avec les références Cloudinary et incrémenter le compteur
      await design
        .merge({
          status: 'completed',
          generatedImageUrl: imageDataUrl,
          cloudinaryPublicId: publicId,
          previewUrl: previewUrl,
          iterationsUsed: design.iterationsUsed + 1,
        })
        .save()

      return response.ok({
        success: true,
        data: {
          designId: design.id,
          status: 'completed',
          iterationsUsed: design.iterationsUsed,
          previewUrl: design.previewUrl,
        },
      })
    } catch (error) {
      // Remettre le status à 'draft' pour permettre un retry
      await design.merge({ status: 'draft' }).save()

      return response.internalServerError({
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: 'La génération a échoué. Veuillez réessayer.',
        },
      })
    }
  }

  /**
   * GET /api/designs/:id/status
   * Retourne le statut actuel du design pour le polling frontend.
   * Auth optionnelle via sessionToken en query param.
   */
  async status({ params, request, auth, response }: HttpContext) {
    const sessionToken = request.qs().sessionToken as string | undefined
    const design = await Design.find(params.id)

    if (!design) {
      return response.notFound({
        success: false,
        error: { code: 'DESIGN_NOT_FOUND', message: 'Design introuvable.' },
      })
    }

    // Vérification propriété légère
    const userId = auth.user?.id ?? null
    if (userId) {
      if (design.userId !== userId) {
        return response.forbidden({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Accès interdit.' },
        })
      }
    } else {
      if (!sessionToken || design.sessionToken !== sessionToken) {
        return response.forbidden({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Accès interdit.' },
        })
      }
    }

    return response.ok({
      success: true,
      data: {
        designId: design.id,
        status: design.status,
        iterationsUsed: design.iterationsUsed,
        previewUrl: design.previewUrl,
      },
    })
  }
}

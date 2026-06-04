import type { HttpContext } from '@adonisjs/core/http'
import {
  createDesignValidator,
  updateDesignTemplateValidator,
  updateDesignConfigureValidator,
  triggerGenerationValidator,
} from '#validators/design_validator'
import Design from '#models/design'
import Photo from '#models/photo'
import Generation from '#models/generation'
import { generateDesignImage, getPalette, getTemplate } from '#services/generation_service'
import { uploadDesign } from '#services/cloudinary_service'
import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

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

    await design.merge({ template: payload.template, palette: payload.palette ?? null }).save()

    return response.ok({
      success: true,
      data: {
        designId: design.id,
        template: design.template,
        palette: design.palette,
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

      // Obtenir la config du template et la palette résolue (défaut si null)
      const theme = getTemplate(design.template)
      const palette = getPalette(design.template, design.palette)

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

      // Pour les itérations, charger l'image précédente pour que Gemini la modifie
      let previousImage: { base64: string; mimeType: string } | undefined
      if (iterationNumber > 1 && payload.feedback && design.generatedImageUrl) {
        const dataUrlMatch = design.generatedImageUrl.match(/^data:(image\/\w+);base64,(.+)$/)
        if (dataUrlMatch) {
          previousImage = { mimeType: dataUrlMatch[1], base64: dataUrlMatch[2] }
        }
      }

      const outcome = await generateDesignImage(
        photoInputs,
        theme,
        palette,
        weddingData,
        iterationNumber,
        payload.feedback,
        previousImage
      )

      const costEurEstimate = env.get('GEMINI_COST_EUR_ESTIMATE') ?? 0.5

      // Échec de génération (après les 3 tentatives) : journaliser, persister la ligne
      // d'échec, repasser en draft pour autoriser un retry.
      if (!outcome.success) {
        await this.recordGeneration(design.id, iterationNumber, payload.feedback ?? null, {
          status: 'failed',
          promptUsed: outcome.promptUsed,
          geminiModel: outcome.geminiModel,
          generationDurationMs: outcome.durationMs,
          attempts: outcome.attempts,
          errorMessage: (outcome.error ?? 'Génération échouée').slice(0, 500),
        })
        logger.error(
          {
            event: 'generation_failed',
            designId: design.id,
            userId,
            template: design.template,
            iterationNumber,
            attempts: outcome.attempts,
            durationMs: outcome.durationMs,
            error: outcome.error,
          },
          'Generation failed'
        )
        await design.merge({ status: 'draft' }).save()
        return response.internalServerError({
          success: false,
          error: {
            code: 'GENERATION_FAILED',
            message: 'La génération a échoué. Veuillez réessayer.',
          },
        })
      }

      const imageDataUrl = outcome.imageDataUrl!

      // Upload vers Cloudinary et récupération de la preview watermarquée
      const { publicId, previewUrl } = await uploadDesign(imageDataUrl, design.id)

      // Persister la génération réussie (logs admin — Story 6.4) puis journaliser.
      await this.recordGeneration(design.id, iterationNumber, payload.feedback ?? null, {
        status: 'completed',
        promptUsed: outcome.promptUsed,
        geminiModel: outcome.geminiModel,
        generationDurationMs: outcome.durationMs,
        attempts: outcome.attempts,
        cloudinaryPublicId: publicId,
        cloudinaryUrl: previewUrl,
      })
      logger.info(
        {
          event: 'generation_succeeded',
          designId: design.id,
          userId,
          template: design.template,
          iterationNumber,
          attempts: outcome.attempts,
          durationMs: outcome.durationMs,
          costEurEstimate,
        },
        'Generation completed'
      )

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
      // Erreur d'infrastructure (chargement photos, upload Cloudinary…) — distincte d'un
      // échec Gemini (géré ci-dessus). Journaliser et repasser en draft pour un retry.
      logger.error(
        {
          event: 'generation_failed',
          designId: design.id,
          userId,
          template: design.template,
          error: error instanceof Error ? error.message : String(error),
        },
        'Generation pipeline error'
      )
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
   * Persiste une ligne `Generation` (logs admin — Story 6.4) de façon DÉFENSIVE :
   * une écriture de log qui échoue ne doit jamais faire échouer une génération
   * réussie ni masquer l'erreur d'origine. UNE seule ligne par appel `generate`
   * (le nombre de tentatives Gemini est porté par `attempts`).
   * Note : `geminiCostUsd` laissé null — coût réel réservé (cf. Story 6.4 Dev Notes),
   * le coût affiché/loggé est une estimation EUR.
   */
  private async recordGeneration(
    designId: number,
    iterationNumber: number,
    feedback: string | null,
    fields: {
      status: 'completed' | 'failed'
      promptUsed: string
      geminiModel: string
      generationDurationMs: number
      attempts: number
      cloudinaryPublicId?: string
      cloudinaryUrl?: string
      errorMessage?: string
    }
  ): Promise<void> {
    try {
      await Generation.create({
        designId,
        iterationNumber,
        feedback,
        promptUsed: fields.promptUsed,
        geminiModel: fields.geminiModel,
        status: fields.status,
        generationDurationMs: fields.generationDurationMs,
        attempts: fields.attempts,
        cloudinaryPublicId: fields.cloudinaryPublicId ?? null,
        cloudinaryUrl: fields.cloudinaryUrl ?? null,
        errorMessage: fields.errorMessage ?? null,
      })
    } catch (err) {
      logger.error(
        {
          event: 'generation_record_failed',
          designId,
          error: err instanceof Error ? err.message : String(err),
        },
        'Failed to persist generation log row'
      )
    }
  }

  /**
   * GET /api/designs/:id/status
   * Retourne le statut actuel du design pour le polling frontend.
   * Auth optionnelle via header X-Session-Token (query param accepté en fallback rétro-compat).
   */
  async status({ params, request, auth, response }: HttpContext) {
    const headerToken = request.header('x-session-token')
    const queryToken = request.qs().sessionToken as string | undefined
    let sessionToken: string | undefined =
      typeof headerToken === 'string' && headerToken.length > 0 ? headerToken : undefined
    if (!sessionToken && queryToken) {
      sessionToken = queryToken
      logger.warn(
        { event: 'session_token_qs_fallback', designId: params.id },
        'sessionToken reçu via query param — migration frontend incomplète'
      )
    }
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

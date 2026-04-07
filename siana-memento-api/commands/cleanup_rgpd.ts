import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import Photo from '#models/photo'
import Design from '#models/design'
import { deletePhoto, deleteDesign } from '#services/cloudinary_service'

export default class CleanupRgpd extends BaseCommand {
  static commandName = 'cleanup:rgpd'
  static description = 'Supprime les photos et designs expirés (RGPD J+7)'
  static options: CommandOptions = { startApp: true }

  async run() {
    const startTime = Date.now()
    let photosDeleted = 0
    let designsExpired = 0
    let errorsCount = 0
    const now = DateTime.now()

    // Phase 1 : Photos expirées
    // TODO Growth: paginate si volume > 1000 rows
    const expiredPhotos = await Photo.query().where(
      'expiresAt',
      '<',
      now.toSQL({ includeOffset: false })
    )

    for (const photo of expiredPhotos) {
      try {
        await deletePhoto(photo.cloudinaryPublicId)
        await photo.delete()
        photosDeleted++
        logger.info(
          {
            event: 'rgpd_cleanup',
            type: 'photo',
            id: photo.id,
            cloudinaryPublicId: photo.cloudinaryPublicId,
          },
          'Photo RGPD supprimée'
        )
      } catch (err) {
        errorsCount++
        logger.error(
          {
            event: 'rgpd_cleanup_error',
            type: 'photo',
            id: photo.id,
            cloudinaryPublicId: photo.cloudinaryPublicId,
            error: String(err),
          },
          'Échec suppression photo'
        )
      }
    }

    // Phase 2 : Designs expirés non achetés
    // TODO Growth: paginate si volume > 1000 rows
    const expiredDesigns = await Design.query()
      .where('expiresAt', '<', now.toSQL({ includeOffset: false }))
      .whereNot('status', 'paid')
      .whereNot('status', 'expired')

    for (const design of expiredDesigns) {
      try {
        if (design.cloudinaryPublicId) {
          try {
            await deleteDesign(design.cloudinaryPublicId)
          } catch (cloudinaryErr) {
            errorsCount++
            logger.error(
              {
                event: 'rgpd_cleanup_error',
                type: 'design_cloudinary',
                id: design.id,
                cloudinaryPublicId: design.cloudinaryPublicId,
                error: String(cloudinaryErr),
              },
              'Échec suppression Cloudinary design — design marqué expired quand même'
            )
          }
        }
        design.status = 'expired'
        await design.save()
        designsExpired++
        logger.info(
          {
            event: 'rgpd_cleanup',
            type: 'design',
            id: design.id,
            cloudinaryPublicId: design.cloudinaryPublicId,
          },
          'Design RGPD expiré'
        )
      } catch (err) {
        errorsCount++
        logger.error(
          {
            event: 'rgpd_cleanup_error',
            type: 'design',
            id: design.id,
            cloudinaryPublicId: design.cloudinaryPublicId,
            error: String(err),
          },
          'Échec expiration design'
        )
      }
    }

    const durationMs = Date.now() - startTime
    logger.info(
      { event: 'rgpd_cleanup_summary', photosDeleted, designsExpired, errorsCount, durationMs },
      'RGPD cleanup terminé'
    )

    this.logger.success(
      `RGPD cleanup terminé : ${photosDeleted} photos supprimées, ${designsExpired} designs expirés, ${errorsCount} erreurs (${durationMs}ms)`
    )
  }
}

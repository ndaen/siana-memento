import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import Testimonial from '#models/testimonial'
import {
  createTestimonialValidator,
  updateTestimonialValidator,
} from '#validators/testimonial_validator'

/**
 * TestimonialsController — CRUD admin + endpoint public (Story 6.7, FR50).
 *
 * Les actions `index`/`store`/`update`/`destroy` sont protégées par le groupe de
 * routes `/api/admin` (middleware auth + admin, NFR-S10) — pas par le contrôleur.
 * `publicIndex` est l'unique action publique (aucune auth) et n'expose que des
 * champs publics (id, authorName, content) des testimonials actifs.
 */
export default class TestimonialsController {
  /**
   * GET /api/testimonials — public, lecture seule (AC#3).
   * Ne retourne que les testimonials actifs, triés display_order puis created_at.
   * Sérialisation explicite : pas d'exposition de is_active/timestamps.
   */
  async publicIndex({ response }: HttpContext) {
    const testimonials = await Testimonial.query()
      .where('is_active', true)
      .orderBy('display_order', 'asc')
      .orderBy('created_at', 'asc')

    return response.ok({
      success: true,
      data: testimonials.map((t) => ({
        id: t.id,
        authorName: t.authorName,
        content: t.content,
        rating: t.rating,
      })),
    })
  }

  /**
   * GET /api/admin/testimonials — liste complète (actifs + inactifs) pour la gestion.
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    logger.info({ event: 'admin_testimonials_view', userId: user.id }, 'Admin testimonials viewed')

    const testimonials = await Testimonial.query()
      .orderBy('display_order', 'asc')
      .orderBy('created_at', 'asc')

    return response.ok({ success: true, data: testimonials })
  }

  /**
   * POST /api/admin/testimonials — créer un testimonial (AC#1).
   */
  async store({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createTestimonialValidator)

    const testimonial = await Testimonial.create({
      authorName: payload.authorName,
      content: payload.content,
      isActive: payload.isActive ?? true,
      displayOrder: payload.displayOrder ?? 0,
      rating: payload.rating ?? 5,
    })

    logger.info(
      { event: 'admin_testimonial_create', userId: user.id, testimonialId: testimonial.id },
      'Admin testimonial created'
    )

    return response.created({ success: true, data: testimonial })
  }

  /**
   * PATCH /api/admin/testimonials/:id — modifier (texte/prénom) ou toggle is_active (AC#2).
   */
  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const testimonial = await Testimonial.find(params.id)
    if (!testimonial) {
      return response.notFound({
        success: false,
        error: { code: 'TESTIMONIAL_NOT_FOUND', message: 'Témoignage introuvable.' },
      })
    }

    const payload = await request.validateUsing(updateTestimonialValidator)
    testimonial.merge(payload)
    await testimonial.save()

    logger.info(
      {
        event: 'admin_testimonial_update',
        userId: user.id,
        testimonialId: testimonial.id,
        isActive: testimonial.isActive,
      },
      'Admin testimonial updated'
    )

    return response.ok({ success: true, data: testimonial })
  }

  /**
   * DELETE /api/admin/testimonials/:id — suppression définitive (hard delete, AC#4).
   */
  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const testimonial = await Testimonial.find(params.id)
    if (!testimonial) {
      return response.notFound({
        success: false,
        error: { code: 'TESTIMONIAL_NOT_FOUND', message: 'Témoignage introuvable.' },
      })
    }

    await testimonial.delete()

    logger.info(
      { event: 'admin_testimonial_delete', userId: user.id, testimonialId: testimonial.id },
      'Admin testimonial deleted'
    )

    return response.ok({ success: true })
  }
}

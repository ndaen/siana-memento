import vine from '@vinejs/vine'

/**
 * Validation de création d'un testimonial (AC#1).
 * Bornes de longueur = garde-fou anti-payload abusif + cohérence d'affichage.
 * `isActive` absent → défaut `true` appliqué côté contrôleur.
 */
export const createTestimonialValidator = vine.compile(
  vine.object({
    authorName: vine.string().trim().minLength(1).maxLength(100),
    content: vine.string().trim().minLength(1).maxLength(2000),
    isActive: vine.boolean().optional(),
    displayOrder: vine.number().withoutDecimals().min(0).optional(),
  })
)

/**
 * Validation de mise à jour partielle (PATCH) — tous les champs optionnels.
 * Permet le toggle `isActive` seul (AC#2) comme l'édition prénom/texte.
 */
export const updateTestimonialValidator = vine.compile(
  vine.object({
    authorName: vine.string().trim().minLength(1).maxLength(100).optional(),
    content: vine.string().trim().minLength(1).maxLength(2000).optional(),
    isActive: vine.boolean().optional(),
    displayOrder: vine.number().withoutDecimals().min(0).optional(),
  })
)

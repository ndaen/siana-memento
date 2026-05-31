import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Admin middleware — protège les endpoints /api/admin (NFR-S10).
 * À chaîner APRÈS le middleware `auth` (qui peuple `auth.user`).
 * Retourne 403 si l'utilisateur n'est pas admin. La vérification est faite côté
 * serveur sur chaque requête — le garde frontend n'est que cosmétique.
 */
export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user || !user.isAdmin) {
      return ctx.response.forbidden({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Accès réservé à l’administrateur.' },
      })
    }
    return next()
  }
}

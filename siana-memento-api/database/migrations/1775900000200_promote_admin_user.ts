import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * INERTE (no-op) — la promotion admin se fait désormais via la commande idempotente
 * `node ace admin:promote <email>` (cf. commands/admin_promote.ts), pas via une migration
 * silencieuse. Conservée vide pour ne pas casser l'historique de migrations déjà appliqué.
 */
export default class extends BaseSchema {
  async up() {}

  async down() {}
}

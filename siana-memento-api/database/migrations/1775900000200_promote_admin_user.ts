import { BaseSchema } from '@adonisjs/lucid/schema'

const ADMIN_EMAIL = 'daennoah@gmail.com'

export default class extends BaseSchema {
  /**
   * Promeut le compte admin (Aldo). Idempotent : si le compte n'existe pas encore
   * (ex. base de test/CI fraîche), l'UPDATE affecte 0 ligne sans erreur. Une fois le
   * compte créé via inscription/OAuth, re-jouer cette migration n'est pas nécessaire —
   * promouvoir manuellement si besoin.
   */
  async up() {
    this.defer(async (db) => {
      await db.rawQuery('UPDATE users SET is_admin = true WHERE email = ?', [ADMIN_EMAIL])
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery('UPDATE users SET is_admin = false WHERE email = ?', [ADMIN_EMAIL])
    })
  }
}

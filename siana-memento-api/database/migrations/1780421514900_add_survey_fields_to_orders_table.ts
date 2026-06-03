import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Idempotence du survey (D3) : set uniquement après envoi réussi. NULL = pas encore enquêté.
      table.timestamp('survey_sent_at').nullable()
      // Token opaque pour la page publique de réponse sans auth (D5). 64 hex (randomBytes(32)).
      table.string('survey_token', 64).nullable().unique()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('survey_sent_at')
      table.dropColumn('survey_token')
    })
  }
}

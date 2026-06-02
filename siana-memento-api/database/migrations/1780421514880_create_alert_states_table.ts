import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'alert_states'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      // Type d'alerte ('error_rate' | 'api_cost' | 'rate_limit'). UNIQUE = 1 état par type.
      table.string('alert_type', 50).notNullable().unique()
      // Dernier déclenchement effectif (envoi email) — base du cooldown anti-spam (D5).
      table.timestamp('last_triggered_at').notNullable()
      // Valeur déclenchante humainement lisible (ex. "7.2%", "0,82€", "3 erreurs 429").
      table.string('last_value', 255).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

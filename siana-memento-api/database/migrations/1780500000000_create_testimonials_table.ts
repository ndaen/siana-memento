import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'testimonials'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      // Prénom du client (preuve sociale) — AC#1.
      table.string('author_name', 100).notNullable()
      // Texte du témoignage affiché sur la landing — AC#1.
      table.text('content').notNullable()
      // Flag d'affichage : true = visible sur la landing, false = retiré sans suppression — AC#2.
      table.boolean('is_active').notNullable().defaultTo(true)
      // Ordre d'affichage stable sur la landing (tri secondaire created_at).
      table.integer('display_order').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Le GET public filtre is_active=true à chaque requête de landing (fréquent).
      table.index(['is_active'], 'testimonials_is_active_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

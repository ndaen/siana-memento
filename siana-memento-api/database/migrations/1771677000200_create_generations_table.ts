import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'generations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('design_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('designs')
        .onDelete('CASCADE')
      table.integer('iteration_number').unsigned().notNullable() // 1, 2 ou 3
      table.text('prompt_used').notNullable()
      table.text('feedback').nullable() // feedback utilisateur pour l'itération suivante
      table
        .enum('status', ['pending', 'generating', 'completed', 'failed'])
        .notNullable()
        .defaultTo('pending')
      table.string('gemini_model', 100).nullable()
      table.string('cloudinary_public_id', 255).nullable()
      table.string('cloudinary_url', 500).nullable()
      table.integer('generation_duration_ms').unsigned().nullable() // monitoring NFR-P1
      table.decimal('gemini_cost_usd', 10, 6).nullable() // cost tracking admin (FR35)
      table.string('error_message', 500).nullable()
      table.integer('attempts').unsigned().notNullable().defaultTo(1) // retry logic NFR-SC6

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

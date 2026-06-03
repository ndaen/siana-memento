import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'survey_responses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      // 1 réponse par commande (D4/D6) : FK UNIQUE → 409 sur double soumission.
      table
        .integer('order_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')
      // FR48 : 3 questions. Notes 1..5 (validées 1..5 côté VineJS), recommandation booléenne.
      table.smallint('overall_satisfaction').notNullable()
      table.smallint('design_quality').notNullable()
      table.boolean('would_recommend').notNullable()
      table.timestamp('submitted_at').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

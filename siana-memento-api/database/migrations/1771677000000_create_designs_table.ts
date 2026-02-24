import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'designs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('session_token', 100).notNullable().unique()
      table
        .enum('template', ['boheme', 'moderne', 'classique', 'vintage', 'minimaliste'])
        .nullable()
      table.string('partner_1_name', 100).nullable()
      table.string('partner_2_name', 100).nullable()
      table.date('wedding_date').nullable()
      table.string('wedding_location', 255).nullable()
      table
        .enum('status', ['draft', 'generating', 'completed', 'paid', 'expired'])
        .notNullable()
        .defaultTo('draft')
      table.integer('iterations_used').unsigned().notNullable().defaultTo(0)
      table.timestamp('expires_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

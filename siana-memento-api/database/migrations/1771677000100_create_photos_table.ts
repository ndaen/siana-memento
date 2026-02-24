import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'photos'

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
      table.integer('position').unsigned().notNullable() // 1 ou 2
      table.string('cloudinary_public_id', 255).notNullable()
      table.string('cloudinary_url', 500).notNullable()
      table.timestamp('expires_at').notNullable() // J+7 — utilisé par le cron RGPD (FR31)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

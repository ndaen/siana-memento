import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stripe_events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('stripe_event_id', 255).notNullable().unique()
      table.string('type', 100).notNullable()
      table.boolean('processed').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('processed_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('design_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('designs')
        .onDelete('CASCADE')
      table.string('stripe_session_id', 255).nullable().unique()
      table.string('stripe_payment_intent_id', 255).nullable()
      table.integer('amount').unsigned().notNullable().defaultTo(1990)
      table
        .enum('status', ['pending', 'paid', 'failed'])
        .notNullable()
        .defaultTo('pending')
      table.timestamp('paid_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

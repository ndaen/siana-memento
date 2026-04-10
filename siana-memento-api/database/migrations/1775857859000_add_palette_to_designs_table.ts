import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'designs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('palette', 50).nullable().defaultTo(null)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('palette')
    })
  }
}

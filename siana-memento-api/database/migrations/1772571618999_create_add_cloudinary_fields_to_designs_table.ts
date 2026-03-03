import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'designs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('cloudinary_public_id').nullable()
      table.string('preview_url', 1024).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('cloudinary_public_id')
      table.dropColumn('preview_url')
    })
  }
}

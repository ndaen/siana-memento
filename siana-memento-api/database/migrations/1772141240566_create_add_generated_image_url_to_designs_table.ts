import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'designs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Colonne TEXT (sans limite de taille) pour stocker le data URL base64 de l'image générée.
      // Une image PNG 3:4 en base64 peut peser 5-15 MB — VARCHAR serait insuffisant.
      // TODO Growth : uploader vers Cloudinary avant le checkout (Story 4.x) et stocker l'URL Cloudinary à la place.
      table.text('generated_image_url').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('generated_image_url')
    })
  }
}
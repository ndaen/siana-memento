import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'testimonials'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Note en étoiles affichée sur la landing (1 à 5). Défaut 5 pour les lignes
      // existantes. Borne 1-5 garantie en base (defense in depth) en plus du validator.
      table.integer('rating').notNullable().defaultTo(5).checkBetween([1, 5])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('rating')
    })
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Couvre la fenêtre temporelle 30j + filtre statut des agrégations dashboard (NFR-SC3, jusqu'à 10K commandes)
      table.index(['created_at', 'status'], 'idx_orders_created_status')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['created_at', 'status'], 'idx_orders_created_status')
    })
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Story 6.6 — ajoute la valeur `email_failed` à l'enum `orders.status`.
 *
 * `status` est une colonne `text` assortie d'une CHECK constraint Knex (`orders_status_check`,
 * cf. migration de création). On ne peut donc pas « ajouter une valeur d'enum » : il faut
 * remplacer la contrainte. `email_failed` marque une commande payée dont la livraison email
 * a échoué — état récupérable permettant un renvoi manuel (AC1/AC4).
 */
export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.raw('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check')
    this.schema.raw(
      `ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'paid', 'failed', 'email_failed'))`
    )
  }

  async down() {
    this.schema.raw('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check')
    // Replier les lignes `email_failed` (récupérables, payées) sur `paid` avant de re-poser
    // la contrainte restrictive — sinon Postgres rejette l'ADD CONSTRAINT s'il en existe.
    this.schema.raw(`UPDATE orders SET status = 'paid' WHERE status = 'email_failed'`)
    this.schema.raw(
      `ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'paid', 'failed'))`
    )
  }
}

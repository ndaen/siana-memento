import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'

/**
 * Réponse au survey de satisfaction post-achat (FR48, Story 6.8).
 *
 * Une ligne par commande (`order_id` UNIQUE) — la 2ᵉ soumission est rejetée (409).
 * 3 questions : satisfaction globale (1-5), qualité design (1-5), recommandation (oui/non).
 */
export default class SurveyResponse extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: number

  @column()
  declare overallSatisfaction: number

  @column()
  declare designQuality: number

  @column()
  declare wouldRecommend: boolean

  @column.dateTime()
  declare submittedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>
}

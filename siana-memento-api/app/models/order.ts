import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Design from '#models/design'

export default class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare designId: number

  @column()
  declare stripeSessionId: string | null

  @column()
  declare stripePaymentIntentId: string | null

  @column()
  declare amount: number

  // 'email_failed' : payée mais livraison email échouée — récupérable via renvoi admin (Story 6.6).
  @column()
  declare status: 'pending' | 'paid' | 'failed' | 'email_failed'

  @column.dateTime()
  declare paidAt: DateTime | null

  @column.dateTime()
  declare emailSentAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Design)
  declare design: BelongsTo<typeof Design>
}

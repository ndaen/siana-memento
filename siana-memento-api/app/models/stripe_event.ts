import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class StripeEvent extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare stripeEventId: string

  @column()
  declare type: string

  @column()
  declare processed: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime()
  declare processedAt: DateTime | null
}

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Design from '#models/design'

export default class Photo extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare designId: number

  @column()
  declare position: number

  @column()
  declare cloudinaryPublicId: string

  @column()
  declare cloudinaryUrl: string

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Design)
  declare design: BelongsTo<typeof Design>
}

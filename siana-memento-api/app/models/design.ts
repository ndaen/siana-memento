import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Photo from '#models/photo'

export default class Design extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare sessionToken: string

  @column()
  declare template: 'boheme' | 'moderne' | 'classique' | 'vintage' | 'minimaliste' | null

  @column()
  declare partner1Name: string | null

  @column()
  declare partner2Name: string | null

  @column.date()
  declare weddingDate: DateTime | null

  @column()
  declare weddingLocation: string | null

  @column()
  declare status: 'draft' | 'generating' | 'completed' | 'paid' | 'expired'

  @column()
  declare iterationsUsed: number

  @column()
  declare generatedImageUrl: string | null

  @column()
  declare cloudinaryPublicId: string | null

  @column()
  declare previewUrl: string | null

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Photo)
  declare photos: HasMany<typeof Photo>
}

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Design from '#models/design'

export default class Generation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare designId: number

  @column()
  declare iterationNumber: number

  @column()
  declare promptUsed: string

  @column()
  declare feedback: string | null

  @column()
  declare status: 'pending' | 'generating' | 'completed' | 'failed'

  @column()
  declare geminiModel: string | null

  @column()
  declare cloudinaryPublicId: string | null

  @column()
  declare cloudinaryUrl: string | null

  @column()
  declare generationDurationMs: number | null

  // Coût Gemini par génération (USD). Renseigné par la Story 6.3 ; null tant que non persisté.
  @column()
  declare geminiCostUsd: number | null

  @column()
  declare errorMessage: string | null

  @column()
  declare attempts: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Design)
  declare design: BelongsTo<typeof Design>
}

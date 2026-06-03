import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Testimonial — preuve sociale affichée sur la landing (Story 6.7, FR50).
 *
 * Géré par l'admin via le CRUD `/api/admin/testimonials`. L'endpoint public
 * `GET /api/testimonials` ne retourne que les lignes `isActive = true`.
 * Pas de champ `rating`/`stars` (hors AC — Growth) : la landing affiche 5★ en dur.
 */
export default class Testimonial extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare authorName: string

  @column()
  declare content: string

  @column()
  declare isActive: boolean

  @column()
  declare displayOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}

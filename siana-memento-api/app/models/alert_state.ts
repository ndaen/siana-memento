import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type AlertType = 'error_rate' | 'api_cost' | 'rate_limit'

/**
 * État de déduplication des alertes admin (D5).
 *
 * Une ligne par type d'alerte (`alert_type` UNIQUE). La commande `alerts:check`
 * tournant toutes les 5 min, on ne ré-émet un email d'un type donné que si le
 * dernier déclenchement remonte à plus de `ALERT_COOLDOWN_MINUTES` (anti-flood).
 */
export default class AlertState extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare alertType: AlertType

  @column.dateTime()
  declare lastTriggeredAt: DateTime

  @column()
  declare lastValue: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}

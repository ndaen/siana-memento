import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Promeut un compte utilisateur au rôle admin (is_admin = true).
 *
 * Idempotente : rejouable sans effet de bord (un compte déjà admin reste admin).
 * Loggue le nombre de comptes promus ; WARN si aucun (email inconnu en base).
 *
 *   node ace admin:promote daennoah@gmail.com
 */
export default class AdminPromote extends BaseCommand {
  static commandName = 'admin:promote'
  static description = 'Promeut un utilisateur au rôle admin (is_admin = true) par email.'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Email du compte à promouvoir admin' })
  declare email: string

  async run() {
    const { default: User } = await import('#models/user')

    const updated = await User.query().where('email', this.email).update({ isAdmin: true })
    // Lucid renvoie le nombre de lignes affectées (forme variable selon le driver).
    const count = Array.isArray(updated) ? Number(updated[0]) : Number(updated)

    if (count > 0) {
      this.logger.success(`${count} compte(s) promu(s) admin : ${this.email}`)
    } else {
      this.logger.warning(
        `Aucun compte trouvé pour ${this.email} — créez/connectez ce compte d'abord, puis relancez.`
      )
    }
  }
}

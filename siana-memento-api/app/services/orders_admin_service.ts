import { DateTime } from 'luxon'
import Order from '#models/order'
import User from '#models/user'
import Design from '#models/design'
import { sendDesignDelivery } from '#services/email_service'

const MAX_PER_PAGE = 100

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'email_failed'

/** Entier borné, avec repli sur `fallback` si la valeur n'est pas finie (NaN/Infinity). */
function sanitizeInt(
  value: number | undefined,
  fallback: number,
  min: number,
  max?: number
): number {
  const n = Number.isFinite(value) ? Math.trunc(value as number) : fallback
  const lower = Math.max(min, n)
  return max === undefined ? lower : Math.min(max, lower)
}

export interface AdminOrderItem {
  id: number
  createdAt: string
  status: OrderStatus
  amountCents: number
  userId: number
  userEmail: string | null
  template: string | null
  emailSentAt: string | null
}

export interface AdminOrdersPage {
  meta: { total: number; perPage: number; currentPage: number; lastPage: number }
  items: AdminOrderItem[]
}

export type ResendResult =
  | { ok: true; status: OrderStatus; emailSentAt: string | null }
  | { ok: false; code: 'NOT_FOUND' | 'INVALID_STATUS' | 'SEND_FAILED'; message: string }

/**
 * Lecture/réparation des commandes pour l'espace admin (Story 6.6).
 *
 * - `listOrders` : liste paginée (récent d'abord) avec email client + template, filtrable par
 *   statut (notamment `email_failed`). Argent en CENTIMES (integer), comme MetricsService.
 * - `resendDelivery` : renvoie le design HR par email et met à jour le statut de la commande.
 *   La traçabilité (admin_id, timestamp) est loggée par l'appelant (AdminController, NFR-R8).
 */
export default class OrdersAdminService {
  async listOrders(options: {
    page?: number
    perPage?: number
    status?: OrderStatus
  }): Promise<AdminOrdersPage> {
    const page = sanitizeInt(options.page, 1, 1)
    const perPage = sanitizeInt(options.perPage, 20, 1, MAX_PER_PAGE)

    // Tri récent d'abord, départagé par id pour une pagination déterministe.
    const query = Order.query()
      .preload('user')
      .preload('design')
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
    if (options.status) {
      query.where('status', options.status)
    }

    const result = await query.paginate(page, perPage)
    const meta = result.getMeta()

    const items: AdminOrderItem[] = result.all().map((order) => ({
      id: order.id,
      createdAt: order.createdAt.toISO() ?? '',
      status: order.status,
      amountCents: order.amount,
      userId: order.userId,
      userEmail: order.user?.email ?? null,
      template: order.design?.template ?? null,
      emailSentAt: order.emailSentAt?.toISO() ?? null,
    }))

    return {
      meta: {
        total: meta.total,
        perPage: meta.perPage,
        currentPage: meta.currentPage,
        lastPage: meta.lastPage,
      },
      items,
    }
  }

  /**
   * Renvoie le design HR par email pour une commande donnée.
   * - Succès : statut → `paid`, `emailSentAt` mis à jour.
   * - Échec : statut conservé/forcé à `email_failed` (récupérable), erreur explicite.
   */
  async resendDelivery(orderId: number): Promise<ResendResult> {
    const order = await Order.find(orderId)
    if (!order) {
      return { ok: false, code: 'NOT_FOUND', message: 'Commande introuvable.' }
    }

    // Garde de statut (AC1) : le renvoi ne concerne que les livraisons email échouées.
    // Sans ce garde, renvoyer sur une commande `pending`/`failed` la forcerait à `paid`.
    if (order.status !== 'email_failed') {
      return {
        ok: false,
        code: 'INVALID_STATUS',
        message: 'Renvoi possible uniquement sur une commande en échec email.',
      }
    }

    const user = await User.find(order.userId)
    const design = await Design.find(order.designId)
    if (!user || !design) {
      return { ok: false, code: 'NOT_FOUND', message: 'Commande incomplète (client ou design manquant).' }
    }

    const result = await sendDesignDelivery(order, user, design)
    if (!result.success) {
      if (order.status !== 'email_failed') {
        order.status = 'email_failed'
        await order.save()
      }
      return { ok: false, code: 'SEND_FAILED', message: "L'envoi de l'email a échoué. Réessayez." }
    }

    order.status = 'paid'
    order.emailSentAt = DateTime.now()
    await order.save()
    return { ok: true, status: order.status, emailSentAt: order.emailSentAt.toISO() }
  }
}

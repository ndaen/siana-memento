import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { createOrderValidator } from '#validators/order_validator'
import Design from '#models/design'
import Order from '#models/order'
import { createCheckoutSession } from '#services/stripe_service'

function serializeOrderWithDesign(order: Order) {
  return {
    id: order.id,
    designId: order.designId,
    amount: order.amount,
    status: order.status,
    paidAt: order.paidAt,
    emailSentAt: order.emailSentAt,
    createdAt: order.createdAt,
    design: order.design
      ? {
          id: order.design.id,
          template: order.design.template,
          partner1Name: order.design.partner1Name,
          partner2Name: order.design.partner2Name,
          weddingDate: order.design.weddingDate,
          previewUrl: order.design.previewUrl,
        }
      : null,
  }
}

export default class OrdersController {
  /**
   * GET /api/orders
   * Returns all paid orders for the authenticated user, newest first.
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const orders = await Order.query()
      .where('userId', user.id)
      .where('status', 'paid')
      .preload('design')
      .orderBy('createdAt', 'desc')

    return response.ok({
      success: true,
      data: orders.map(serializeOrderWithDesign),
    })
  }

  /**
   * POST /api/orders
   * Creates an order and Stripe Checkout session. Auth required.
   */
  async store({ request, auth, response }: HttpContext) {
    const { designId, sessionToken } = await request.validateUsing(createOrderValidator)
    const user = auth.getUserOrFail()

    const design = await Design.find(designId)
    if (!design) {
      return response.notFound({
        success: false,
        error: { code: 'DESIGN_NOT_FOUND', message: 'Design introuvable.' },
      })
    }

    // Ownership check — claim design if anon→auth transition (sessionToken match)
    if (design.userId !== user.id) {
      if (design.userId === null) {
        // Guard: sessionToken required to claim an anonymous design
        if (!sessionToken) {
          return response.forbidden({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Token de session requis pour ce design.' },
          })
        }
        // Atomic claim — prevents race condition (UPDATE WHERE conditions)
        const result = await Design.query()
          .where('id', design.id)
          .whereNull('user_id')
          .where('session_token', sessionToken)
          .update({ user_id: user.id })
        const rowCount = Array.isArray(result) ? result[0] : result
        if (rowCount === 0) {
          return response.forbidden({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Token de session invalide.' },
          })
        }
        await design.refresh()
      } else {
        return response.forbidden({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Ce design ne vous appartient pas.' },
        })
      }
    }

    if (design.status === 'paid') {
      return response.unprocessableEntity({
        success: false,
        error: { code: 'DESIGN_ALREADY_PAID', message: 'Ce design a déjà été acheté.' },
      })
    }

    if (design.status !== 'completed') {
      return response.unprocessableEntity({
        success: false,
        error: { code: 'DESIGN_NOT_READY', message: 'Le design doit être finalisé avant achat.' },
      })
    }

    const order = await Order.create({
      userId: user.id,
      designId: design.id,
      amount: 1990,
      status: 'pending',
    })

    let session
    try {
      session = await createCheckoutSession(order, user.email)
    } catch (err) {
      logger.error({ event: 'stripe_checkout_failed', orderId: order.id, error: String(err) }, 'Stripe checkout session creation failed')
      order.status = 'failed'
      await order.save()
      return response.internalServerError({
        success: false,
        error: { code: 'STRIPE_SESSION_FAILED', message: 'Erreur lors de la création du paiement. Veuillez réessayer.' },
      })
    }

    return response.created({
      success: true,
      data: {
        orderId: order.id,
        checkoutUrl: session.url,
      },
    })
  }

  /**
   * GET /api/orders/:id
   * Returns order details. Auth required + ownership check.
   */
  async show({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await Order.query()
      .where('id', params.id)
      .preload('design')
      .first()

    if (!order) {
      return response.notFound({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Commande introuvable.' },
      })
    }

    if (order.userId !== user.id) {
      return response.forbidden({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Cette commande ne vous appartient pas.' },
      })
    }

    return response.ok({
      success: true,
      data: serializeOrderWithDesign(order),
    })
  }

  /**
   * GET /api/orders/by-session/:sessionId
   * Lookup order by Stripe session ID. Auth required + ownership check.
   */
  async showBySession({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await Order.query()
      .where('stripeSessionId', params.sessionId)
      .preload('design')
      .first()

    if (!order) {
      return response.notFound({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Commande introuvable.' },
      })
    }

    if (order.userId !== user.id) {
      return response.forbidden({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Cette commande ne vous appartient pas.' },
      })
    }

    return response.ok({
      success: true,
      data: serializeOrderWithDesign(order),
    })
  }
}

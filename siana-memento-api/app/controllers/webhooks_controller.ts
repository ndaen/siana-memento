import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import {
  constructWebhookEvent,
  handleCheckoutCompleted,
  isEventProcessed,
  markEventProcessed,
} from '#services/stripe_service'

export default class WebhooksController {
  /**
   * POST /api/webhooks/stripe
   * Handles Stripe webhook events. No auth middleware — validated by signature.
   */
  async handle({ request, response }: HttpContext) {
    const signature = request.header('stripe-signature')
    if (!signature) {
      return response.badRequest({ error: 'Missing stripe-signature header' })
    }

    let event
    try {
      const rawBody = request.raw() ?? ''
      event = constructWebhookEvent(rawBody, signature)
    } catch (err) {
      logger.warn(
        { event: 'webhook_signature_invalid', error: String(err) },
        'Invalid Stripe webhook signature'
      )
      return response.badRequest({ error: 'Invalid signature' })
    }

    // Idempotence check
    if (await isEventProcessed(event.id)) {
      return response.ok({ received: true })
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object)
          break
        default:
          logger.info(
            { event: 'webhook_unhandled_type', type: event.type },
            'Unhandled Stripe event type'
          )
      }

      await markEventProcessed(event.id, event.type)
    } catch (err) {
      logger.error(
        { event: 'webhook_processing_error', stripeEventId: event.id, error: String(err) },
        'Error processing Stripe webhook'
      )
      return response.internalServerError({ error: 'Webhook processing failed' })
    }

    return response.ok({ received: true })
  }
}

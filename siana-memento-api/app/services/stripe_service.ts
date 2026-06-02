import Stripe from 'stripe'
import env from '#start/env'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'
import Order from '#models/order'
import Design from '#models/design'
import User from '#models/user'
import StripeEvent from '#models/stripe_event'
import { DateTime } from 'luxon'
import { sendDesignDelivery } from '#services/email_service'

const stripe = new Stripe(env.get('STRIPE_SECRET_KEY'))

/**
 * Creates a Stripe Checkout Session for a given order.
 * Returns the full session object (caller uses session.url for redirect).
 */
export async function createCheckoutSession(order: Order, customerEmail: string) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: env.get('STRIPE_PRICE_ID'),
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    client_reference_id: String(order.id),
    metadata: {
      orderId: String(order.id),
      designId: String(order.designId),
    },
    success_url: `${env.get('FRONTEND_URL')}/generate/result?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.get('FRONTEND_URL')}/generate/result?canceled=true`,
  })

  order.stripeSessionId = session.id
  await order.save()

  return session
}

/**
 * Validates and constructs a Stripe webhook event from raw body + signature header.
 * Throws on invalid signature.
 */
export function constructWebhookEvent(rawBody: string, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(rawBody, signature, env.get('STRIPE_WEBHOOK_SECRET'))
}

/**
 * Processes a checkout.session.completed event.
 * ACID transaction: updates Order + Design status atomically.
 * Idempotent via stripe_events table.
 */
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.client_reference_id
  if (!orderId) {
    logger.error(
      { event: 'webhook_missing_reference', sessionId: session.id },
      'Missing client_reference_id'
    )
    return
  }

  const order = await Order.find(Number(orderId))
  if (!order) {
    logger.error({ event: 'webhook_order_not_found', orderId }, 'Order not found for webhook')
    return
  }

  await db.transaction(async (trx) => {
    order.useTransaction(trx)
    order.status = 'paid'
    order.paidAt = DateTime.now()
    order.stripePaymentIntentId = session.payment_intent as string | null
    await order.save()

    const design = await Design.findOrFail(order.designId, { client: trx })
    design.useTransaction(trx)
    design.status = 'paid'
    await design.save()
  })

  logger.info(
    {
      event: 'payment_succeeded',
      orderId: order.id,
      designId: order.designId,
      amount: order.amount,
      stripeSessionId: session.id,
    },
    'Payment confirmed'
  )

  // Email delivery — outside ACID transaction (fire-and-forget with logging)
  // Idempotence: skip if email was already sent (e.g. Stripe webhook retry)
  await order.refresh()
  if (order.emailSentAt) {
    logger.info(
      { event: 'delivery_email_skipped', orderId: order.id },
      'Email already sent, skipping (idempotent)'
    )
    return
  }

  const user = await User.findOrFail(order.userId)
  const design = await Design.findOrFail(order.designId)
  const result = await sendDesignDelivery(order, user, design)

  if (result.success) {
    order.emailSentAt = DateTime.now()
    await order.save()
  } else {
    // Échec d'envoi après paiement confirmé : la commande est conservée et passée en
    // `email_failed` (récupérable) pour permettre un renvoi manuel depuis l'admin (Story 6.6,
    // AC4). Aucune perte de données — `emailSentAt` reste null.
    order.status = 'email_failed'
    await order.save()
    logger.error(
      { event: 'delivery_email_failed_marked', orderId: order.id },
      'Delivery email failed — order marked email_failed for manual resend'
    )
  }
}

/**
 * Checks if a Stripe event has already been processed (idempotence).
 * Returns true if already processed.
 */
export async function isEventProcessed(stripeEventId: string): Promise<boolean> {
  const existing = await StripeEvent.findBy('stripeEventId', stripeEventId)
  return !!existing?.processed
}

/**
 * Marks a Stripe event as processed in the idempotence table.
 * Uses firstOrCreate to handle race conditions (concurrent webhook retries).
 */
export async function markEventProcessed(stripeEventId: string, type: string) {
  await StripeEvent.firstOrCreate(
    { stripeEventId },
    {
      stripeEventId,
      type,
      processed: true,
      processedAt: DateTime.now(),
    }
  )
}

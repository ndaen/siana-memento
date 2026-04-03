import { Resend } from 'resend'
import { v2 as cloudinary } from 'cloudinary'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import type Order from '#models/order'
import type User from '#models/user'
import type Design from '#models/design'

const resend = new Resend(env.get('RESEND_API_KEY'))

/**
 * Builds the Cloudinary URL for the original (non-watermarked) high-resolution design.
 */
function getOriginalDesignUrl(cloudinaryPublicId: string): string {
  return cloudinary.url(cloudinaryPublicId, { secure: true })
}

/**
 * Builds the delivery email HTML body.
 * MVP: inline template, no external template engine.
 */
function buildDeliveryHtml(design: Design): string {
  const partner1 = design.partner1Name || ''
  const partner2 = design.partner2Name || ''
  const names = partner1 && partner2 ? `${partner1} & ${partner2}` : partner1 || partner2 || ''
  const weddingDate = design.weddingDate
    ? design.weddingDate.setLocale('fr').toFormat('dd MMMM yyyy')
    : ''

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #2D4A3E; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 24px; color: #2D4A3E;">Votre Save the Date est prêt !</h1>

  <p style="font-size: 16px; line-height: 1.6;">
    ${names ? `Félicitations ${names} !` : 'Félicitations !'}
    ${weddingDate ? `Votre Save the Date pour le <strong>${weddingDate}</strong> est prêt.` : 'Votre Save the Date est prêt.'}
  </p>

  <p style="font-size: 16px; line-height: 1.6;">
    Vous trouverez votre design en haute résolution en pièce jointe de cet email.
  </p>

  <p style="font-size: 16px; line-height: 1.6;">
    Une question ? Répondez simplement à cet email, nous serons ravis de vous aider.
  </p>

  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;" />

  <p style="font-size: 12px; color: #888; line-height: 1.5;">
    Conformément à notre politique de confidentialité, vos photos seront supprimées sous 7 jours.
    Vous pouvez re-télécharger votre design depuis votre espace personnel pendant cette période.
  </p>

  <p style="font-size: 12px; color: #888;">
    Siana Memento — Votre Save the Date personnalisé par l'IA
  </p>
</body>
</html>`.trim()
}

/**
 * Sends the delivery email with the high-resolution design attached.
 * Returns success status and Resend message ID.
 * Does NOT throw on failure — logs the error and returns { success: false }.
 */
export async function sendDesignDelivery(
  order: Order,
  user: User,
  design: Design
): Promise<{ success: boolean; resendId?: string }> {
  const toEmail = user.email.trim()

  if (!design.cloudinaryPublicId) {
    logger.error(
      { event: 'delivery_email_failed', orderId: order.id, reason: 'missing_cloudinary_public_id' },
      'Cannot send delivery email: design has no cloudinaryPublicId'
    )
    return { success: false }
  }

  try {
    // Fetch the original (non-watermarked) high-resolution image from Cloudinary
    const originalUrl = getOriginalDesignUrl(design.cloudinaryPublicId)
    const imageResponse = await fetch(originalUrl)

    if (!imageResponse.ok) {
      logger.error(
        {
          event: 'delivery_email_failed',
          orderId: order.id,
          reason: 'cloudinary_fetch_failed',
          status: imageResponse.status,
          url: originalUrl,
        },
        'Failed to fetch design image from Cloudinary'
      )
      return { success: false }
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    const { data, error } = await resend.emails.send({
      from: env.get('RESEND_FROM_EMAIL'),
      to: toEmail,
      subject: 'Votre Save the Date est prêt ! — Siana Memento',
      html: buildDeliveryHtml(design),
      attachments: [
        {
          filename: 'save-the-date.png',
          content: imageBuffer,
        },
      ],
    })

    if (error) {
      logger.error(
        { event: 'delivery_email_failed', orderId: order.id, resendError: error },
        'Resend API returned an error'
      )
      return { success: false }
    }

    logger.info(
      { event: 'delivery_email_sent', orderId: order.id, resendId: data?.id, to: toEmail },
      'Delivery email sent successfully'
    )
    return { success: true, resendId: data?.id }
  } catch (err) {
    logger.error(
      { event: 'delivery_email_failed', orderId: order.id, error: String(err) },
      'Unexpected error sending delivery email'
    )
    return { success: false }
  }
}

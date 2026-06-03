import { Resend } from 'resend'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import { getOriginalDesignUrl } from '#services/cloudinary_service'
import type Order from '#models/order'
import type User from '#models/user'
import type Design from '#models/design'

// Exporté pour permettre aux tests de stubber `resend.emails.send` (pas d'appel réseau réel
// en test, comme la philosophie des specs delivery qui n'envoient jamais réellement).
export const resend = new Resend(env.get('RESEND_API_KEY'))

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

/**
 * Builds the satisfaction survey invite email HTML body (Story 6.8, FR48).
 * Inline template, Vert Sauge #2D4A3E, un seul CTA vers la page publique de réponse.
 */
function buildSurveyHtml(design: Design, surveyUrl: string): string {
  const partner1 = design.partner1Name || ''
  const partner2 = design.partner2Name || ''
  const names = partner1 && partner2 ? `${partner1} & ${partner2}` : partner1 || partner2 || ''

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #2D4A3E; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 24px; color: #2D4A3E;">Comment s'est passée votre expérience ?</h1>

  <p style="font-size: 16px; line-height: 1.6;">
    ${names ? `Bonjour ${names},` : 'Bonjour,'}
  </p>

  <p style="font-size: 16px; line-height: 1.6;">
    Nous espérons que votre Save the Date vous plaît ! Votre avis nous aide énormément à
    améliorer Siana Memento. Cela ne prend qu'une minute :
  </p>

  <ul style="font-size: 15px; line-height: 1.6; padding-left: 20px;">
    <li>Votre satisfaction globale (de 1 à 5)</li>
    <li>La qualité de votre design (de 1 à 5)</li>
    <li>Nous recommanderiez-vous ? (Oui / Non)</li>
  </ul>

  <p style="text-align: center; margin: 32px 0;">
    <a href="${surveyUrl}" style="display: inline-block; background-color: #2D4A3E; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px;">
      Donner mon avis (1 min)
    </a>
  </p>

  <p style="font-size: 13px; color: #888; line-height: 1.5;">
    Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
    <a href="${surveyUrl}" style="color: #2D4A3E;">${surveyUrl}</a>
  </p>

  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;" />

  <p style="font-size: 12px; color: #888;">
    Siana Memento — Votre Save the Date personnalisé par l'IA
  </p>
</body>
</html>`.trim()
}

/**
 * Sends the satisfaction survey invite email via Resend (Story 6.8, AC#1).
 * Returns success status and Resend message ID.
 * Does NOT throw on failure — logs the error and returns { success: false }
 * (la commande survey:send ne marquera alors PAS survey_sent_at → réessai au run suivant, D3).
 */
export async function sendSurveyInvite(
  order: Order,
  user: User,
  design: Design,
  surveyUrl: string
): Promise<{ success: boolean; resendId?: string }> {
  const toEmail = user.email.trim()

  try {
    const { data, error } = await resend.emails.send({
      from: env.get('RESEND_FROM_EMAIL'),
      to: toEmail,
      subject: "Comment s'est passée votre expérience ? — Siana Memento",
      html: buildSurveyHtml(design, surveyUrl),
    })

    if (error) {
      logger.error(
        { event: 'survey_email_failed', orderId: order.id, resendError: error },
        'Resend API returned an error for survey invite'
      )
      return { success: false }
    }

    logger.info(
      { event: 'survey_email_sent', orderId: order.id, resendId: data?.id, to: toEmail },
      'Survey invite email sent successfully'
    )
    return { success: true, resendId: data?.id }
  } catch (err) {
    logger.error(
      { event: 'survey_email_failed', orderId: order.id, error: String(err) },
      'Unexpected error sending survey invite email'
    )
    return { success: false }
  }
}

/**
 * Builds an admin alert email body (inline HTML, Vert Sauge #2D4A3E).
 * Generic builder: a title + a list of HTML-safe lines.
 */
export function buildAlertHtml(title: string, lines: string[]): string {
  const items = lines
    .map(
      (line) => `<li style="font-size: 15px; line-height: 1.6; margin-bottom: 8px;">${line}</li>`
    )
    .join('')

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #2D4A3E; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; color: #2D4A3E;">${title}</h1>
  <ul style="padding-left: 20px;">${items}</ul>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;" />
  <p style="font-size: 12px; color: #888;">
    Siana Memento — Alerte automatique (commande alerts:check)
  </p>
</body>
</html>`.trim()
}

/**
 * Sends an admin alert email via Resend.
 * Returns success status and Resend message ID.
 * Does NOT throw on failure — logs the error and returns { success: false }.
 * If ADMIN_ALERT_EMAIL is not configured, skips sending (no network call).
 */
export async function sendAdminAlert(
  type: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; resendId?: string; skipped?: boolean }> {
  const toEmail = env.get('ADMIN_ALERT_EMAIL')

  if (!toEmail) {
    logger.warn(
      { event: 'admin_alert_skipped', type, reason: 'missing_admin_alert_email' },
      'ADMIN_ALERT_EMAIL non configuré — alerte non envoyée'
    )
    return { success: false, skipped: true }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: env.get('RESEND_FROM_EMAIL'),
      to: toEmail,
      subject: `[Siana Alerte] ${subject}`,
      html: htmlBody,
    })

    if (error) {
      logger.error(
        { event: 'admin_alert_failed', type, resendError: error },
        'Resend API returned an error for admin alert'
      )
      return { success: false }
    }

    logger.info(
      { event: 'admin_alert_sent', type, resendId: data?.id },
      'Admin alert email sent successfully'
    )
    return { success: true, resendId: data?.id }
  } catch (err) {
    logger.error(
      { event: 'admin_alert_failed', type, error: String(err) },
      'Unexpected error sending admin alert email'
    )
    return { success: false }
  }
}

import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import ace from '@adonisjs/core/services/ace'
import { DateTime } from 'luxon'
import { createPaidOrderWithDesign } from '#tests/helpers/factories'
import { resend } from '#services/email_service'

/**
 * Stub Resend.emails.send pour ne JAMAIS taper le réseau en test (garde test Resend, K).
 * Retourne un succès simulé → la commande pose survey_sent_at/survey_token.
 */
function stubResendSuccess() {
  const original = resend.emails.send
  resend.emails.send = (async () => ({ data: { id: 'test_resend_id' }, error: null })) as any
  return () => {
    resend.emails.send = original
  }
}

function stubResendFailure() {
  const original = resend.emails.send
  resend.emails.send = (async () => ({
    data: null,
    error: { name: 'application_error', message: 'boom' },
  })) as any
  return () => {
    resend.emails.send = original
  }
}

test.group('survey:send', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('envoie le survey pour une commande paid livrée payée il y a 25h (AC#1/#4)', async ({
    assert,
    cleanup,
  }) => {
    const restore = stubResendSuccess()
    cleanup(restore)

    const { user } = await loginlessUser()
    const { order } = await createPaidOrderWithDesign(user.id, {
      paidAt: DateTime.now().minus({ hours: 25 }),
      emailSentAt: DateTime.now().minus({ hours: 25 }),
    })

    await ace.exec('survey:send', [])

    await order.refresh()
    assert.isNotNull(order.surveySentAt)
    assert.isNotNull(order.surveyToken)
    assert.lengthOf(order.surveyToken!, 64)
  })

  test('n’envoie pas pour une commande payée il y a 1h (trop récente)', async ({
    assert,
    cleanup,
  }) => {
    cleanup(stubResendSuccess())
    const { user } = await loginlessUser()
    const { order } = await createPaidOrderWithDesign(user.id, {
      paidAt: DateTime.now().minus({ hours: 1 }),
      emailSentAt: DateTime.now().minus({ hours: 1 }),
    })

    await ace.exec('survey:send', [])

    await order.refresh()
    assert.isNull(order.surveySentAt)
    assert.isNull(order.surveyToken)
  })

  test('n’envoie pas pour une commande payée il y a 31j (hors fenêtre rétroactive 30j, anti-flood)', async ({
    assert,
    cleanup,
  }) => {
    cleanup(stubResendSuccess())
    const { user } = await loginlessUser()
    const { order } = await createPaidOrderWithDesign(user.id, {
      paidAt: DateTime.now().minus({ days: 31 }),
      emailSentAt: DateTime.now().minus({ days: 31 }),
    })

    await ace.exec('survey:send', [])

    await order.refresh()
    assert.isNull(order.surveySentAt)
    assert.isNull(order.surveyToken)
  })

  test('n’envoie pas si email non livré (emailSentAt null)', async ({ assert, cleanup }) => {
    cleanup(stubResendSuccess())
    const { user } = await loginlessUser()
    const { order } = await createPaidOrderWithDesign(user.id, {
      status: 'email_failed',
      paidAt: DateTime.now().minus({ hours: 25 }),
      emailSentAt: null,
    })

    await ace.exec('survey:send', [])

    await order.refresh()
    assert.isNull(order.surveySentAt)
  })

  test('n’envoie pas si statut != paid', async ({ assert, cleanup }) => {
    cleanup(stubResendSuccess())
    const { user } = await loginlessUser()
    const { order } = await createPaidOrderWithDesign(user.id, {
      status: 'pending',
      paidAt: DateTime.now().minus({ hours: 25 }),
      emailSentAt: DateTime.now().minus({ hours: 25 }),
    })

    await ace.exec('survey:send', [])

    await order.refresh()
    assert.isNull(order.surveySentAt)
  })

  test('idempotence : une commande déjà enquêtée n’est pas ré-enquêtée (AC#4)', async ({
    assert,
    cleanup,
  }) => {
    cleanup(stubResendSuccess())
    const { user } = await loginlessUser()
    const alreadySent = DateTime.now().minus({ hours: 5 })
    const { order } = await createPaidOrderWithDesign(user.id, {
      paidAt: DateTime.now().minus({ hours: 25 }),
      emailSentAt: DateTime.now().minus({ hours: 25 }),
      surveySentAt: alreadySent,
      surveyToken: 'a'.repeat(64),
    })

    await ace.exec('survey:send', [])

    await order.refresh()
    // Inchangé : ni le token ni le timestamp ne bougent.
    assert.equal(order.surveyToken, 'a'.repeat(64))
    assert.equal(order.surveySentAt!.toMillis(), alreadySent.toMillis())
  })

  test('deux exécutions consécutives : survey_sent_at inchangé au 2ᵉ run (AC#4)', async ({
    assert,
    cleanup,
  }) => {
    cleanup(stubResendSuccess())
    const { user } = await loginlessUser()
    const { order } = await createPaidOrderWithDesign(user.id, {
      paidAt: DateTime.now().minus({ hours: 25 }),
      emailSentAt: DateTime.now().minus({ hours: 25 }),
    })

    await ace.exec('survey:send', [])
    await order.refresh()
    const firstToken = order.surveyToken
    const firstSentAt = order.surveySentAt!.toMillis()

    await ace.exec('survey:send', [])
    await order.refresh()
    assert.equal(order.surveyToken, firstToken)
    assert.equal(order.surveySentAt!.toMillis(), firstSentAt)
  })

  test('échec d’envoi → survey_sent_at reste NULL (récupérable, D3)', async ({
    assert,
    cleanup,
  }) => {
    cleanup(stubResendFailure())
    const { user } = await loginlessUser()
    const { order } = await createPaidOrderWithDesign(user.id, {
      paidAt: DateTime.now().minus({ hours: 25 }),
      emailSentAt: DateTime.now().minus({ hours: 25 }),
    })

    await ace.exec('survey:send', [])

    await order.refresh()
    assert.isNull(order.surveySentAt)
    assert.isNull(order.surveyToken)
  })
})

// Helper : crée un user minimal (les factories de commande n'ont pas besoin d'une session HTTP).
async function loginlessUser() {
  const { default: User } = await import('#models/user')
  const user = await User.create({
    email: `survey-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'motdepasse123',
    provider: 'email',
  })
  return { user }
}

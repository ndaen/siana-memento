import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { randomBytes } from 'node:crypto'
import User from '#models/user'
import SurveyResponse from '#models/survey_response'
import { createPaidOrderWithDesign, createSurveyResponse } from '#tests/helpers/factories'

async function createUser() {
  return User.create({
    email: `survey-http-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'motdepasse123',
    provider: 'email',
  })
}

const VALID_PAYLOAD = { overallSatisfaction: 5, designQuality: 4, wouldRecommend: true }

test.group('POST /api/survey/:token', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('réponse valide → 201 + SurveyResponse créée', async ({ client, assert }) => {
    const user = await createUser()
    const token = randomBytes(32).toString('hex')
    const { order } = await createPaidOrderWithDesign(user.id, { surveyToken: token })

    const response = await client.post(`/api/survey/${token}`).json(VALID_PAYLOAD)
    response.assertStatus(201)
    assert.isTrue(response.body().success)

    const saved = await SurveyResponse.findBy('orderId', order.id)
    assert.exists(saved)
    assert.equal(saved!.overallSatisfaction, 5)
    assert.equal(saved!.designQuality, 4)
    assert.isTrue(saved!.wouldRecommend)
  })

  test('token inconnu → 404', async ({ client, assert }) => {
    const response = await client
      .post(`/api/survey/${randomBytes(32).toString('hex')}`)
      .json(VALID_PAYLOAD)
    response.assertStatus(404)
    assert.isFalse(response.body().success)
    assert.equal(response.body().error.code, 'NOT_FOUND')
  })

  test('token malformé → 404 (validation format avant DB)', async ({ client, assert }) => {
    const response = await client.post('/api/survey/not-a-valid-token').json(VALID_PAYLOAD)
    response.assertStatus(404)
    assert.isFalse(response.body().success)
    assert.equal(response.body().error.code, 'NOT_FOUND')
  })

  test('2ᵉ soumission même token → 409 (D6)', async ({ client, assert }) => {
    const user = await createUser()
    const token = randomBytes(32).toString('hex')
    const { order } = await createPaidOrderWithDesign(user.id, { surveyToken: token })
    await createSurveyResponse(order.id)

    const response = await client.post(`/api/survey/${token}`).json(VALID_PAYLOAD)
    response.assertStatus(409)
    assert.equal(response.body().error.code, 'ALREADY_SUBMITTED')
  })

  test('note hors bornes (6) → 422', async ({ client }) => {
    const user = await createUser()
    const token = randomBytes(32).toString('hex')
    await createPaidOrderWithDesign(user.id, { surveyToken: token })

    const response = await client
      .post(`/api/survey/${token}`)
      .json({ ...VALID_PAYLOAD, overallSatisfaction: 6 })
    response.assertStatus(422)
  })

  test('note manquante → 422', async ({ client }) => {
    const user = await createUser()
    const token = randomBytes(32).toString('hex')
    await createPaidOrderWithDesign(user.id, { surveyToken: token })

    const response = await client
      .post(`/api/survey/${token}`)
      .json({ designQuality: 4, wouldRecommend: true })
    response.assertStatus(422)
  })

  test('recommandation non booléenne → 422', async ({ client }) => {
    const user = await createUser()
    const token = randomBytes(32).toString('hex')
    await createPaidOrderWithDesign(user.id, { surveyToken: token })

    const response = await client
      .post(`/api/survey/${token}`)
      .json({ ...VALID_PAYLOAD, wouldRecommend: 'peut-etre' })
    response.assertStatus(422)
  })
})

test.group('GET /api/survey/:token', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('token connu non répondu → état formulaire', async ({ client, assert }) => {
    const user = await createUser()
    const token = randomBytes(32).toString('hex')
    await createPaidOrderWithDesign(user.id, { surveyToken: token })

    const response = await client.get(`/api/survey/${token}`)
    response.assertStatus(200)
    assert.isTrue(response.body().success)
    assert.isFalse(response.body().data.alreadySubmitted)
  })

  test('token inconnu → 404', async ({ client }) => {
    const response = await client.get(`/api/survey/${randomBytes(32).toString('hex')}`)
    response.assertStatus(404)
  })

  test('token malformé → 404 (validation format avant DB)', async ({ client, assert }) => {
    const response = await client.get('/api/survey/not-a-valid-token')
    response.assertStatus(404)
    assert.equal(response.body().error.code, 'NOT_FOUND')
  })

  test('déjà répondu → alreadySubmitted true', async ({ client, assert }) => {
    const user = await createUser()
    const token = randomBytes(32).toString('hex')
    const { order } = await createPaidOrderWithDesign(user.id, { surveyToken: token })
    await createSurveyResponse(order.id)

    const response = await client.get(`/api/survey/${token}`)
    response.assertStatus(200)
    assert.isTrue(response.body().data.alreadySubmitted)
  })
})

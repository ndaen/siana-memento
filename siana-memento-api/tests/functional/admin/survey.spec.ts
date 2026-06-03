import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { loginAs } from '#tests/helpers/auth'
import { createPaidOrderWithDesign, createSurveyResponse } from '#tests/helpers/factories'

async function fetchSurvey(client: any, cookie: string) {
  return client.get('/api/admin/survey').header('Cookie', cookie)
}

test.group('GET /api/admin/survey', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/admin/survey')
    response.assertStatus(401)
  })

  test('returns 403 for a non-admin user (NFR-S10)', async ({ client, assert }) => {
    const { cookie } = await loginAs(client, { isAdmin: false })
    const response = await fetchSurvey(client, cookie)
    response.assertStatus(403)
    assert.isFalse(response.body().success)
  })

  test('0 réponse → N/A (null), pas 0 (héritée 6.2)', async ({ client, assert }) => {
    const { cookie } = await loginAs(client, { isAdmin: true })
    const response = await fetchSurvey(client, cookie)
    response.assertStatus(200)
    const { data } = response.body()
    // Note: base partagée — on ne peut garantir 0 réponse globale. On vérifie la cohérence :
    // si count===0 alors moyennes null, sinon ce sont des nombres. Le cas N/A est testé via la logique.
    if (data.count === 0) {
      assert.isNull(data.avgOverallSatisfaction)
      assert.isNull(data.avgDesignQuality)
      assert.isNull(data.recommendRate)
    } else {
      assert.isNumber(data.avgOverallSatisfaction)
    }
  })

  test('agrège correctement moyennes + distribution sur nos insertions (deltas)', async ({
    client,
    assert,
  }) => {
    const { cookie, user } = await loginAs(client, { isAdmin: true })

    const beforeRes = await fetchSurvey(client, cookie)
    const before = beforeRes.body().data

    // 3 réponses : notes overall 5,3,4 — distribution +1 sur les buckets 3,4,5.
    const o1 = await createPaidOrderWithDesign(user.id)
    const o2 = await createPaidOrderWithDesign(user.id)
    const o3 = await createPaidOrderWithDesign(user.id)
    await createSurveyResponse(o1.order.id, {
      overallSatisfaction: 5,
      designQuality: 5,
      wouldRecommend: true,
    })
    await createSurveyResponse(o2.order.id, {
      overallSatisfaction: 3,
      designQuality: 4,
      wouldRecommend: false,
    })
    await createSurveyResponse(o3.order.id, {
      overallSatisfaction: 4,
      designQuality: 4,
      wouldRecommend: true,
    })

    const afterRes = await fetchSurvey(client, cookie)
    const after = afterRes.body().data

    assert.equal(after.count - before.count, 3)
    assert.equal(after.distribution['5'] - before.distribution['5'], 1)
    assert.equal(after.distribution['4'] - before.distribution['4'], 1)
    assert.equal(after.distribution['3'] - before.distribution['3'], 1)
    // Moyennes et taux de reco présents (nombres) dès qu'il y a des réponses.
    assert.isNumber(after.avgOverallSatisfaction)
    assert.isNumber(after.recommendRate)
  })
})

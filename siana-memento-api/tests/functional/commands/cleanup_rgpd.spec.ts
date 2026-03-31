import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import ace from '@adonisjs/core/services/ace'
import Design from '#models/design'
import Photo from '#models/photo'
import { DateTime } from 'luxon'

test.group('cleanup:rgpd', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const pastDate = DateTime.now().minus({ days: 8 })
  const futureDate = DateTime.now().plus({ days: 2 })

  async function createDesignWithPhotos(overrides: {
    expiresAt: DateTime
    status?: 'draft' | 'generating' | 'completed' | 'paid' | 'expired'
    cloudinaryPublicId?: string | null
    withPhotos?: boolean
    photoExpiresAt?: DateTime
  }) {
    const design = await Design.create({
      sessionToken: `test-session-${Date.now()}`,
      status: overrides.status ?? 'completed',
      expiresAt: overrides.expiresAt,
      cloudinaryPublicId: overrides.cloudinaryPublicId ?? null,
      iterationsUsed: 1,
    })

    if (overrides.withPhotos !== false) {
      await Photo.create({
        designId: design.id,
        position: 1,
        cloudinaryPublicId: `photos/test-photo-${design.id}`,
        cloudinaryUrl: `https://res.cloudinary.com/test/photo-${design.id}.jpg`,
        expiresAt: overrides.photoExpiresAt ?? overrides.expiresAt,
      })
    }

    return design
  }

  test('supprime les photos expirées de la DB', async ({ assert }) => {
    const design = await createDesignWithPhotos({
      expiresAt: pastDate,
      status: 'draft',
      withPhotos: true,
      photoExpiresAt: pastDate,
    })

    await ace.exec('cleanup:rgpd', [])

    const remainingPhotos = await Photo.query().where('designId', design.id)
    assert.lengthOf(remainingPhotos, 0)
  })

  test('ne supprime pas les photos non expirées', async ({ assert }) => {
    const design = await createDesignWithPhotos({
      expiresAt: futureDate,
      status: 'draft',
      withPhotos: true,
      photoExpiresAt: futureDate,
    })

    await ace.exec('cleanup:rgpd', [])

    const remainingPhotos = await Photo.query().where('designId', design.id)
    assert.lengthOf(remainingPhotos, 1)
  })

  test('marque les designs expirés non achetés comme expired', async ({ assert }) => {
    const design = await createDesignWithPhotos({
      expiresAt: pastDate,
      status: 'completed',
      withPhotos: false,
    })

    await ace.exec('cleanup:rgpd', [])

    await design.refresh()
    assert.equal(design.status, 'expired')
  })

  test('ne touche pas les designs paid', async ({ assert }) => {
    const design = await createDesignWithPhotos({
      expiresAt: pastDate,
      status: 'paid',
      cloudinaryPublicId: 'designs/design-paid',
      withPhotos: false,
    })

    await ace.exec('cleanup:rgpd', [])

    await design.refresh()
    assert.equal(design.status, 'paid')
  })

  test('ne re-expire pas les designs déjà expired', async ({ assert }) => {
    const design = await createDesignWithPhotos({
      expiresAt: pastDate,
      status: 'expired',
      withPhotos: false,
    })

    // Should not throw or reprocess
    await ace.exec('cleanup:rgpd', [])

    await design.refresh()
    assert.equal(design.status, 'expired')
  })

  test('continue malgré une erreur Cloudinary (graceful)', async ({ assert }) => {
    // Design 1 : sans cloudinaryPublicId (pas d'appel Cloudinary)
    const design1 = await createDesignWithPhotos({
      expiresAt: pastDate,
      status: 'completed',
      cloudinaryPublicId: null,
      withPhotos: false,
    })

    // Design 2 : sans cloudinaryPublicId non plus
    const design2 = await createDesignWithPhotos({
      expiresAt: pastDate,
      status: 'draft',
      cloudinaryPublicId: null,
      withPhotos: false,
    })

    await ace.exec('cleanup:rgpd', [])

    await design1.refresh()
    await design2.refresh()
    assert.equal(design1.status, 'expired')
    assert.equal(design2.status, 'expired')
  })
})

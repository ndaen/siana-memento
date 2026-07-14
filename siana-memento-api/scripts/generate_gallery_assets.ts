/**
 * One-shot : génère les 5 assets de la galerie landing (story 7.4, Task 4).
 *
 * Le MÊME couple (photo de référence du hero) décliné dans les 5 templates, via le
 * vrai service de génération produit — les visuels de la landing montrent donc
 * exactement ce que l'app produit, pas un rendu maquetté à part.
 *
 * Usage :
 *   node --env-file=.env --import ts-node-maintained/register/esm scripts/generate_gallery_assets.ts [templateId...]
 *
 * Sans argument : les 5 templates. Avec arguments : seulement ceux-là (pour regénérer
 * un style raté sans repayer les 4 autres).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { generateDesignImage, getTemplate, getPalette } from '#services/generation_service'

// Résolus depuis scripts/ (import.meta.url) → remonte à la racine du monorepo.
const REFERENCE_PHOTO = '../../siana-memento-web/public/home/hero-couple-v2.png'
const OUTPUT_DIR = '../../siana-memento-web/public/home'

// Aligné sur le poster "après" du hero (hero-std-v2.png) : la galerie prolonge la
// narration du hero au lieu de présenter un couple inconnu.
const WEDDING_DATA = {
  partner1Name: 'Camille',
  partner2Name: 'Hugo',
  weddingDate: '14 juin 2026',
  weddingLocation: 'Provence, France',
}

const ALL_TEMPLATES = ['boheme', 'moderne', 'classique', 'vintage', 'minimaliste']

const targets = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ALL_TEMPLATES

const unknown = targets.filter((t) => !ALL_TEMPLATES.includes(t))
if (unknown.length > 0) {
  console.error(`Template(s) inconnu(s) : ${unknown.join(', ')}`)
  console.error(`Attendu parmi : ${ALL_TEMPLATES.join(', ')}`)
  process.exit(1)
}

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY absente — lance avec `node --env-file=.env ...`')
  process.exit(1)
}

const photo = {
  base64: readFileSync(new URL(REFERENCE_PHOTO, import.meta.url)).toString('base64'),
  mimeType: 'image/png',
}

console.log(`Photo de référence : ${REFERENCE_PHOTO}`)
console.log(`Couple : ${WEDDING_DATA.partner1Name} & ${WEDDING_DATA.partner2Name}`)
console.log(`Templates à générer : ${targets.join(', ')}\n`)

let failures = 0

for (const id of targets) {
  const template = getTemplate(id)
  const palette = getPalette(id, null) // palette par défaut = 1re du template
  process.stdout.write(`[${id}] génération (palette "${palette.name}")... `)

  const outcome = await generateDesignImage([photo], template, palette, WEDDING_DATA, 1)

  if (!outcome.success || !outcome.imageDataUrl) {
    failures++
    console.log(`ÉCHEC après ${outcome.attempts} tentative(s) : ${outcome.error}`)
    continue
  }

  const base64 = outcome.imageDataUrl.replace(/^data:image\/\w+;base64,/, '')
  const outPath = new URL(`${OUTPUT_DIR}/gallery-${id}.png`, import.meta.url)
  writeFileSync(outPath, Buffer.from(base64, 'base64'))

  const kb = Math.round(Buffer.from(base64, 'base64').length / 1024)
  console.log(
    `OK (${outcome.attempts} tentative(s), ${Math.round(outcome.durationMs / 1000)}s, ${kb} Ko)`
  )
}

console.log(`\n${targets.length - failures}/${targets.length} générées dans ${OUTPUT_DIR}/`)
process.exit(failures > 0 ? 1 : 0)

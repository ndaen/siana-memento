import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Testimonial from '#models/testimonial'

/**
 * Seeder de continuité (Story 6.7) : réinjecte les 3 testimonials qui étaient
 * hardcodés sur la landing (Story 5.3) afin que la section reste visible après
 * le passage de la landing en fetch dynamique sur l'API.
 *
 * Idempotent : ne crée chaque ligne que si elle n'existe pas déjà (par author_name).
 */
export default class extends BaseSeeder {
  async run() {
    const testimonials = [
      {
        authorName: 'Claire & Maxime',
        content:
          "On a reçu notre Save the Date en moins de 10 minutes, et le résultat est bluffant. Le style Bohème correspond parfaitement à notre mariage en Provence. Nos invités adorent !",
        displayOrder: 1,
        rating: 5,
      },
      {
        authorName: 'Manon & Romain',
        content:
          "Très sceptiques au départ sur l'IA, on a été agréablement surpris. L'illustration Moderne est élégante et ressemble vraiment à nos photos. Un rapport qualité-prix imbattable.",
        displayOrder: 2,
        rating: 4,
      },
      {
        authorName: 'Julie & Alexandre',
        content:
          "Simple, rapide et magnifique. On a choisi le style Classique et le rendu fait très professionnel. On recommande à 100% pour les couples qui veulent quelque chose d'unique sans se ruiner.",
        displayOrder: 3,
        rating: 5,
      },
    ]

    for (const data of testimonials) {
      const existing = await Testimonial.findBy('author_name', data.authorName)
      if (!existing) {
        await Testimonial.create({ ...data, isActive: true })
      }
    }
  }
}

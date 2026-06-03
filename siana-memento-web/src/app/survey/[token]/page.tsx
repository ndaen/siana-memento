import type { Metadata } from 'next'
import SurveyForm from '@/components/siana/SurveyForm'

export const metadata: Metadata = {
  title: 'Votre avis — Siana Memento',
  description: 'Partagez votre expérience avec Siana Memento.',
  // Page transactionnelle accessible par token : non indexable.
  robots: { index: false, follow: false },
}

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <main id="main-content" className="mx-auto max-w-xl px-6 py-16 sm:py-24">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Comment s’est passée votre expérience ?
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        Votre avis ne prend qu’une minute et nous aide à améliorer Siana Memento.
      </p>

      <SurveyForm token={token} />
    </main>
  )
}

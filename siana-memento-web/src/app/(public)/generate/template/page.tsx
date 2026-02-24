import type { Metadata } from 'next'
import TemplateGuard from '@/components/siana/TemplateGuard'
import TemplateSelector from '@/components/siana/TemplateSelector'

export const metadata: Metadata = {
  title: 'Choisissez votre style — Siana Memento',
}

export default function TemplatePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-xl">
        <p className="sr-only">Étape 2 sur 4</p>
        <h1 className="font-display mb-1 text-center text-3xl font-bold">Votre style</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Choisissez l&apos;univers artistique de votre Save the Date
        </p>
        <TemplateGuard>
          <TemplateSelector />
        </TemplateGuard>
      </div>
    </main>
  )
}

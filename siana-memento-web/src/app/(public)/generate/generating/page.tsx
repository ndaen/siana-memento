import type { Metadata } from 'next'
import GeneratingGuard from '@/components/siana/GeneratingGuard'
import GeneratingView from '@/components/siana/GeneratingView'

export const metadata: Metadata = {
  title: 'Création en cours — Siana Memento',
}

export default function GeneratingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-xl">
        <p className="sr-only">Étape 4 sur 4</p>
        <h1 className="mb-1 text-center text-3xl font-bold">Création en cours…</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Votre Save the Date unique est en train de prendre vie
        </p>
        <GeneratingGuard>
          <GeneratingView />
        </GeneratingGuard>
      </div>
    </main>
  )
}

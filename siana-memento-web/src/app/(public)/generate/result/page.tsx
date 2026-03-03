import type { Metadata } from 'next'
import ResultGuard from '@/components/siana/ResultGuard'
import ResultView from '@/components/siana/ResultView'

export const metadata: Metadata = {
  title: 'Votre Save the Date — Siana Memento',
}

export default function ResultPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-lg">
        <ResultGuard>
          <ResultView />
        </ResultGuard>
      </div>
    </main>
  )
}

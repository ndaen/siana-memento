import type { Metadata } from 'next'
import AdminComingSoon from '@/components/siana/AdminComingSoon'

export const metadata: Metadata = {
  title: 'Logs de génération — Siana Memento',
  robots: { index: false, follow: false },
}

// Placeholder — remplacé par la Story 6.4 (Logs de Génération et Historique Erreurs IA).
export default function AdminLogsRoute() {
  return <AdminComingSoon title="Logs de génération" />
}

import type { Metadata } from 'next'
import AdminComingSoon from '@/components/siana/AdminComingSoon'

export const metadata: Metadata = {
  title: 'Commandes — Siana Memento',
  robots: { index: false, follow: false },
}

// Placeholder — remplacé par la Story 6.6 (Renvoi Manuel de Designs et Backups DB).
export default function AdminOrdersRoute() {
  return <AdminComingSoon title="Commandes" />
}

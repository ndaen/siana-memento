import type { Metadata } from 'next'
import AdminDashboard from '@/components/siana/AdminDashboard'

export const metadata: Metadata = {
  title: 'Dashboard admin — Siana Memento',
  description: 'Métriques business et export des commandes.',
  robots: { index: false, follow: false },
}

export default function AdminDashboardRoute() {
  return <AdminDashboard />
}

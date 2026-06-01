import type { Metadata } from 'next'
import AdminComingSoon from '@/components/siana/AdminComingSoon'

export const metadata: Metadata = {
  title: 'Testimonials — Siana Memento',
  robots: { index: false, follow: false },
}

// Placeholder — remplacé par la Story 6.7 (Gestion des Testimonials — CRUD Admin).
export default function AdminTestimonialsRoute() {
  return <AdminComingSoon title="Testimonials" />
}

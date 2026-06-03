import type { Metadata } from 'next'
import AdminTestimonials from '@/components/siana/AdminTestimonials'

export const metadata: Metadata = {
  title: 'Testimonials — Siana Memento',
  robots: { index: false, follow: false },
}

export default function AdminTestimonialsRoute() {
  return <AdminTestimonials />
}

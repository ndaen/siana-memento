import type { Metadata } from 'next'
import AdminShell from '@/components/siana/AdminShell'

export const metadata: Metadata = {
  title: 'Administration — Siana Memento',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}

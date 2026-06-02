import type { Metadata } from 'next'
import AdminGenerationLogs from '@/components/siana/AdminGenerationLogs'

export const metadata: Metadata = {
  title: 'Logs de génération — Siana Memento',
  robots: { index: false, follow: false },
}

export default function AdminLogsRoute() {
  return <AdminGenerationLogs />
}

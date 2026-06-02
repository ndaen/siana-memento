import type { Metadata } from 'next'
import AdminOrders from '@/components/siana/AdminOrders'

export const metadata: Metadata = {
  title: 'Commandes — Siana Memento',
  robots: { index: false, follow: false },
}

export default function AdminOrdersRoute() {
  return <AdminOrders />
}

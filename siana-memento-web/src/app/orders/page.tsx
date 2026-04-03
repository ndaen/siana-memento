import type { Metadata } from 'next'
import OrdersPage from '@/components/siana/OrdersPage'

export const metadata: Metadata = {
  title: 'Mes commandes — Siana Memento',
  description: 'Retrouvez vos designs Save the Date achetés.',
}

export default function OrdersRoute() {
  return <OrdersPage />
}

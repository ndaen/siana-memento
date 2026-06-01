import { redirect } from 'next/navigation'

// /admin n'a pas d'écran propre : on envoie directement vers le dashboard.
export default function AdminIndexRoute() {
  redirect('/admin/dashboard')
}

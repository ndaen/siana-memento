'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import GoogleButton from '@/components/siana/GoogleButton'
import LoginForm from '@/components/siana/LoginForm'
import RegisterForm from '@/components/siana/RegisterForm'
import { getMe, type User } from '@/lib/api/auth'
import { toast } from 'sonner'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (user: User) => void
  returnTo?: string
  description?: string
}

type View = 'login' | 'register'

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  returnTo,
  description,
}: AuthModalProps) {
  const [view, setView] = useState<View>('login')

  async function handleRegisterSuccess() {
    // RegisterForm.onSuccess ne retourne pas le user — appeler getMe() pour l'obtenir
    const result = await getMe()
    if (result.success) {
      onAuthSuccess(result.user)
    } else {
      toast.error('Inscription réussie mais erreur de session. Veuillez vous reconnecter.')
      onClose()
    }
  }

  function handleLoginSuccess(user: User) {
    onAuthSuccess(user)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center">
            {view === 'login' ? 'Se connecter' : 'Créer un compte'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description ?? (view === 'login'
              ? 'Connectez-vous pour finaliser votre achat'
              : 'Créez votre compte pour recevoir votre design')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Google OAuth — bouton primaire */}
          <GoogleButton
            label="Continuer avec Google"
            returnTo={returnTo ?? '/'}
          />

          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Formulaire email/password */}
          {view === 'login' ? (
            <LoginForm onSuccess={handleLoginSuccess} />
          ) : (
            <RegisterForm onSuccess={handleRegisterSuccess} />
          )}

          {/* Toggle connexion ↔ inscription */}
          <p className="text-center text-sm text-muted-foreground">
            {view === 'login' ? (
              <>
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  className="underline underline-offset-4 hover:text-foreground transition-colors"
                  onClick={() => setView('register')}
                >
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button
                  type="button"
                  className="underline underline-offset-4 hover:text-foreground transition-colors"
                  onClick={() => setView('login')}
                >
                  Se connecter
                </button>
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
